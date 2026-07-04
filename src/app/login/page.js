"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Shell,
  BrandHeader,
  Field,
  PrimaryButton,
} from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Show message when middleware redirects to /login?pending=true
  const isPending = searchParams.get("pending") === "true";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    // Check approval status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_approved, role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      setError("Could not verify your account. Please try again.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (!profile.is_approved) {
      setError(
        "Your account is still waiting for admin approval. Please check back later."
      );
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Shell>
      <BrandHeader
        eyebrow="Tomato Trading System"
        title="Welcome back"
        subtitle="Log in to continue"
      />

      {isPending && (
        <div
          className="text-[13px] rounded-2xl px-4 py-3 mb-5"
          style={{
            backgroundColor: "var(--color-danger-bg)",
            color: "var(--color-danger)",
          }}
        >
          Your account is still waiting for admin approval.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <Field label="Email">
          <TextInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <TextInput
            type="password"
            showToggle
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </Field>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <PrimaryButton type="submit" loading={loading}>
          Log in
        </PrimaryButton>
      </form>

      <p
        className="text-center text-[14px] mt-7"
        style={{ color: "var(--color-text-muted)" }}
      >
        Don't have an account?{" "}
        <a
          href="/signup"
          className="font-medium active:opacity-60"
          style={{ color: "var(--color-accent)" }}
        >
          Sign up
        </a>
      </p>
    </Shell>
  );
}

function ErrorMessage({ children }) {
  return (
    <p
      className="text-[13px] rounded-2xl px-4 py-3"
      style={{
        backgroundColor: "var(--color-danger-bg)",
        color: "var(--color-danger)",
      }}
    >
      {children}
    </p>
  );
}