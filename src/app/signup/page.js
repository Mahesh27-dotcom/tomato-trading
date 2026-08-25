"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getPasswordStrength } from "@/utils/passwordStrength";
import { Shell, BrandHeader, Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import { haptic } from "@/lib/haptics";

const OTP_ENABLED = false;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState("form");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      haptic("warning");
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      haptic("warning");
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      haptic("warning");
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (OTP_ENABLED) {
      setLoading(false);
      setStep("otp");
      return;
    }

    haptic("success");
    setLoading(false);
    setStep("done");
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (verifyError) {
      haptic("warning");
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    haptic("success");
    setLoading(false);
    setStep("done");
  };

  const handleResendOtp = async () => {
    setError("");
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    if (resendError) setError(resendError.message);
    else setError("A new code has been sent.");
  };

  // ---------- DONE ----------
  if (step === "done") {
    return (
      <Shell>
        <div className="text-center py-2">
          <div
            className="scale-in mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-success-bg)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[20px] font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Account created 🎉
          </h1>
          <p className="text-[14.5px] leading-relaxed mb-8" style={{ color: "var(--color-text-muted)" }}>
            Your account is waiting for admin approval. You'll be able to
            log in as soon as it's approved.
          </p>
          <PrimaryButton onClick={() => router.push("/login")}>
            Go to Login
          </PrimaryButton>
        </div>
      </Shell>
    );
  }

  // ---------- OTP ----------
  if (step === "otp") {
    return (
      <Shell>
        <BrandHeader
          eyebrow="🔐 Verification"
          title="Check your email 📬"
          subtitle={`We sent a 6-digit code to ${email}`}
        />

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="input-base w-full text-center tracking-[0.5em] text-2xl font-semibold rounded-2xl px-4 py-4 outline-none"
            style={{
              color: "var(--color-text)",
              backgroundColor: "var(--color-bg)",
              border: "1.5px solid var(--color-border)",
            }}
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <PrimaryButton type="submit" loading={loading} disabled={otp.length !== 6}>
            Verify & Continue
          </PrimaryButton>

          <button
            type="button"
            onClick={handleResendOtp}
            className="w-full text-[14px] font-medium py-2 active:opacity-60 transition-opacity"
            style={{ color: "var(--color-accent)" }}
          >
            Didn't get a code? Resend
          </button>
        </form>
      </Shell>
    );
  }

  // ---------- FORM ----------
  return (
    <Shell>
      <BrandHeader
        eyebrow="🍅 Tomato Trading System"
        title="Create your account ✨"
        subtitle="Sign up to request staff access"
      />

      <form onSubmit={handleSignup} className="space-y-5">
        <Field label="🧑 Full name">
          <TextInput
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </Field>

        <Field label="📧 Email">
          <TextInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="🔒 Password">
          <TextInput
            type="password"
            showToggle
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          {password.length > 0 && (
            <div className="mt-2.5">
              <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        i <= strength.score
                          ? strength.score === 1
                            ? "var(--color-danger)"
                            : strength.score === 2
                            ? "#C48A1E"
                            : "var(--color-success)"
                          : "var(--color-border)",
                    }}
                  />
                ))}
              </div>
              <p className="text-[12px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                {strength.label}
              </p>
            </div>
          )}
        </Field>

        <Field label="🔒 Confirm password">
          <TextInput
            type="password"
            showToggle
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
          />
          {confirmPassword.length > 0 && (
            <p
              className="text-[12px] mt-1.5 font-medium transition-colors"
              style={{
                color:
                  confirmPassword === password ? "var(--color-success)" : "var(--color-danger)",
              }}
            >
              {confirmPassword === password ? "Passwords match" : "Passwords do not match"}
            </p>
          )}
        </Field>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <PrimaryButton type="submit" loading={loading}>
          Create account →
        </PrimaryButton>
      </form>

      <p className="text-center text-[14px] mt-7" style={{ color: "var(--color-text-muted)" }}>
        Already have an account?{" "}
        <a href="/login" className="font-medium active:opacity-60" style={{ color: "var(--color-accent)" }}>
          Log in
        </a>
      </p>
    </Shell>
  );
}

function ErrorMessage({ children }) {
  return (
    <p
      className="text-[13px] rounded-2xl px-4 py-3 error-shake"
      style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
    >
      {children}
      <style jsx>{`
        .error-shake {
          animation: shake 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .error-shake { animation-duration: 0.001s !important; }
        }
      `}</style>
    </p>
  );
}