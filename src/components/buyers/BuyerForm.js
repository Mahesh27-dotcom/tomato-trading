"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import { haptic } from "@/lib/haptics";

export default function BuyerForm({ buyer }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(buyer);

  const [name, setName] = useState(buyer?.name || "");
  const [mobileNumber, setMobileNumber] = useState(buyer?.mobile_number || "");
  const [marketName, setMarketName] = useState(buyer?.market_name || "");
  const [notes, setNotes] = useState(buyer?.notes || "");

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanMobile = mobileNumber.trim();
    const cleanMarket = marketName.trim();
    const cleanNotes = notes.trim();

    if (!cleanName) {
      haptic("warning");
      setError("Buyer name is required.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      haptic("warning");
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!cleanMarket) {
      haptic("warning");
      setError("Market name is required.");
      return;
    }

    setLoading(true);

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("buyers")
        .update({
          name: cleanName,
          mobile_number: cleanMobile,
          market_name: cleanMarket,
          notes: cleanNotes,
        })
        .eq("id", buyer.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("buyers").insert({
        name: cleanName,
        mobile_number: cleanMobile,
        market_name: cleanMarket,
        notes: cleanNotes,
        created_by: user.id,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    haptic("success");
    setLoading(false);
    router.push(isEdit ? `/dashboard/buyers/${buyer.id}` : "/dashboard/buyers");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${buyer.name}? This cannot be undone.`)) return;
    haptic("warning");
    setDeleting(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("buyers")
      .delete()
      .eq("id", buyer.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    router.push("/dashboard/buyers");
    router.refresh();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name *">
          <TextInput
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Buyer's full name"
          />
        </Field>

        <Field label="Mobile number *">
          <TextInput
            type="tel"
            required
            maxLength={10}
            value={mobileNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setMobileNumber(value);
            }}
            placeholder="10-digit mobile number"
          />
        </Field>

        <Field label="Market name *">
          <TextInput
            required
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            placeholder="Market name"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes"
            rows={3}
            className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none resize-none form-textarea"
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
            style={{
              backgroundColor: "var(--color-danger-bg)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </p>
        )}

        <PrimaryButton type="submit" loading={loading}>
          {isEdit ? "Save changes" : "Add buyer"}
        </PrimaryButton>
      </form>

      {isEdit && (
        <div
          className="mt-10 pt-6"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <h3
            className="text-[13px] font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-danger)" }}
          >
            Danger Zone
          </h3>
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--color-danger-bg)",
              border: "1px solid rgba(179,38,30,0.2)",
            }}
          >
            <p
              className="text-[13px] mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Deleting this buyer will permanently remove their record. This
              cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="danger-btn w-full rounded-2xl py-3.5 font-medium text-[15px] disabled:opacity-50"
              style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
            >
              {deleting ? "Deleting..." : "Delete Buyer"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .form-textarea {
          transition:
            box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.2s ease-out;
        }
        .form-textarea:focus {
          box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
        }
        .danger-btn {
          transition:
            transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.2s ease-out;
        }
        .danger-btn:active {
          transform: scale(0.97);
        }
        @media (prefers-reduced-motion: reduce) {
          .form-textarea,
          .danger-btn {
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}
