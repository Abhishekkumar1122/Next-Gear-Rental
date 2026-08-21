import { NextResponse } from "next/server";
import { addApplication } from "@/lib/jobs-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const applicantName = formData.get("applicantName") as string;
    const applicantEmail = formData.get("applicantEmail") as string;
    const applicantPhone = formData.get("applicantPhone") as string;
    const experienceYears = (formData.get("experienceYears") as string) || "0-3 Years";
    const portfolioUrl = (formData.get("portfolioUrl") as string) || "";
    const coverNote = (formData.get("coverNote") as string) || "";
    const resumeFile = formData.get("resume") as File | null;

    if (!applicantName || !applicantEmail || !applicantPhone || !jobId) {
      return NextResponse.json({ error: "Missing required applicant details" }, { status: 400 });
    }

    if (!resumeFile) {
      return NextResponse.json({ error: "CV / Resume file is required" }, { status: 400 });
    }

    const application = addApplication({
      jobId,
      jobTitle: jobTitle || "General Application",
      applicantName,
      applicantEmail,
      applicantPhone,
      experienceYears,
      portfolioUrl,
      coverNote,
      resumeFileName: resumeFile.name || "resume.pdf",
    });

    return NextResponse.json({
      message: "Application submitted successfully! Our HR team will contact you shortly.",
      applicationId: application.id,
    });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json({ error: "Failed to submit job application" }, { status: 500 });
  }
}
