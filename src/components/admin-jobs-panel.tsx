"use client";

import { useEffect, useState } from "react";

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  experienceYears: "0-3 Years" | "1-3 Years" | "0-2 Years";
  isTechnical: boolean;
  type: "Full-time" | "Remote" | "Hybrid" | "Contract";
  salaryRange: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  postedAt: string;
}

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  experienceYears: string;
  portfolioUrl?: string;
  coverNote?: string;
  resumeFileName: string;
  appliedAt: string;
}

export function AdminJobsPanel() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "post">("jobs");

  // New Job Form State
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Delhi NCR");
  const [experienceYears, setExperienceYears] = useState<"0-3 Years" | "1-3 Years">("0-3 Years");
  const [isTechnical, setIsTechnical] = useState(false);
  const [type, setType] = useState<"Full-time" | "Remote" | "Hybrid">("Full-time");
  const [salaryRange, setSalaryRange] = useState("₹4L - ₹7L / year");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadData() {
    try {
      const res = await fetch("/api/careers/jobs");
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load jobs data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const reqList = requirements.split("\n").filter((r) => r.trim().length > 0);

      const res = await fetch("/api/careers/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          department,
          location,
          experienceYears,
          isTechnical,
          type,
          salaryRange,
          description,
          requirements: reqList.length > 0 ? reqList : ["Relevant experience"],
          responsibilities: ["Fulfill key position duties", "Collaborate with team"],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post job");

      setMsg({ type: "success", text: "🎉 Job Opening posted live successfully!" });
      setTitle("");
      setDescription("");
      setRequirements("");
      void loadData();
      setActiveTab("jobs");
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error posting job";
      setMsg({ type: "error", text: m });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job opening?")) return;

    try {
      const res = await fetch(`/api/careers/jobs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        void loadData();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-black text-white">Careers & Job Openings Manager</h2>
          <p className="text-xs text-white/60">Post jobs, set experience levels (0-3 yrs / 1-3 yrs), and review candidate CVs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "jobs" ? "bg-[var(--brand-red)] text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Open Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "applications" ? "bg-[var(--brand-red)] text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            CV Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("post")}
            className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition flex items-center gap-1"
          >
            ➕ Post New Job
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-medium ${
            msg.type === "success" ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300" : "border-red-500/40 bg-red-950/60 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Tab Content 1: Open Jobs List */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-white/50 animate-pulse">Loading open jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-white/15 bg-white/5 p-8 text-center text-xs text-white/60">
              No open jobs. Click "Post New Job" to list a position.
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((j) => (
                <div key={j.id} className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-2 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold text-red-400">
                        {j.department}
                      </span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                        {j.experienceYears}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-white/70">
                        {j.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{j.title}</h3>
                    <p className="text-xs text-white/60">📍 {j.location} · 💰 {j.salaryRange} · Posted {j.postedAt}</p>
                  </div>

                  <button
                    onClick={() => void handleDeleteJob(j.id)}
                    className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs text-red-300 font-bold hover:bg-red-900/60 transition"
                  >
                    Delete Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Candidate CV Applications */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-xl border border-white/15 bg-white/5 p-8 text-center text-xs text-white/60">
              No submitted applications yet. Submitted CVs will appear here.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {applications.map((app) => (
                <div key={app.id} className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white text-sm">{app.applicantName}</span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] text-emerald-300 font-bold">
                      {app.experienceYears} Exp
                    </span>
                  </div>
                  <p className="font-semibold text-red-400">Position: {app.jobTitle}</p>
                  <p className="text-white/70">📧 Email: <strong className="text-white">{app.applicantEmail}</strong></p>
                  <p className="text-white/70">📞 Phone: <strong className="text-white">{app.applicantPhone}</strong></p>
                  <p className="text-white/70">📄 CV File: <strong className="text-cyan-300">{app.resumeFileName}</strong></p>
                  {app.portfolioUrl && (
                    <p className="text-white/70 truncate">🔗 Portfolio: <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">{app.portfolioUrl}</a></p>
                  )}
                  {app.coverNote && (
                    <p className="text-white/60 italic bg-black/30 p-2 rounded-lg border border-white/10">"{app.coverNote}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Post New Job Opening Form */}
      {activeTab === "post" && (
        <form onSubmit={handlePostJob} className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-4 text-xs">
          <h3 className="text-sm font-black text-white border-b border-white/10 pb-3">Post a New Position Live</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-white">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Operations Executive"
                className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-white">Department *</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering, Operations, Customer Success, etc."
                className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-white">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Delhi, Goa, Manali, Remote, etc."
                className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-white">Experience Required *</label>
              <select
                value={experienceYears}
                onChange={(e) => {
                  const val = e.target.value as "0-3 Years" | "1-3 Years";
                  setExperienceYears(val);
                  setIsTechnical(val === "1-3 Years");
                }}
                className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white focus:border-red-500 focus:outline-none"
              >
                <option value="0-3 Years">0 to 3 Years (Non-Tech / Ops / Support)</option>
                <option value="1-3 Years">1 to 3 Years (Technical / Engineering)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-white">Salary Range</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. ₹5L - ₹8L / year"
                className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white">Job Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of the role and responsibilities..."
              className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white">Key Requirements (1 per line)</label>
            <textarea
              rows={3}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Valid Driving License&#10;0-3 years experience in vehicle operations&#10;Strong communication skills"
              className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className="rounded-xl border border-white/20 px-4 py-2 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-rose-600 px-6 py-2 font-black text-white hover:brightness-110 disabled:opacity-50 transition shadow-lg shadow-red-600/30"
            >
              {saving ? "Posting Job..." : "Publish Job Opening Live"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
