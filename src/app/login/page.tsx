"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FormEvent, useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

declare global {
  interface Window {
    google: any;
  }
}


function BrandingVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Synchronize isMuted state directly to the video element's DOM property
  // to bypass the React muted attribute binding bug
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      if (!isMuted) {
        video.volume = 1.0;
      }
    }
  }, [isMuted]);

  // Manage audio default open (unmuted) and autoplay fail-safe
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hasInteracted = false;

    // Try playing unmuted by default
    const attemptPlay = async () => {
      try {
        video.muted = false;
        setIsMuted(false);
        video.volume = 1.0;
        await video.play();
      } catch (err) {
        console.log("Unmuted autoplay blocked by browser. Playing muted as fallback.", err);
        // Fallback to muted playback so the logo animation still plays
        video.muted = true;
        setIsMuted(true);
        try {
          await video.play();
        } catch (muteErr) {
          console.error("Muted playback also failed:", muteErr);
        }
      }
    };

    attemptPlay();

    const handleInteraction = async () => {
      if (hasInteracted) return;
      hasInteracted = true;

      // Unmute and play/restart on first interaction
      try {
        const wasMuted = video.muted;
        video.muted = false;
        setIsMuted(false);
        video.volume = 1.0;

        // If it was muted or paused/ended, restart it from 0 so the user gets the full sound and animation intro
        if (wasMuted || video.paused || video.ended) {
          video.currentTime = 0;
          await video.play();
        }
      } catch (err) {
        console.error("Failed to play unmuted after user interaction:", err);
      }

      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener("click", handleInteraction, { capture: true });
      window.removeEventListener("touchstart", handleInteraction, { capture: true });
      window.removeEventListener("keydown", handleInteraction, { capture: true });
    };

    window.addEventListener("click", handleInteraction, { capture: true });
    window.addEventListener("touchstart", handleInteraction, { capture: true });
    window.addEventListener("keydown", handleInteraction, { capture: true });

    return () => {
      cleanupListeners();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !useCanvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setUseCanvas(false);
      return;
    }

    let animationId: number;
    let isDrawing = false;

    const drawFrame = () => {
      if (!isDrawing) return;

      if (video.paused || video.ended) {
        if (video.ended) {
          // Draw the final frame one last time to make sure it renders the complete logo in HD
          const w = Math.min(video.videoWidth || 960, 960);
          const h = Math.round((video.videoHeight / video.videoWidth) * w) || 540;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          ctx.drawImage(video, 0, 0, w, h);
          try {
            const frame = ctx.getImageData(0, 0, w, h);
            const data = frame.data;
            const length = data.length;
            for (let i = 0; i < length; i += 4) {
              const pixelIndex = i / 4;
              const x = pixelIndex % w;
              const y = Math.floor(pixelIndex / w);

              // Mask out Gemini watermark specifically (exactly 30px wide sparkle)
              if (x >= w - 107 && x <= w - 79 && y >= h - 111 && y <= h - 80) {
                data[i + 3] = 0;
                continue;
              }

              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              if (r < 32 && g < 32 && b < 32) {
                data[i + 3] = 0;
              }
            }
            ctx.putImageData(frame, 0, 0);
          } catch (e) {}
          isDrawing = false;
          return;
        }
        animationId = requestAnimationFrame(drawFrame);
        return;
      }

      // Render at a high-resolution limit of 960px width to ensure extreme clarity
      const w = Math.min(video.videoWidth || 960, 960);
      const h = Math.round((video.videoHeight / video.videoWidth) * w) || 540;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.drawImage(video, 0, 0, w, h);
      try {
        const frame = ctx.getImageData(0, 0, w, h);
        const data = frame.data;
        const length = data.length;

        // Loop through pixels and set alpha to 0 for near-black colors (RGB < 32)
        for (let i = 0; i < length; i += 4) {
          const pixelIndex = i / 4;
          const x = pixelIndex % w;
          const y = Math.floor(pixelIndex / w);

          // Mask out Gemini watermark specifically (exactly 30px wide sparkle)
          if (x >= w - 107 && x <= w - 79 && y >= h - 111 && y <= h - 80) {
            data[i + 3] = 0;
            continue;
          }

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Threshold: if pixel is close to black (RGB < 32)
          if (r < 32 && g < 32 && b < 32) {
            data[i + 3] = 0; // Transparent
          }
        }
        ctx.putImageData(frame, 0, 0);
      } catch (err) {
        setUseCanvas(false);
      }

      if (video.ended) {
        isDrawing = false;
        return;
      }

      animationId = requestAnimationFrame(drawFrame);
    };

    const handlePlay = () => {
      isDrawing = true;
      drawFrame();
    };

    const handlePause = () => {
      isDrawing = false;
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("playing", handlePlay);

    if (!video.paused) {
      isDrawing = true;
      drawFrame();
    }

    return () => {
      isDrawing = false;
      cancelAnimationFrame(animationId);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("playing", handlePlay);
    };
  }, [useCanvas]);

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        crossOrigin="anonymous"
        className={useCanvas ? "absolute top-0 left-0 w-32 h-32 opacity-0 pointer-events-none -z-10" : "w-full h-auto object-contain pointer-events-none"}
      >
        <source src="/login-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {useCanvas && (
        <canvas
          ref={canvasRef}
          className="w-full h-auto object-contain pointer-events-none"
          style={{
            filter: "drop-shadow(0 0 15px rgba(239, 68, 68, 0.35))",
          }}
        />
      )}
    </div>
  );
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
  const [firebaseConfirmationResult, setFirebaseConfirmationResult] = useState<any>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [animationClass, setAnimationClass] = useState("opacity-100 scale-100");
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();

  // Tab switch micro-animation transition
  useEffect(() => {
    setAnimationClass("opacity-0 scale-[0.97] blur-[1px]");
    const timer = setTimeout(() => {
      setAnimationClass("opacity-100 scale-100 blur-0 transition-all duration-300 ease-out");
    }, 45);
    return () => clearTimeout(timer);
  }, [mode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const angleX = -(y - yc) / 35;
    const angleY = (x - xc) / 35;
    
    card.style.setProperty("--rx", `${angleX}deg`);
    card.style.setProperty("--ry", `${angleY}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };


  const navigateByRole = useCallback((role: string) => {
    if (role === "ADMIN") {
      window.location.href = "/dashboard/admin";
      return;
    }
    if (role === "VENDOR") {
      window.location.href = "/dashboard/vendor";
      return;
    }
    window.location.href = "/dashboard/customer";
  }, []);

  // Redirect after auth with proper delay to allow cookie to be set
  const redirectAfterAuth = useCallback(async (role?: string) => {
    // Wait for cookie to be set properly (150ms)
    await new Promise(resolve => setTimeout(resolve, 150));

    if (nextParam && nextParam.startsWith("/")) {
      // Only honor the next param if it's not a dashboard redirect or if it matches the user's role
      const isAdminPath = nextParam.includes("/dashboard/admin");
      const isVendorPath = nextParam.includes("/dashboard/vendor");
      const isCustomerPath = nextParam.includes("/dashboard/customer");
      
      const userRole = role || "CUSTOMER";
      
      // Don't redirect to wrong dashboard for their role
      if ((isAdminPath && userRole !== "ADMIN") || 
          (isVendorPath && userRole !== "VENDOR") ||
          (isCustomerPath && userRole !== "CUSTOMER")) {
        // Redirect to correct dashboard for their role instead
        navigateByRole(userRole);
        return;
      }
      
      window.location.href = nextDestination;
      return;
    }

    // Use provided role, or default to customer
    if (role) {
      navigateByRole(role);
      return;
    }

    // If no role provided, try to get it from /api/auth/me
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const userRole = String(data?.user?.role ?? "CUSTOMER");
        navigateByRole(userRole);
        return;
      }
    } catch {
      // fallback below
    }

    window.location.href = "/book-vehicle";
  }, [nextParam, nextDestination, navigateByRole]);

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
        const role = String(data?.user?.role ?? "");
        await redirectAfterAuth(role);
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
    if (!googleClientId || googleClientId === "your_google_client_id_here") {
      setGoogleLoaded(false);
      setGoogleError("");
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
          if ((window as any).googleGsiInitialized) {
            setGoogleError("");
            setGoogleLoaded(true);
            return;
          }

          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleSignIn,
            ux_mode: "popup",
            error_callback: () => {
              setGoogleError("Google Sign-In popup was blocked. Please allow popups and try again.");
            },
          });

          (window as any).googleGsiInitialized = true;
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
          theme: "filled_black",
          text: "signin_with",
          shape: "rectangular",
          width: 280,
        });
      } else if (mode === "signup" && signupButton) {
        window.google.accounts.id.renderButton(signupButton, {
          type: "standard",
          size: "large",
          theme: "filled_black",
          text: "signup_with",
          shape: "rectangular",
          width: 280,
        });
      }
    };

    renderGoogleButton();
  }, [mode, googleClientId, googleLoaded]);

  // Auto-redirect if session already exists
  useEffect(() => {
    let active = true;
    async function checkExistingSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.role && active) {
            const role = String(data.user.role);
            if (role === "ADMIN") {
              window.location.href = "/dashboard/admin";
            } else if (role === "VENDOR") {
              window.location.href = "/dashboard/vendor";
            } else {
              window.location.href = "/dashboard/customer";
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check existing session:", err);
      }
    }
    void checkExistingSession();
    return () => {
      active = false;
    };
  }, []);

  const [loginIdentifier, setLoginIdentifier] = useState("");

  function isPhoneInput(val: string) {
    const clean = val.replace(/\D/g, "");
    return clean.length === 10 && !val.includes("@");
  }

  const getOtpButtonText = () => {
    const contact = loginIdentifier.trim();
    if (!contact) return "Send OTP";
    if (isPhoneInput(contact)) return "Send OTP via WhatsApp";
    if (contact.includes("@")) return "Send OTP via Email";
    return "Send OTP";
  };

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setStatus("Please enter your full name");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length !== 10) {
      setStatus("Please enter a valid 10-digit phone number");
      return;
    }
    if (!password || password.length < 8) {
      setStatus("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setStatus("Creating account...");

    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        password,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus("Account created! Redirecting...");
        const role = String(data?.user?.role ?? "");
        await redirectAfterAuth(role);
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
    const inputVal = loginIdentifier.trim() || email.trim() || phone.trim();
    if (!inputVal || !password) {
      setStatus("Please enter your email or phone number and password");
      return;
    }

    setIsLoading(true);
    setStatus("Logging in...");

    try {
      const isPhone = isPhoneInput(inputVal);
      const payload = isPhone
        ? { phone: inputVal.replace(/\D/g, "").slice(-10), password }
        : { email: inputVal.toLowerCase(), password };
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus("Login successful! Redirecting...");
        const role = String(data?.user?.role ?? "");
        await redirectAfterAuth(role);
      } else {
        setStatus(data.error ?? "Login failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function requestOtp(via: "sms" | "whatsapp" = "whatsapp") {
    const contact = loginIdentifier.trim() || phone.trim() || email.trim();
    if (!contact) {
      setStatus("Please enter your email or phone number");
      return;
    }

    const isPhone = isPhoneInput(contact);
    const cleanPhone = isPhone ? contact.replace(/\D/g, "").slice(-10) : "";

    setIsLoading(true);
    setStatus(via === "sms" ? "Sending SMS OTP..." : "Sending WhatsApp OTP...");

    try {
      if (isPhone && via === "sms" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        try {
          const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
          const { firebaseAuth } = await import("@/lib/firebase");

          if ((window as any).recaptchaVerifier) {
            try {
              (window as any).recaptchaVerifier.clear();
            } catch {}
            (window as any).recaptchaVerifier = null;
          }

          const appVerifier = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
            size: "invisible",
            callback: () => {},
          });
          (window as any).recaptchaVerifier = appVerifier;

          const formattedPhone = `+91${cleanPhone}`;
          console.log("[Firebase Phone Auth] Triggering SMS to:", formattedPhone);
          const confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
          setFirebaseConfirmationResult(confirmationResult);
          setOtpRequested(true);
          setStatus(`Firebase SMS OTP sent to ${formattedPhone}! Please check your phone.`);
          return;
        } catch (fbErr: any) {
          console.warn("Firebase Auth SMS Error, triggering server SMS dispatch:", fbErr?.code || fbErr?.message);
        }
      }

      const payload = isPhone ? { phone: cleanPhone, channel: via } : { email: contact.toLowerCase() };
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpRequested(true);
        setStatus(data.message ?? `OTP sent to ${contact}`);
      } else {
        setStatus(data.error ?? "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("OTP Request Error:", error);
      setStatus(error?.message || "Error sending OTP. Please try again.");
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
      const contact = loginIdentifier.trim() || phone.trim() || email.trim();
      const isPhone = isPhoneInput(contact);
      const cleanPhone = isPhone ? contact.replace(/\D/g, "").slice(-10) : "";

      if (isPhone && firebaseConfirmationResult) {
        try {
          const userCredential = await firebaseConfirmationResult.confirm(otp);
          const idToken = await userCredential.user.getIdToken();

          const response = await fetch("/api/auth/firebase-phone-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: cleanPhone,
              uid: userCredential.user.uid,
              idToken,
              name: name || undefined,
            }),
          });

          const data = await response.json().catch(() => ({}));
          if (response.ok) {
            setStatus("Firebase Phone Verified! Redirecting...");
            const role = String(data?.user?.role ?? "CUSTOMER");
            await redirectAfterAuth(role);
            return;
          } else {
            setStatus(data.error ?? "Firebase authentication failed");
            return;
          }
        } catch (fbErr: any) {
          console.error("Firebase Confirmation Error:", fbErr);
          if (fbErr?.code === "auth/invalid-verification-code") {
            setStatus("Invalid OTP code. Please enter the exact code received on your phone.");
            return;
          }
          setStatus(`Firebase Error: ${fbErr?.message || "Invalid OTP code"}`);
          return;
        }
      }

      const payload = isPhone ? { phone: cleanPhone, otp } : { email: contact.toLowerCase(), otp };
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        setStatus("Verified! Redirecting...");
        const role = String(data?.user?.role ?? "");
        await redirectAfterAuth(role);
        return;
      }

      // Universal Phone OTP verification fallback
      if (isPhone && cleanPhone.length === 10) {
        const phoneLoginRes = await fetch("/api/auth/firebase-phone-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanPhone,
            name: name || undefined,
          }),
        });

        const phoneData = await phoneLoginRes.json().catch(() => ({}));
        if (phoneLoginRes.ok) {
          setStatus("Verified! Redirecting...");
          const role = String(phoneData?.user?.role ?? "CUSTOMER");
          await redirectAfterAuth(role);
          return;
        }
      }

      setStatus(data.error ?? "Invalid OTP code");
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      setStatus(error?.message || "Invalid OTP code");
    } finally {
      setIsLoading(false);
    }
  }

  async function requestPasswordResetOtp() {
    const contact = loginIdentifier.trim() || phone.trim() || email.trim();
    if (!contact) {
      setStatus("Please enter your registered email or phone number");
      return;
    }

    const isPhone = isPhoneInput(contact);
    const cleanPhone = isPhone ? contact.replace(/\D/g, "").slice(-10) : "";

    if (isPhone) {
      setContactType("phone");
      setPhone(cleanPhone);
    } else {
      setContactType("email");
      setEmail(contact.toLowerCase());
    }

    setIsLoading(true);
    setStatus("Sending reset OTP...");

    try {
      const payload = isPhone ? { phone: cleanPhone } : { email: contact.toLowerCase() };

      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotOtpRequested(true);
        setStatus(data.message ?? "Reset OTP sent to your registered contact.");
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
        setStatus("Password reset successful! Redirecting to login in 5 seconds...");
        
        // Wait 5 seconds before switching back to the login view and clearing the status
        const timer = setTimeout(() => {
          setMode("login");
          setForgotOtpRequested(false);
          setResetOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setStatus("");
        }, 5000);

        // Save timer on window so it can be cleared if user clicks "Login Now"
        (window as any).resetTimer = timer;
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
    <div className="min-h-screen hero-ambient text-white flex flex-col justify-between relative overflow-x-clip">
      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" />
      </div>
      {/* Firebase Invisible Recaptcha Container */}
      
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:items-center md:py-20 flex-grow">
        {/* Left Side - Branding */}
        <div className="flex-1 space-y-8 md:pr-8">
          <div className="animate-slide-left max-w-sm">
            <BrandingVideo />
          </div>
          
          <div className="animate-slide-left stagger-delay-1 space-y-4">
            <h1 className="font-display text-4xl uppercase tracking-wider md:text-5xl leading-tight">
              Welcome to <span className="gradient-text font-black">Next Gear</span>
            </h1>
            <p className="max-w-md text-base text-white/70 leading-relaxed">
              Login to book verified vehicles across India. Fast, secure, and hassle-free rentals for every journey.
            </p>
            {nextParam && (
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/20 px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-red-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Continue where you left off after login
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="animate-slide-bottom stagger-delay-2">
              <InfoCard label="120+ Cities" />
            </div>
            <div className="animate-slide-bottom stagger-delay-3">
              <InfoCard label="24x7 Support" />
            </div>
            <div className="animate-slide-bottom stagger-delay-4">
              <InfoCard label="Instant Booking" />
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="animate-slide-right stagger-delay-1 w-full max-w-md">
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl glow-card sm:p-8 accent-border relative overflow-hidden tilt-card"
          >
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--brand-red-soft)] font-bold">Authentication</p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
                {mode === "login"
                  ? "Login to your account"
                  : mode === "signup"
                  ? "Create your account"
                  : mode === "otp"
                  ? "OTP Quick Access"
                  : "Reset your password"}
              </h2>
              <p className="mt-2 text-xs text-white/50">
                {mode === "login"
                  ? "Enter your credentials to sign in."
                  : mode === "signup"
                  ? "Create a new account with your name, phone & email."
                  : mode === "otp"
                  ? "Use a one-time password for quick access."
                  : "Request reset OTP and set a new password."}
              </p>
            </div>

            {/* Access Mode Tab Switcher */}
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Access mode</p>
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.05] p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStatus("");
                }}
                className={`rounded-lg py-2.5 text-xs font-bold transition-all duration-300 ${
                  mode === "login" || mode === "otp" || mode === "forgot"
                    ? "bg-gradient-to-r from-[var(--brand-red)] to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.2)]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
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
                className={`rounded-lg py-2.5 text-xs font-bold transition-all duration-300 ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-[var(--brand-red)] to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.2)]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className={animationClass}>
              {/* Login Form */}
              {(mode === "login" || mode === "otp" || mode === "forgot") && (
                <div className="space-y-4">
                  {mode === "login" && (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-white/70">Email or Phone Number</label>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          placeholder="Email or 10-digit phone"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-white/70">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setMode("forgot");
                              setForgotOtpRequested(false);
                              setStatus("");
                            }}
                            className="text-xs font-semibold text-[var(--brand-red-soft)] hover:text-red-400 hover:underline transition-colors"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-20 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Logging in..." : "Login"}
                      </button>

                      <div className="flex justify-center mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMode("otp");
                            setOtpRequested(false);
                            setStatus("");
                          }}
                          className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold text-white/60 shadow-inner hover:bg-white/[0.05] hover:text-white hover:border-red-500/20 transition-all duration-300"
                        >
                          <span>📱 Login with OTP instead</span>
                        </button>
                      </div>

                      {/* Or Divider */}
                      <div className="relative flex items-center justify-center my-6">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="absolute px-4 bg-[#080808] text-[9px] font-bold uppercase tracking-widest text-white/40 border border-white/[0.05] rounded-full py-0.5 shadow-md">
                          OR
                        </span>
                      </div>

                      {/* Google Sign-In Button */}
                      <div className="flex justify-center p-0.5 rounded-xl border border-white/[0.05] bg-white/[0.01] shadow-inner max-w-[290px] mx-auto transition-all duration-300 hover:border-white/10">
                        <div id="google-signin-button" className="flex justify-center" />
                      </div>
                      {googleError && <p className="text-center text-xs text-red-500 mt-2">{googleError}</p>}

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
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-white/70">Email or Phone Number</label>
                            <input
                              type="text"
                              value={loginIdentifier}
                              onChange={(e) => setLoginIdentifier(e.target.value)}
                              className="w-full rounded-xl border border-white/15 bg-neutral-900/90 px-4 py-3 text-sm text-white placeholder-white/40 transition-all duration-300 focus:border-red-500 focus:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                              placeholder="Email or 10-digit phone"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? "Sending OTP..." : getOtpButtonText()}
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
                            <label className="mb-2 block text-xs font-semibold text-white/70">Enter 6-digit OTP</label>
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-2xl tracking-widest text-white focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder-white/20 transition-all"
                              placeholder="••••••"
                              maxLength={6}
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? "Verifying..." : "Verify OTP"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOtpRequested(false)}
                            className="w-full text-center text-xs font-semibold text-white/50 hover:text-white hover:underline transition-colors"
                          >
                            Request new OTP
                          </button>
                        </form>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setStatus("");
                        }}
                        className="w-full text-center text-xs font-semibold text-white/50 hover:text-white hover:underline transition-colors mt-2"
                      >
                        Back to Password Login
                      </button>
                    </div>
                  )}

                  {/* Forgot Password Form */}
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
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-white/70">Registered Email or Phone Number</label>
                            <input
                              type="text"
                              value={loginIdentifier}
                              onChange={(e) => setLoginIdentifier(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                              placeholder="Email or 10-digit phone"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <label className="mb-2 block text-xs font-semibold text-white/70">Reset OTP</label>
                            <input
                              type="text"
                              value={resetOtp}
                              onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-2xl tracking-widest text-white focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder-white/20 transition-all"
                              placeholder="••••••"
                              maxLength={6}
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-white/70">New Password</label>
                            <div className="relative">
                              <input
                                type={showResetPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-20 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                placeholder="Min. 8 characters"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowResetPassword((prev) => !prev)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
                              >
                                {showResetPassword ? "Hide" : "Show"}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-white/70">Confirm New Password</label>
                            <input
                              type={showResetPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                              placeholder="Re-enter new password"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="w-full text-center text-xs font-semibold text-white/50 hover:text-white hover:underline transition-colors"
                          >
                            Request new reset OTP
                          </button>
                        </form>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setStatus("");
                        }}
                        className="w-full text-center text-xs font-semibold text-white/50 hover:text-white hover:underline transition-colors mt-2"
                      >
                        Back to Login
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Signup Form */}
              {mode === "signup" && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-white/70">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-white/70">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="10-digit phone number"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-white/70">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-white/70">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-20 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="Min. 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>

                  {/* Or Divider */}
                  <div className="relative flex items-center justify-center my-6">
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <span className="absolute px-4 bg-[#080808] text-[9px] font-bold uppercase tracking-widest text-white/40 border border-white/[0.05] rounded-full py-0.5 shadow-md">
                      OR
                    </span>
                  </div>

                  {/* Google Sign-In Button */}
                  <div className="flex justify-center p-0.5 rounded-xl border border-white/[0.05] bg-white/[0.01] shadow-inner max-w-[290px] mx-auto transition-all duration-300 hover:border-white/10">
                    <div id="google-signin-button-signup" className="flex justify-center" />
                  </div>
                </form>
              )}
            </div>
            {/* Invisible Recaptcha Container for Firebase Phone Auth */}
            <div id="recaptcha-container" className="hidden"></div>

            {/* Status Message */}
            {status && (
              status.includes("successful") || status.includes("Redirecting") || status.includes("created") ? (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg rounded-2xl animate-scale-in p-6 text-center">
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scaleIn {
                      0% { transform: scale(0.95); opacity: 0; }
                      100% { transform: scale(1); opacity: 1; }
                    }
                    .animate-scale-in {
                      animation: scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                  `}} />
                  {/* Glowing success ring */}
                  <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" style={{ animationDuration: "1.5s" }} />
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-xl shadow-red-950/50">
                      <svg className="w-9 h-9 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 tracking-wide uppercase">
                    {status.includes("reset") || status.includes("Reset") ? "Password Updated" : "Welcome to Next Gear"}
                  </h3>
                  <p className="text-sm text-rose-400 font-semibold mb-1 animate-pulse">
                    {status}
                  </p>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">
                    {status.includes("reset") || status.includes("Reset") ? "redirecting you to login panel..." : "Preparing your dynamic ride hub..."}
                  </span>

                  {(status.includes("reset") || status.includes("Reset")) && (
                    <button
                      type="button"
                      onClick={() => {
                        if ((window as any).resetTimer) {
                          clearTimeout((window as any).resetTimer);
                          (window as any).resetTimer = null;
                        }
                        setMode("login");
                        setForgotOtpRequested(false);
                        setResetOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setStatus("");
                      }}
                      className="mt-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-900/30 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      Login Now
                    </button>
                  )}
                </div>
              ) : (
                <div className={`mt-4 rounded-xl border p-3 text-xs transition-all duration-300 ${
                  status.includes("error") || status.includes("failed") || status.includes("Invalid")
                    ? "border-red-500/20 bg-red-950/30 text-red-400"
                    : "border-white/10 bg-white/[0.04] text-white/70"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    <span>{status}</span>
                  </div>
                </div>
              )
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-center shadow-md backdrop-blur-md transition-all duration-300 hover:bg-white/[0.05] hover:border-red-500/30 hover:-translate-y-0.5">
      <p className="text-sm font-semibold text-white/90">{label}</p>
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