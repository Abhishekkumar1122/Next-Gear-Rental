"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FormEvent, useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

declare global {
  interface Window {
    google: any;
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const nextDestination = nextParam && nextParam.startsWith("/") ? nextParam : "/book-vehicle";
  const [mode, setMode] = useState<"login" | "signup" | "otp" | "forgot">("login");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [forgotOtpRequested, setForgotOtpRequested] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();

  const navigateByRole = useCallback((role: string) => {
    if (role === "ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    if (role === "VENDOR") {
      router.push("/dashboard/vendor");
      return;
    }
    router.push("/dashboard/customer");
  }, [router]);

  // Memoize handleGoogleSignIn to prevent it from being recreated on every render
  const redirectAfterAuth = useCallback(async () => {
    if (nextParam) {
      router.push(nextDestination);
      return;
    }

    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const role = String(data?.user?.role ?? "CUSTOMER");
        navigateByRole(role);
        return;
      }
    } catch {
      // fallback below
    }

    router.push("/book-vehicle");
  }, [nextParam, nextDestination, navigateByRole, router]);

  const handleGoogleSignIn = useCallback(async (response: any) => {
    try {
      if (!response?.credential) {
        setStatus("Google Sign-In failed. Please try again.");
        return;
      }

      setIsLoading(true);
      setStatus("Signing in with Google...");

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("Login successful! Redirecting...");
        setTimeout(() => {
          void redirectAfterAuth();
        }, 1000);
      } else {
        setStatus(data.error ?? "Google sign-in failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [redirectAfterAuth]);

  // Load Google Sign-In script once on mount
  useEffect(() => {
    if (!googleClientId) {
      setGoogleLoaded(false);
      setGoogleError("Google Sign-In is not configured. Please use email/phone login.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleSignIn,
            ux_mode: "popup",
            error_callback: () => {
              setGoogleError("Google Sign-In popup was blocked. Please allow popups and try again.");
            },
          });

          setGoogleError("");
          setGoogleLoaded(true);
        } catch {
          setGoogleLoaded(false);
          setGoogleError("Unable to initialize Google Sign-In. Please try again.");
        }
      } else {
        setGoogleLoaded(false);
        setGoogleError("Google Sign-In script loaded but Google SDK is unavailable.");
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google Sign-In script");
      setGoogleLoaded(false);
      setGoogleError("Google Sign-In unavailable. Please check your network and try again.");
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [googleClientId, handleGoogleSignIn]);

  // Render Google button when mode changes
  useEffect(() => {
    if (!googleLoaded || !window.google || !googleClientId) return;

    const renderGoogleButton = () => {
      const loginButton = document.getElementById("google-signin-button");
      const signupButton = document.getElementById("google-signin-button-signup");

      // Clear previous renders
      if (loginButton) loginButton.innerHTML = "";
      if (signupButton) signupButton.innerHTML = "";

      if (mode === "login" && loginButton) {
        window.google.accounts.id.renderButton(loginButton, {
          type: "standard",
          size: "large",
          theme: "outline",
          text: "signin_with",
          shape: "rectangular",
          width: 280,
        });
      } else if (mode === "signup" && signupButton) {
        window.google.accounts.id.renderButton(signupButton, {
          type: "standard",
          size: "large",
          theme: "outline",
          text: "signup_with",
          shape: "rectangular",
          width: 280,
        });
      }
    };

    renderGoogleButton();
  }, [mode, googleClientId, googleLoaded]);

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    const contact = contactType === "email" ? email : phone;
    if (!name || !contact || !password) {
      setStatus("Please fill all fields");
      return;
    }
    if (password.length < 8) {
      setStatus("Password must be at least 8 characters");
      return;
    }
    if (contactType === "phone" && phone.length !== 10) {
      setStatus("Phone number must be 10 digits");
      return;
    }

    setIsLoading(true);
    setStatus("Creating account...");

    try {
      const payload = contactType === "email"
        ? { name, email, password }
        : { name, phone, password };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus("Account created! Redirecting...");
        setTimeout(() => {
          void redirectAfterAuth();
        }, 1000);
      } else {
        setStatus(data.error ?? "Registration failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    const contact = contactType === "email" ? email : phone;
    if (!contact || !password) {
      setStatus(`Please enter ${contactType} and password`);
      return;
    }
    if (contactType === "phone" && phone.length !== 10) {
      setStatus("Phone number must be 10 digits");
      return;
    }

    setIsLoading(true);
    setStatus("Logging in...");

    try {
      const payload = contactType === "email" 
        ? { email, password }
        : { phone, password };
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus("Login successful! Redirecting...");
        const role = String(data?.user?.role ?? "");
        if (!nextParam && role) {
          navigateByRole(role);
        } else {
          void redirectAfterAuth();
        }
      } else {
        setStatus(data.error ?? "Login failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function requestOtp() {
    const contact = contactType === "email" ? email : phone;
    if (!contact) {
      setStatus(`Please enter your ${contactType}`);
      return;
    }
    if (contactType === "phone" && phone.length !== 10) {
      setStatus("Phone number must be 10 digits");
      return;
    }

    setIsLoading(true);
    setStatus("Sending OTP...");

    try {
      const payload = contactType === "email"
        ? { email }
        : { phone };

      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpRequested(true);
        setStatus(data.devOtp ? `OTP sent! Dev code: ${data.devOtp}` : `OTP sent to your ${contactType}`);
      } else {
        setStatus(data.error ?? "Failed to send OTP");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length !== 6) {
      setStatus("Please enter 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setStatus("Verifying...");

    try {
      const payload = contactType === "email"
        ? { email, otp }
        : { phone, otp };

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus("Verified! Redirecting...");
        setTimeout(() => {
          void redirectAfterAuth();
        }, 1000);
      } else {
        setStatus(data.error ?? "Invalid OTP");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function requestPasswordResetOtp() {
    const contact = contactType === "email" ? email : phone;
    if (!contact) {
      setStatus(`Please enter your ${contactType}`);
      return;
    }
    if (contactType === "phone" && phone.length !== 10) {
      setStatus("Phone number must be 10 digits");
      return;
    }

    setIsLoading(true);
    setStatus("Sending reset OTP...");

    try {
      const payload = contactType === "email" ? { email } : { phone };

      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotOtpRequested(true);
        setStatus(data.devOtp ? `Reset OTP sent! Dev code: ${data.devOtp}` : data.message ?? "Reset OTP sent");
      } else {
        setStatus(data.error ?? "Failed to send reset OTP");
      }
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitPasswordReset() {
    if (!resetOtp || resetOtp.length !== 6) {
      setStatus("Please enter 6-digit reset OTP");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setStatus("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("New password and confirm password do not match");
      return;
    }

    setIsLoading(true);
    setStatus("Resetting password...");

    try {
      const payload = contactType === "email"
        ? { email, otp: resetOtp, newPassword }
        : { phone, otp: resetOtp, newPassword };

      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.message ?? "Password reset successful");
        setMode("login");
        setForgotOtpRequested(false);
        setResetOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus(data.error ?? "Password reset failed");
      }
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" />
      
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:py-20">
        {/* Left Side - Branding */}
        <div className="flex-1 space-y-6 md:pr-6">
          <div className="fade-up">
            <Image
              src="/Logo1.png"
              alt="Next Gear"
              width={100}
              height={100}
              className="h-20 w-20 object-contain"
            />
          </div>
          <div className="fade-up stagger-1">
            <h1 className="font-display text-4xl uppercase tracking-wider md:text-5xl">
              Welcome to <span className="gradient-text">Next Gear</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-black/70">
              Login to book verified vehicles across India. Fast, secure, and hassle-free rentals for every journey.
            </p>
            {nextParam && (
              <p className="mt-2 max-w-md text-sm font-medium text-[var(--brand-red)]">
                Continue where you left off after login.
              </p>
            )}
          </div>
          <div className="fade-up stagger-2 grid gap-3 sm:grid-cols-3">
            <InfoCard label="120+ Cities" />
            <InfoCard label="24x7 Support" />
            <InfoCard label="Instant Booking" />
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="fade-up stagger-3 w-full max-w-md">
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-xl sm:p-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-black/50">Authentication</p>
              <h2 className="mt-1 text-xl font-semibold">
                {mode === "login"
                  ? "Login to your account"
                  : mode === "signup"
                  ? "Create your account"
                  : mode === "otp"
                  ? "OTP Quick Access"
                  : "Reset your password"}
              </h2>
              <p className="mt-1 text-xs text-black/60">
                {mode === "login"
                  ? "Use your registered credentials to continue."
                  : mode === "signup"
                  ? "Create a new account with email or phone."
                  : mode === "otp"
                  ? "Use one-time password for faster sign in."
                  : "Request reset OTP and create a new password."}
              </p>
            </div>

            {/* Contact Type Switcher */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">Contact method</p>
            <div className="mb-4 flex gap-2 rounded-xl bg-black/5 p-1">
              <button
                type="button"
                onClick={() => setContactType("email")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${contactType === "email" ? "bg-white shadow-sm" : "text-black/60 hover:text-black"}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactType("phone")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${contactType === "phone" ? "bg-white shadow-sm" : "text-black/60 hover:text-black"}`}
              >
                Phone
              </button>
            </div>

            {/* Tab Switcher */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">Access mode</p>
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStatus("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  mode === "login" ? "bg-white shadow-sm" : "text-black/60 hover:text-black"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setStatus("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  mode === "signup" ? "bg-white shadow-sm" : "text-black/60 hover:text-black"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("otp");
                  setOtpRequested(false);
                  setStatus("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  mode === "otp" ? "bg-white shadow-sm" : "text-black/60 hover:text-black"
                }`}
              >
                OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setForgotOtpRequested(false);
                  setStatus("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  mode === "forgot" ? "bg-white shadow-sm" : "text-black/60 hover:text-black"
                }`}
              >
                Forgot
              </button>
            </div>

            {/* Login Form */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                {contactType === "email" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black/70">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black/70">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="10-digit phone number"
                      maxLength={10}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black/70">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 pr-20 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5 hover:text-black"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setForgotOtpRequested(false);
                    setStatus("");
                  }}
                  className="w-full text-center text-sm font-medium text-[var(--brand-red)] hover:underline"
                >
                  Forgot password?
                </button>

                {/* Or Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-black/60">or</span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <div id="google-signin-button" className="flex justify-center" />
                {googleError && <p className="text-center text-xs text-red-600">{googleError}</p>}
                {googleLoaded && !googleError && (
                  <button
                    type="button"
                    onClick={() => window.google?.accounts?.id?.prompt?.()}
                    className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
                  >
                    Use Google popup
                  </button>
                )}
              </form>
            )}

            {/* Signup Form */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black/70">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="John Doe"
                    required
                  />
                </div>
                {contactType === "email" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black/70">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black/70">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="10-digit phone number"
                      maxLength={10}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black/70">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 pr-20 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="Min. 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5 hover:text-black"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>

                {/* Or Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-black/60">or</span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <div id="google-signin-button-signup" className="flex justify-center" />
                {googleError && <p className="text-center text-xs text-red-600">{googleError}</p>}
                {googleLoaded && !googleError && (
                  <button
                    type="button"
                    onClick={() => window.google?.accounts?.id?.prompt?.()}
                    className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
                  >
                    Use Google popup
                  </button>
                )}
              </form>
            )}

            {/* OTP Form */}
            {mode === "otp" && (
              <div className="space-y-4">
                {!otpRequested ? (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void requestOtp();
                    }}
                  >
                    {contactType === "email" ? (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-black/70">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-black/70">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          placeholder="10-digit phone number"
                          maxLength={10}
                          required
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </form>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void verifyOtp();
                    }}
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black/70">Enter 6-digit OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full rounded-xl border border-black/10 px-4 py-3 text-center text-2xl tracking-widest focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="••••••"
                        maxLength={6}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpRequested(false)}
                      className="w-full text-sm text-black/60 hover:text-black"
                    >
                      Request new OTP
                    </button>
                  </form>
                )}
              </div>
            )}

            {mode === "forgot" && (
              <div className="space-y-4">
                {!forgotOtpRequested ? (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void requestPasswordResetOtp();
                    }}
                  >
                    {contactType === "email" ? (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-black/70">Registered Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-black/70">Registered Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          placeholder="10-digit phone number"
                          maxLength={10}
                          required
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? "Sending..." : "Send reset OTP"}
                    </button>
                  </form>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitPasswordReset();
                    }}
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black/70">Reset OTP</label>
                      <input
                        type="text"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full rounded-xl border border-black/10 px-4 py-3 text-center text-2xl tracking-widest focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="••••••"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black/70">New Password</label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 pr-20 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          placeholder="Min. 8 characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5 hover:text-black"
                        >
                          {showResetPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black/70">Confirm New Password</label>
                      <input
                        type={showResetPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotOtpRequested(false);
                        setResetOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setStatus("");
                      }}
                      className="w-full text-sm text-black/60 hover:text-black"
                    >
                      Request new reset OTP
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Status Message */}
            {status && (
              <div className={`mt-4 rounded-xl border p-3 text-sm ${
                status.includes("successful") || status.includes("Redirecting") || status.includes("created")
                  ? "border-green-500/20 bg-green-50 text-green-700"
                  : status.includes("error") || status.includes("failed") || status.includes("Invalid")
                  ? "border-red-500/20 bg-red-50 text-red-700"
                  : "border-black/10 bg-black/5 text-black/70"
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function InfoCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-center shadow-sm">
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}