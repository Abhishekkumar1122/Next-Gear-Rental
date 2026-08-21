"use client";

import { DeliveryJobForm } from "@/components/delivery-job-form";
import { useState, useEffect } from "react";

type DriverItem = {
  id: string;
  name: string;
};

type DeliveryJob = {
  id: string;
  type: string;
  status: string;
  bookingId: string;
  scheduledAt?: string;
  assignedDriverId?: string;
  notes?: string;
  liveLat?: number;
  liveLng?: number;
};

type AdminDeliveriesPanelProps = {
  jobs: DeliveryJob[];
  drivers: DriverItem[];
};

type SimulatedAgent = {
  jobId: string;
  driverName: string;
  vehicle: string;
  progress: number; // 0 to 100
  x: number;
  y: number;
  path: { x: number; y: number }[];
};

export function AdminDeliveriesPanel({ jobs, drivers }: AdminDeliveriesPanelProps) {
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const [selectedJob, setSelectedJob] = useState<DeliveryJob | null>(jobs[0] || null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [agents, setAgents] = useState<SimulatedAgent[]>([]);

  // Pre-configured coordinate paths for drivers on our SVG street map grid (from hubs to drop-offs)
  const simulatedPaths = [
    [
      { x: 20, y: 30 }, // Hub A
      { x: 50, y: 30 },
      { x: 50, y: 70 }, // Dropoff 1
    ],
    [
      { x: 80, y: 70 }, // Hub B
      { x: 80, y: 40 },
      { x: 30, y: 40 }, // Dropoff 2
    ],
    [
      { x: 20, y: 30 }, // Hub A
      { x: 20, y: 80 },
      { x: 70, y: 80 }, // Dropoff 3
    ]
  ];

  // Initialize simulated agents based on active jobs
  useEffect(() => {
    const activeJobs = jobs.filter(j => j.status.toLowerCase() !== "completed" && j.assignedDriverId);
    const newAgents: SimulatedAgent[] = activeJobs.map((job, idx) => {
      const driver = driverMap.get(job.assignedDriverId!)?.name || "Hub Courier";
      const path = simulatedPaths[idx % simulatedPaths.length];
      return {
        jobId: job.id,
        driverName: driver,
        vehicle: idx % 2 === 0 ? "KTM Duke 390" : "Royal Enfield",
        progress: Math.floor(Math.random() * 50) + 10, // start at some progress
        x: path[0].x,
        y: path[0].y,
        path
      };
    });
    setAgents(newAgents);
  }, [jobs]);

  // Animate transit simulation tick
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          const nextProgress = (agent.progress + 2) % 101;
          
          // Calculate current X/Y along path segments
          const numSegments = agent.path.length - 1;
          const segmentSize = 100 / numSegments;
          const currentSegmentIdx = Math.min(
            Math.floor(nextProgress / segmentSize),
            numSegments - 1
          );
          
          const segmentProgress = (nextProgress % segmentSize) / segmentSize;
          const startNode = agent.path[currentSegmentIdx];
          const endNode = agent.path[currentSegmentIdx + 1];

          const currentX = startNode.x + (endNode.x - startNode.x) * segmentProgress;
          const currentY = startNode.y + (endNode.y - startNode.y) * segmentProgress;

          return {
            ...agent,
            progress: nextProgress,
            x: Math.round(currentX),
            y: Math.round(currentY)
          };
        })
      );
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const activeAgent = selectedJob ? agents.find(a => a.jobId === selectedJob.id) : null;

  return (
    <div className="grid gap-6 md:grid-cols-12 text-white select-none">
      {/* Left Column: Form & Active Jobs List */}
      <div className="md:col-span-5 space-y-6">
        {/* Create Delivery Job form */}
        <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-5 shadow-xl">
          <div className="border-b border-white/5 pb-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Dispatch Control</p>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mt-1">Create Handoff Job</h3>
          </div>
          <div className="text-black pt-3">
            <DeliveryJobForm />
          </div>
        </section>

        {/* Active Jobs List */}
        <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-5 shadow-xl flex flex-col max-h-[360px] overflow-hidden">
          <div className="border-b border-white/5 pb-3 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Dispatch Queue</h3>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/55">
              {jobs.length} Active
            </span>
          </div>

          <div className="overflow-y-auto no-scrollbar space-y-2 pt-3 flex-1">
            {jobs.length === 0 ? (
              <p className="text-xs text-white/30 italic text-center py-4">No active deliveries scheduled.</p>
            ) : (
              jobs.map((job) => {
                const driver = job.assignedDriverId ? driverMap.get(job.assignedDriverId) : null;
                const isSelected = selectedJob?.id === job.id;
                
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--brand-red)] bg-[var(--brand-red-glow)]"
                        : "border-white/5 bg-[#0a0a0a] hover:bg-[#121212]"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase border ${
                          job.type.toLowerCase() === "handoff"
                            ? "bg-amber-950 text-amber-400 border-amber-800/30"
                            : "bg-cyan-950 text-cyan-400 border-cyan-800/30"
                        }`}>
                          {job.type}
                        </span>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase border ${
                          job.status.toLowerCase() === "completed"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800/30"
                            : "bg-red-950 text-red-400 border-red-800/30 animate-pulse"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">ID: {job.id.slice(0, 8)}</span>
                    </div>

                    <div className="text-[10px] text-white/70 space-y-0.5 mt-2 leading-relaxed">
                      <p>Booking ID: <span className="font-mono text-white">{job.bookingId}</span></p>
                      <p>Driver: <span className="text-white/60 font-bold">{driver ? driver.name : "Unassigned"}</span></p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Right Column: GPS Map Tracker Simulator */}
      <div className="md:col-span-7">
        <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl h-full flex flex-col justify-between min-h-[500px]">
          <div className="border-b border-white/5 pb-3 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Telemetry Monitor</p>
              <h2 className="text-sm font-black uppercase tracking-wider text-white mt-1">Simulated GPS Live Dispatch</h2>
            </div>
            
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              type="button"
              className={`rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition duration-300 border cursor-pointer ${
                isSimulating
                  ? "bg-emerald-950 border-emerald-900/30 text-emerald-400"
                  : "bg-white/5 border-white/5 text-white/40"
              }`}
            >
              {isSimulating ? "● GPS Telemetry Active" : "○ Resume GPS Stream"}
            </button>
          </div>

          {/* Interactive SVG Street Map Grid */}
          <div className="flex-1 relative bg-[#050505] rounded-2xl border border-white/5 overflow-hidden my-4 min-h-[300px]">
            <svg className="w-full h-full text-white/10" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Map grid lines / Roads */}
              <line x1="10" y1="0" x2="10" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="30" y1="0" x2="30" y2="100" stroke="currentColor" strokeWidth="1" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1.5" />
              <line x1="70" y1="0" x2="70" y2="100" stroke="currentColor" strokeWidth="1" />
              <line x1="90" y1="0" x2="90" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />

              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="1" />
              <line x1="0" y1="60" x2="100" y2="60" stroke="currentColor" strokeWidth="1.5" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="1" />

              {/* Hub Indicators */}
              <circle cx="20" cy="30" r="3" className="fill-blue-500/20 stroke-blue-500" strokeWidth="0.5" />
              <text x="18" y="25" className="fill-blue-400 font-bold text-[3px] font-sans">HUB ALPHA</text>

              <circle cx="80" cy="70" r="3" className="fill-purple-500/20 stroke-purple-500" strokeWidth="0.5" />
              <text x="78" y="65" className="fill-purple-400 font-bold text-[3px] font-sans">HUB BETA</text>

              {/* Target Dropoffs */}
              <circle cx="50" cy="70" r="2" className="fill-rose-500/10 stroke-rose-500" strokeWidth="0.5" />
              <circle cx="30" cy="40" r="2" className="fill-rose-500/10 stroke-rose-500" strokeWidth="0.5" />
              <circle cx="70" cy="80" r="2" className="fill-rose-500/10 stroke-rose-500" strokeWidth="0.5" />

              {/* Draw simulated agent trackers */}
              {agents.map((agent) => {
                const isSelected = selectedJob?.id === agent.jobId;
                return (
                  <g key={agent.jobId} className="transition-all duration-300">
                    {/* Pulsing selector ring around agent */}
                    {isSelected && (
                      <circle cx={agent.x} cy={agent.y} r="5" className="fill-[var(--brand-red)]/10 stroke-[var(--brand-red)] animate-ping" strokeWidth="0.5" />
                    )}
                    {/* Core agent point */}
                    <circle
                      cx={agent.x}
                      cy={agent.y}
                      r="2"
                      className={`${isSelected ? "fill-white" : "fill-[var(--brand-red)]"}`}
                    />
                    <text x={agent.x + 3} y={agent.y + 1} className="fill-white font-mono text-[2.5px] font-bold">
                      {agent.driverName.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active telemetry detailed box */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 text-xs">
            {activeAgent ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--brand-red)] animate-pulse" />
                    <span className="font-extrabold text-white">Courier: {activeAgent.driverName}</span>
                  </div>
                  <p className="text-[10px] text-white/50">Assigned Transit Vehicle: <span className="text-white font-medium">{activeAgent.vehicle}</span></p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] uppercase font-black tracking-wider bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/70">
                    Route Progress: {activeAgent.progress}%
                  </span>
                  <p className="text-[9.5px] font-mono text-cyan-400">Position: Lat {activeAgent.y.toFixed(3)}N, Lng {activeAgent.x.toFixed(3)}E</p>
                </div>
              </div>
            ) : (
              <p className="text-white/40 italic text-center py-2">Select a dispatch job to view active GPS telemetry</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
