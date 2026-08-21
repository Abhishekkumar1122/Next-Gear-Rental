import { NextResponse } from "next/server";
import { getJobs, addJob, deleteJob, getApplications } from "@/lib/jobs-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = getJobs();
  const applications = getApplications();
  return NextResponse.json({ jobs, applications });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, department, location, experienceYears, isTechnical, type, salaryRange, description, requirements, responsibilities } = body;

    if (!title || !department || !location || !experienceYears || !description) {
      return NextResponse.json({ error: "Missing required job fields" }, { status: 400 });
    }

    const newJob = addJob({
      title,
      department,
      location,
      experienceYears: experienceYears || (isTechnical ? "1-3 Years" : "0-3 Years"),
      isTechnical: Boolean(isTechnical),
      type: type || "Full-time",
      salaryRange: salaryRange || "Negotiable",
      description,
      requirements: Array.isArray(requirements) ? requirements : [requirements || "Relevant experience"],
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [responsibilities || "Key position duties"],
    });

    return NextResponse.json({ message: "Job posted successfully", job: newJob });
  } catch (error) {
    console.error("Job post error:", error);
    return NextResponse.json({ error: "Failed to post job opening" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const deleted = deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Job opening deleted successfully" });
  } catch (error) {
    console.error("Job delete error:", error);
    return NextResponse.json({ error: "Failed to delete job opening" }, { status: 500 });
  }
}
