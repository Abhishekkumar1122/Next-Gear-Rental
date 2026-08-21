"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

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

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState("All");
  const [selectedExp, setSelectedExp] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobOpening | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobOpening | null>(null);

  // Form States
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState("0-3 Years");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/careers/jobs");
        const data = await res.json();
        if (res.ok && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadJobs();
  }, []);

  const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.department)))];
  const locations = ["All", "Delhi", "Manali", "Goa", "Mumbai", "Bangalore", "Remote"];

  const filteredJobs = jobs.filter((j) => {
    const matchesDept = selectedDept === "All" || j.department === selectedDept;
    const matchesLoc = selectedLoc === "All" || j.location.toLowerCase().includes(selectedLoc.toLowerCase());
    const matchesExp = selectedExp === "All" || j.experienceYears === selectedExp;
    const matchesQuery = searchQuery === "" || j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesLoc && matchesExp && matchesQuery;
  });

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    if (!resumeFile) {
      setStatusMessage({ type: "error", text: "Please upload your CV / Resume file (.pdf, .docx)" });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("jobId", applyingJob.id);
      formData.append("jobTitle", applyingJob.title);
      formData.append("applicantName", applicantName);
      formData.append("applicantEmail", applicantEmail);
      formData.append("applicantPhone", applicantPhone);
      formData.append("experienceYears", experienceYears);
      formData.append("portfolioUrl", portfolioUrl);
      formData.append("coverNote", coverNote);
      formData.append("resume", resumeFile);

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Application submission failed");
      }

      setStatusMessage({ type: "success", text: "🎉 Application submitted successfully! Our HR team will contact you shortly." });
      setApplicantName("");
      setApplicantEmail("");
      setApplicantPhone("");
      setPortfolioUrl("");
      setCoverNote("");
      setResumeFile(null);

      setTimeout(() => {
        setApplyingJob(null);
        setStatusMessage(null);
      }, 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit application";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/Logo1.png" alt="Next Gear Logo" width={36} height={36} className="h-9 w-9 object-contain" />
            <div>
              <span className="text-base font-black tracking-wider text-white group-hover:text-[var(--brand-red)] transition">NEXT GEAR</span>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-red-400 font-bold">Career Openings</span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/" className="hover:text-red-400 transition">Home</Link>
            <Link href="/vehicles" className="hover:text-red-400 transition">Fleet</Link>
            <Link href="/cities" className="hover:text-red-400 transition">Cities</Link>
            <Link href="/blogs" className="hover:text-red-400 transition">Blogs</Link>
            <Link href="/vehicles" className="rounded-full bg-[var(--brand-red)] px-4 py-2 text-white font-bold hover:bg-red-600 transition shadow-md shadow-red-600/30">
              🏎️ Book Ride
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with High-Impact WE ARE HIRING NOW Visuals */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-red-950/60 via-neutral-950 to-neutral-950 px-6 py-16 md:py-24">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/15 blur-[120px] pointer-events-none rounded-full" />

          <div className="relative mx-auto max-w-5xl text-center space-y-6">
            {/* WE ARE HIRING NOW Glowing Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/60 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-red-600/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="uppercase tracking-widest text-red-300">🔥 WE ARE HIRING NOW</span>
            </div>

            <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Build India's #1 Self-Drive <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
                Mobility Ecosystem
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Join Next Gear's high-energy team! We are actively recruiting for <strong className="text-white">Technical Roles (1–3 Yrs Exp)</strong> and <strong className="text-white">Operations & Customer Success (0–3 Yrs Exp)</strong> across Delhi, Manali, Goa, Mumbai, Bangalore & Remote!
            </p>

            {/* Quick Stats Banner Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3.5 text-center">
                <p className="text-lg font-black text-red-400">12+ Roles</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Actively Hiring</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3.5 text-center">
                <p className="text-lg font-black text-emerald-400">0 - 3 Yrs</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Ops & Support</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3.5 text-center">
                <p className="text-lg font-black text-cyan-400">1 - 3 Yrs</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Tech & Engg</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3.5 text-center">
                <p className="text-lg font-black text-amber-400">6+ Hubs</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">India & Remote</p>
              </div>
            </div>

            {/* Why Join Next Gear Perks */}
            <div className="grid sm:grid-cols-3 gap-4 pt-6 text-left max-w-4xl mx-auto">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
                <span className="text-xl">💰</span>
                <h3 className="font-bold text-white text-xs">Competitive Packages</h3>
                <p className="text-[11px] text-white/60">Attractive salary ranges (₹3.5L to ₹12L/yr) with performance bonuses.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
                <span className="text-xl">🏎️</span>
                <h3 className="font-bold text-white text-xs">Free Vehicle Rental Perks</h3>
                <p className="text-[11px] text-white/60">Enjoy free self-drive Thar, Creta & Himalayan bike credits for your trips.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
                <span className="text-xl">⚡</span>
                <h3 className="font-bold text-white text-xs">Fast Career Progression</h3>
                <p className="text-[11px] text-white/60">Direct ownership, leadership tracks, and rapid 6-month performance reviews.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar Section */}
        <section className="border-b border-white/10 bg-neutral-900/60 px-6 py-6 sticky top-[69px] z-30 backdrop-blur-md">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {/* Search input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title or keyword..."
                className="rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
              />

              {/* Department Dropdown */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                <option value="All">All Departments</option>
                {departments.filter((d) => d !== "All").map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Location Dropdown */}
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                <option value="All">All Locations</option>
                {locations.filter((l) => l !== "All").map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              {/* Experience Dropdown */}
              <select
                value={selectedExp}
                onChange={(e) => setSelectedExp(e.target.value)}
                className="rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                <option value="All">All Experience Levels</option>
                <option value="0-3 Years">0-3 Years (Non-Tech / Operations)</option>
                <option value="1-3 Years">1-3 Years (Technical / Engineering)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Job Openings List */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Current Open Positions ({filteredJobs.length})</h2>
              <p className="text-xs text-white/60">Apply with your CV for instant review by Next Gear HR</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-white/50 animate-pulse">Loading open positions...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-12 text-center space-y-3">
              <span className="text-3xl">🔍</span>
              <p className="text-base font-bold text-white">No openings found for selected filter</p>
              <p className="text-xs text-white/60">Try selecting 'All Departments' or resetting your search query.</p>
              <button
                onClick={() => { setSelectedDept("All"); setSelectedLoc("All"); setSelectedExp("All"); setSearchQuery(""); }}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-4 hover:border-red-500/50 transition duration-300 shadow-xl shadow-black/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                          {job.department}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          {job.experienceYears}
                        </span>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                          {job.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">{job.title}</h3>
                      <p className="text-xs text-white/60 flex items-center gap-3">
                        <span>📍 {job.location}</span>
                        <span>💰 {job.salaryRange}</span>
                        <span>🗓️ Posted {job.postedAt}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <button
                        onClick={() => setSelectedJobForModal(job)}
                        className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setApplyingJob(job);
                          setExperienceYears(job.experienceYears);
                        }}
                        className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:brightness-110 transition"
                      >
                        ⚡ Apply Now
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {job.requirements.slice(0, 3).map((req, rIdx) => (
                      <span key={rIdx} className="rounded-lg bg-black/40 border border-white/10 px-2.5 py-1 text-[10px] text-white/70">
                        • {req}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Job Details Modal */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-neutral-950 p-6 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">{selectedJobForModal.department}</span>
                <h3 className="text-xl font-black text-white">{selectedJobForModal.title}</h3>
                <p className="text-xs text-white/60">📍 {selectedJobForModal.location} · 💰 {selectedJobForModal.salaryRange}</p>
              </div>
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-white/80 leading-relaxed">
              <p className="text-sm font-semibold text-white">{selectedJobForModal.description}</p>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-red-400">Key Requirements ({selectedJobForModal.experienceYears})</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedJobForModal.requirements.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-red-400">Responsibilities</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedJobForModal.responsibilities.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setApplyingJob(selectedJobForModal);
                  setExperienceYears(selectedJobForModal.experienceYears);
                  setSelectedJobForModal(null);
                }}
                className="rounded-xl bg-[var(--brand-red)] px-5 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
              >
                ⚡ Apply for Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Application Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-neutral-950 p-6 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Job Application</span>
                <h3 className="text-lg font-black text-white">{applyingJob.title}</h3>
                <p className="text-xs text-white/60">Location: {applyingJob.location}</p>
              </div>
              <button
                onClick={() => { setApplyingJob(null); setStatusMessage(null); }}
                className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>

            {statusMessage && (
              <div
                className={`rounded-xl border p-3 text-xs font-medium ${
                  statusMessage.type === "success"
                    ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                    : "border-red-500/40 bg-red-950/60 text-red-300"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-white">Full Name *</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-white">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-white">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">Total Experience *</label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="0-3 Years">0 to 3 Years (Non-Technical / Operations)</option>
                  <option value="1-3 Years">1 to 3 Years (Technical / Engineering)</option>
                  <option value="Fresh Graduate">Fresh Graduate / Fresher</option>
                  <option value="3+ Years">3+ Years Experience</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">LinkedIn / Portfolio URL (Optional)</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* CV File Upload */}
              <div className="space-y-1">
                <label className="font-bold text-white">Upload CV / Resume (.pdf, .docx) *</label>
                <div className="relative border-2 border-dashed border-white/20 hover:border-red-500 rounded-xl p-4 text-center bg-black/30 transition">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <span className="text-2xl">📄</span>
                    <p className="text-xs font-semibold text-white">
                      {resumeFile ? resumeFile.name : "Click or drag CV file to upload"}
                    </p>
                    <p className="text-[10px] text-white/50">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">Cover Note / Remarks (Optional)</label>
                <textarea
                  rows={2}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Why are you a good fit for Next Gear?"
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setApplyingJob(null); setStatusMessage(null); }}
                  className="rounded-xl border border-white/20 px-4 py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-rose-600 px-6 py-2 font-black text-white hover:brightness-110 disabled:opacity-50 transition shadow-lg shadow-red-600/30"
                >
                  {submitting ? "Submitting CV..." : "Submit CV Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
