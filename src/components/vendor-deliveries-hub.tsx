"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { audioSynth } from "@/lib/audio-effects";
import {
  Truck,
  Phone,
  CheckCircle2,
  MapPin,
  Play,
  RotateCw,
  User,
  ShieldCheck,
  Navigation,
  Check,
  AlertCircle
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
}

interface DeliveryJob {
  id: string;
  bookingId: string;
  type: "delivery" | "pickup";
  status: "scheduled" | "en_route" | "arrived" | "completed" | "cancelled";
  scheduledAt?: string;
  assignedDriverId?: string;
  notes?: string;
  otpHint?: string;
  createdAt: string;
}

interface VendorDeliveriesHubProps {
  initialJobs: DeliveryJob[];
  drivers: Driver[];
}

export function VendorDeliveriesHub({ initialJobs, drivers }: VendorDeliveriesHubProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<DeliveryJob[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    initialJobs.length > 0 ? initialJobs[0].id : null
  );

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const assignedDriver = selectedJob
    ? drivers.find((d) => d.id === selectedJob.assignedDriverId) ?? {
        id: "drv-mock",
        name: "Rahul Verma",
        phone: "+91-98980-11223",
        vehicleNumber: "DL-10-AX-4521"
      }
    : null;

  // Simulator states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 100 percentage
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Path coords simulation for map
  const pathStart = { x: 40, y: 110, label: "Indira Gandhi Airport (DEL)" };
  const pathEnd = { x: 340, y: 30, label: "Connaught Place Hub (DEL)" };

  // Refetch jobs periodically or on mutation
  const refreshJobs = async () => {
    try {
      const res = await fetch("/api/delivery/jobs");
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
        }
      }
    } catch (e) {
      console.error("Failed to refetch delivery jobs:", e);
    }
  };

  // Simulate GPS coordinates movement timer
  useEffect(() => {
    let timer: any;
    if (isSimulating && selectedJob && selectedJob.status === "en_route") {
      timer = setInterval(() => {
        setSimProgress((prev) => {
          const next = prev + 10;
          if (next >= 100) {
            setIsSimulating(false);
            // Auto transition to arrived
            void updateJobStatus("arrived");
            return 100;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isSimulating, selectedJob]);

  // Reset simulator progress when job changes
  useEffect(() => {
    if (selectedJob) {
      if (selectedJob.status === "scheduled") {
        setSimProgress(0);
        setIsSimulating(false);
      } else if (selectedJob.status === "en_route") {
        setSimProgress(40);
      } else if (selectedJob.status === "arrived" || selectedJob.status === "completed") {
        setSimProgress(100);
        setIsSimulating(false);
      }
      setOtpCode("");
      setOtpError("");
      setOtpSuccess(false);
    }
  }, [selectedJobId]);

  // Update status API
  const updateJobStatus = async (status: string) => {
    if (!selectedJob) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/delivery/jobs/${selectedJob.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          message: `Delivery agent transitioned status to ${status.toUpperCase()}`,
        }),
      });
      if (res.ok) {
        audioSynth.playAlert();
        await refreshJobs();
      }
    } catch (err) {
      console.error("Error updating job status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Verify OTP API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setOtpError("");
    setOtpSuccess(false);

    try {
      const res = await fetch(`/api/delivery/jobs/${selectedJob.id}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode.trim() }),
      });
      
      const data = await res.json();
      if (res.ok && data.verified) {
        audioSynth.playSuccess();
        setOtpSuccess(true);
        await refreshJobs();
      } else {
        setOtpError("Incorrect verification code. Please check with customer.");
      }
    } catch {
      setOtpError("Failed to verify code due to a network error.");
    }
  };

  const handleCallDriver = () => {
    audioSynth.playAlert();
    alert(`Calling driver ${assignedDriver?.name} at ${assignedDriver?.phone}...`);
  };

  // Calculate coordinates along path for moving bike marker
  const getBikeCoords = () => {
    const ratio = simProgress / 100;
    const dx = pathEnd.x - pathStart.x;
    const dy = pathEnd.y - pathStart.y;
    // Add a slight arc/curve to the line
    const x = pathStart.x + dx * ratio;
    const y = pathStart.y + dy * ratio - Math.sin(ratio * Math.PI) * 20; // curve offset
    return { x, y };
  };

  const bikePos = getBikeCoords();

  return (
    <div className="grid gap-6 lg:grid-cols-3 text-white">
      {/* Sidebar - Jobs List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.02] p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Delivery Queue</h2>
              <p className="text-[10px] text-white/50">Active logistics routes</p>
            </div>
            <button
              onClick={refreshJobs}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 transition"
              aria-label="Refresh Jobs"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {jobs.length === 0 ? (
              <div className="py-8 text-center text-white/30">
                <Truck className="w-8 h-8 mx-auto mb-2 text-white/10" />
                <p className="text-xs font-semibold">No active routes found</p>
              </div>
            ) : (
              jobs.map((job) => {
                const isActive = job.id === selectedJobId;
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-1.5 ${
                      isActive
                        ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.08] shadow-[0_0_15px_rgba(225,29,72,0.15)]"
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--brand-red)]">
                        {job.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                          job.status === "completed"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : job.status === "en_route"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : job.status === "arrived"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white leading-tight">Route ID: {job.id}</h4>
                      <p className="text-[10px] text-white/40 font-mono">Booking: {job.bookingId}</p>
                    </div>

                    {job.scheduledAt && (
                      <p className="text-[9px] text-white/50 mt-1 border-t border-white/5 pt-1.5">
                        🗓️ {new Date(job.scheduledAt).toLocaleString("en-IN", { hour: "numeric", minute: "numeric", hour12: true, month: "short", day: "numeric" })}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Panel - Live Interactive Tracking & Timeline */}
      <div className="lg:col-span-2 space-y-4">
        {selectedJob ? (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.02] p-5 shadow-xl space-y-5">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-[var(--brand-red)] uppercase">
                  Logistics Tracking Terminal
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">Job: {selectedJob.id}</h2>
              </div>
              <div className="flex gap-2">
                {selectedJob.status === "scheduled" && (
                  <button
                    onClick={() => updateJobStatus("en_route")}
                    disabled={statusLoading}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_10px_rgba(37,99,235,0.2)]"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Start Route</span>
                  </button>
                )}
                {selectedJob.status === "en_route" && (
                  <button
                    onClick={() => updateJobStatus("arrived")}
                    disabled={statusLoading}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800/40 text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_10px_rgba(217,119,6,0.2)]"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Mark Arrived</span>
                  </button>
                )}
              </div>
            </div>

            {/* Simulated Live Dark Map */}
            <div className="relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden h-[180px] p-4 flex flex-col justify-between">
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/10 via-black to-black opacity-90 pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Map Coordinates & Path Graphics */}
              <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 380 140" fill="none">
                <defs>
                  <linearGradient id="routeGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Curved Path Line */}
                <path
                  d={`M ${pathStart.x} ${pathStart.y} Q 190 40, ${pathEnd.x} ${pathEnd.y}`}
                  stroke="url(#routeGlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Simulated active trajectory line */}
                <path
                  d={`M ${pathStart.x} ${pathStart.y} Q 190 40, ${pathEnd.x} ${pathEnd.y}`}
                  stroke="var(--brand-red)"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="animate-[dash_10s_linear_infinite]"
                  style={{ strokeDashoffset: -simProgress }}
                />

                {/* Start Location Node */}
                <circle cx={pathStart.x} cy={pathStart.y} r="6" className="fill-blue-500/80 stroke-white/20" strokeWidth="1" />
                <circle cx={pathStart.x} cy={pathStart.y} r="12" className="fill-blue-500/10 animate-ping" />

                {/* End Location Node */}
                <circle cx={pathEnd.x} cy={pathEnd.y} r="6" className="fill-[var(--brand-red)] stroke-white/20" strokeWidth="1" />
                <circle cx={pathEnd.x} cy={pathEnd.y} r="12" className="fill-[var(--brand-red)]/10 animate-ping" />

                {/* Rider Motorcycle Node (Only if route is en_route or active) */}
                {selectedJob.status !== "scheduled" && (
                  <g className="transition-all duration-300">
                    <circle cx={bikePos.x} cy={bikePos.y} r="8" className="fill-white stroke-[var(--brand-red)]" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.7))" }} />
                    <circle cx={bikePos.x} cy={bikePos.y} r="16" className="fill-[var(--brand-red)]/20 animate-ping" />
                  </g>
                )}
              </svg>

              {/* Labels overlay */}
              <div className="relative z-10 flex justify-between w-full text-[9px] font-bold uppercase tracking-wider text-white/50">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {pathStart.label}</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[var(--brand-red)] rounded-full" /> {pathEnd.label}</span>
              </div>

              {/* Simulation Controls inside the map */}
              {selectedJob.status === "en_route" && (
                <div className="relative z-10 flex items-center justify-between mt-auto">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-bold tracking-widest uppercase">GPS Simulator</span>
                  </div>
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/15 active:scale-95 text-[10px] font-black uppercase tracking-wider rounded-lg transition border border-white/5 flex items-center gap-1 cursor-pointer"
                  >
                    {isSimulating ? (
                      <>⏸️ Pause GPS</>
                    ) : (
                      <>▶️ Run GPS Route</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Drivers Profile Card */}
            {assignedDriver && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--brand-red)] to-red-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{assignedDriver.name}</h3>
                    <p className="text-[10px] text-white/50 mt-0.5">Scooter Plate: <span className="font-semibold text-white/80">{assignedDriver.vehicleNumber}</span></p>
                  </div>
                </div>
                <button
                  onClick={handleCallDriver}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition active:scale-90 cursor-pointer"
                  aria-label="Call Driver"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* OTP Verification Box */}
            {selectedJob.status === "arrived" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-widest">Awaiting Security OTP</h4>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  The driver has arrived at the customer's location. Obtain the secure handover verification OTP from the customer to complete this job.
                </p>

                <form onSubmit={handleVerifyOtp} className="flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-Digit OTP (e.g. 774542)"
                    maxLength={6}
                    className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
                  >
                    Confirm Delivery
                  </button>
                </form>

                {otpError && (
                  <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Completion Success Notification */}
            {selectedJob.status === "completed" && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.02] p-4 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                <h4 className="text-xs font-bold text-green-300">Delivery Completed Successfully</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">The vehicle has been successfully handed over to the rider. The booking remains fully active.</p>
              </div>
            )}

            {/* Timeline progress steps */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <h4 className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Tracking Timeline</h4>
              
              <div className="relative pl-6 space-y-5 text-xs">
                {/* Vertical line indicator */}
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-white/10" />

                {/* Timeline step items */}
                {[
                  { step: "scheduled", label: "Job Created & Driver Scheduled", desc: "Driver assigned and route configured." },
                  { step: "en_route", label: "En Route to Destination", desc: "Scooter loaded and dispatching active." },
                  { step: "arrived", label: "Arrived at Destination Hub", desc: "Driver reached coordinates, waiting check-in." },
                  { step: "completed", label: "Verify & Dispatch Complete", desc: "Booking verification OTP authorized." }
                ].map((item, index) => {
                  const statuses = ["scheduled", "en_route", "arrived", "completed"];
                  const currentIndex = statuses.indexOf(selectedJob.status);
                  const stepIndex = statuses.indexOf(item.step);
                  const isDone = stepIndex <= currentIndex;
                  const isCurrent = stepIndex === currentIndex;

                  return (
                    <div key={item.step} className="relative flex flex-col gap-0.5">
                      {/* Check dot */}
                      <span className={`absolute -left-[20px] top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold border transition ${
                        isDone
                          ? "bg-[var(--brand-red)] border-[var(--brand-red)] text-white shadow-[0_0_8px_rgba(225,29,72,0.4)]"
                          : "bg-black border-white/10 text-white/20"
                      }`}>
                        {isDone ? <Check className="w-2 h-2" /> : index + 1}
                      </span>

                      <span className={`font-bold ${isCurrent ? "text-white" : isDone ? "text-white/80" : "text-white/35"}`}>
                        {item.label}
                      </span>
                      <span className={`text-[10px] ${isCurrent ? "text-white/60" : "text-white/30"}`}>
                        {item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-12 text-center text-white/30">
            <Truck className="w-12 h-12 mx-auto mb-3 text-white/10" />
            <h3 className="text-sm font-semibold">Select a Logistics Route</h3>
            <p className="text-xs text-white/40 mt-1">Select any job from the queue to view its real-time GPS tracking status and verify OTP.</p>
          </div>
        )}
      </div>
    </div>
  );
}
