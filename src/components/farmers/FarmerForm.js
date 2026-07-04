"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";

export default function FarmerForm({ farmer, onDelete }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(farmer);

  const [name, setName] = useState(farmer?.name || "");
  const [mobileNumber, setMobileNumber] = useState(farmer?.mobile_number || "");
  const [village, setVillage] = useState(farmer?.village || "");
  const [notes, setNotes] = useState(farmer?.notes || "");

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("farmers")
        .update({ name, mobile_number: mobileNumber, village, notes })
        .eq("id", farmer.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("farmers").insert({
        name,
        mobile_number: mobileNumber,
        village,
        notes,
        created_by: user.id,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard/farmers");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${farmer.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");

    const { error: deleteError } = await supabase.from("farmers").delete().eq("id", farmer.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    router.push("/dashboard/farmers");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Name">
        <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Farmer's full name" />
      </Field>

      <Field label="Mobile number">
        <TextInput
          type="tel"
          required
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="10-digit mobile number"
        />
      </Field>

      <Field label="Village">
        <TextInput value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village name" />
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes"
          rows={3}
          className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none resize-none"
          style={{
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg)",
            border: "1.5px solid var(--color-border)",
          }}
        />
      </Field>

      {error && (
        <p
          className="text-[13px] rounded-2xl px-4 py-3"
          style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}

      <PrimaryButton type="submit" loading={loading}>
        {isEdit ? "Save changes" : "Add farmer"}
      </PrimaryButton>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full rounded-2xl py-3.5 font-medium text-[15px] disabled:opacity-50"
          style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          {deleting ? "Deleting..." : "Delete farmer"}
        </button>
      )}
    </form>
  );
}