"use client";

import { FormEvent, useState } from "react";

export function AuthPanel() {
  const [name, setName] = useState("Abhishek");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("Use register/login or OTP login.");
  const [userInfo, setUserInfo] = useState<string>("Not logged in");

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setStatus("Creating account...");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    setStatus(response.ok ? "Registered and logged in." : data.error ?? "Registration failed.");
  }

  async function handleLogin() {
    setStatus("Logging in...");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    setStatus(response.ok ? "Login successful." : data.error ?? "Login failed.");
  }

  async function requestOtp() {
    setStatus("Sending OTP...");

    const response = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "OTP request failed.");
      return;
    }

    setStatus(data.devOtp ? `OTP sent. Dev OTP: ${data.devOtp}` : "OTP sent to email.");
  }

  async function verifyOtp() {
    setStatus("Verifying OTP...");

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    setStatus(response.ok ? "OTP login successful." : data.error ?? "OTP verification failed.");
  }

  async function me() {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    if (!response.ok) {
      setUserInfo("Not logged in");
      return;
    }
    setUserInfo(`${data.user.email} (${data.user.role})`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserInfo("Not logged in");
    setStatus("Logged out.");
  }

  return (
    <section className="fade-up space-y-5 rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Secure Access</p>
          <h2 className="text-xl font-semibold">Auth (Phase 2)</h2>
        </div>
        <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs">OTP + Email Login</span>
      </div>

      <form onSubmit={handleRegister} className="grid gap-3 md:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" placeholder="Name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" placeholder="Password (min 8)" />
        <button type="submit" className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-0.5">
          Register
        </button>
        <button type="button" onClick={handleLogin} className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
          Login
        </button>
        <button type="button" onClick={requestOtp} className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
          Request OTP
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <input value={otp} onChange={(e) => setOtp(e.target.value)} className="min-w-[180px] rounded-xl border border-black/10 px-3 py-2" placeholder="Enter 6-digit OTP" />
        <button onClick={verifyOtp} className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">Verify OTP</button>
        <button onClick={me} className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">Who am I</button>
        <button onClick={logout} className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">Logout</button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-black/5 p-4 text-sm">
        <p className="text-black/70">Session: <span className="font-medium text-black">{userInfo}</span></p>
        <p className="text-black/70">{status}</p>
      </div>
    </section>
  );
}
