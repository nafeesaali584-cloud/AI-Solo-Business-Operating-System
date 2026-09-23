"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const { theme, setTheme, resolvedTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Smooth redirect to next destination
      router.push(nextUrl);
      router.refresh();
    } catch {
      setErrorMessage("Network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <main
      role="main"
      className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg)] text-[var(--text-primary)] px-4 py-8 relative transition-colors duration-200"
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] opacity-25"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      {/* Top Bar with Brand & Theme Toggle */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg)] flex-shrink-0">
            <Image
              src="/brand/profile.jpg"
              alt="SoloDeskOS"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            SoloDeskOS
          </span>
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 md:p-8 shadow-xl shadow-black/5 dark:shadow-black/30 backdrop-blur-sm">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Access Protected</span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1.5">
              Welcome back
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Sign in to manage your pipeline, clients, proposals, and AI outreach.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="admin@clientpulse.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-dim)] placeholder:opacity-100 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-dim)] placeholder:opacity-100 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-muted)] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg)] cursor-pointer"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#c2410c] hover:bg-[#9a3412] dark:bg-[#ea580c] dark:hover:bg-[#c2410c] text-white text-sm font-semibold transition-all shadow-md shadow-orange-950/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Environment Notice */}
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Encrypted Session • HMAC-SHA256 Token Protection</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-5xl mx-auto text-center z-10 text-xs text-[var(--text-muted)]">
        SoloDeskOS — AI Solo-Business Operating System • Protected Solo-Admin Portal
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg)]">
          <div className="w-6 h-6 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
