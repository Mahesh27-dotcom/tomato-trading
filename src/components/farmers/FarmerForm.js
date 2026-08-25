// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/utils/supabase/client";
// import { Field, PrimaryButton } from "@/components/ui/Shell";
// import TextInput from "@/components/ui/TextInput";
// import { haptic } from "@/lib/haptics";

// export default function FarmerForm({ farmer, onDelete }) {
//   const router = useRouter();
//   const supabase = createClient();
//   const isEdit = Boolean(farmer);

//   const [name, setName] = useState(farmer?.name || "");
//   const [mobileNumber, setMobileNumber] = useState(farmer?.mobile_number || "");
//   const [village, setVillage] = useState(farmer?.village || "");
//   const [notes, setNotes] = useState(farmer?.notes || "");

//   const [loading, setLoading] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     if (isEdit) {
//       const { error: updateError } = await supabase
//         .from("farmers")
//         .update({ name, mobile_number: mobileNumber, village, notes })
//         .eq("id", farmer.id);

//       if (updateError) {
//         setError(updateError.message);
//         setLoading(false);
//         return;
//       }
//     } else {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       const { error: insertError } = await supabase.from("farmers").insert({
//         name,
//         mobile_number: mobileNumber,
//         village,
//         notes,
//         created_by: user.id,
//       });

//       if (insertError) {
//         setError(insertError.message);
//         setLoading(false);
//         return;
//       }
//     }

//     haptic("success");
//     setLoading(false);
//     router.push(isEdit ? `/dashboard/farmers/${farmer.id}` : "/dashboard/farmers");
//     router.refresh();
//   };

//   const handleDelete = async () => {
//     if (!confirm(`Delete ${farmer.name}? This cannot be undone.`)) return;
//     haptic("warning");
//     setDeleting(true);
//     setError("");

//     const { error: deleteError } = await supabase.from("farmers").delete().eq("id", farmer.id);

//     if (deleteError) {
//       setError(deleteError.message);
//       setDeleting(false);
//       return;
//     }

//     router.push("/dashboard/farmers");
//     router.refresh();
//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit} className="space-y-5">
//         <Field label="Name">
//           <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Farmer's full name" />
//         </Field>

//         <Field label="Mobile number">
//           <TextInput
//             type="tel"
//             required
//             value={mobileNumber}
//             onChange={(e) => setMobileNumber(e.target.value)}
//             placeholder="10-digit mobile number"
//           />
//         </Field>

//         <Field label="Village">
//           <TextInput value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village name" />
//         </Field>

//         <Field label="Notes">
//           <textarea
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             placeholder="Any additional notes"
//             rows={3}
//             className="input-base w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none resize-none form-textarea"
//             style={{
//               color: "var(--color-text)",
//               backgroundColor: "var(--color-bg)",
//               border: "1.5px solid var(--color-border)",
//             }}
//           />
//         </Field>

//         {error && (
//           <p
//             className="text-[13px] rounded-2xl px-4 py-3"
//             style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)" }}
//           >
//             {error}
//           </p>
//         )}

//         <PrimaryButton type="submit" loading={loading}>
//           {isEdit ? "Save changes" : "Add farmer"}
//         </PrimaryButton>
//       </form>

//       {isEdit && (
//         <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
//           <h3 className="text-[13px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-danger)" }}>
//             Danger Zone
//           </h3>
//           <div
//             className="rounded-2xl p-4"
//             style={{ backgroundColor: "var(--color-danger-bg)", border: "1px solid rgba(179,38,30,0.2)" }}
//           >
//             <p className="text-[13px] mb-3" style={{ color: "var(--color-text-muted)" }}>
//               Deleting this farmer will permanently remove their record. This cannot be undone.
//             </p>
//             <button
//               type="button"
//               onClick={handleDelete}
//               disabled={deleting}
//               className="danger-btn w-full rounded-2xl py-3.5 font-medium text-[15px] disabled:opacity-50"
//               style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
//             >
//               {deleting ? "Deleting..." : "Delete Farmer"}
//             </button>
//           </div>
//         </div>
//       )}

//       <style jsx>{`
//         .form-textarea {
//           transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease-out;
//         }
//         .form-textarea:focus {
//           box-shadow: 0 0 0 3px rgba(193, 68, 14, 0.12);
//         }
//         .danger-btn {
//           transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out;
//         }
//         .danger-btn:active {
//           transform: scale(0.97);
//         }
//         @media (prefers-reduced-motion: reduce) {
//           .form-textarea,
//           .danger-btn {
//             transition-duration: 0.001s !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Field, PrimaryButton } from "@/components/ui/Shell";
import TextInput from "@/components/ui/TextInput";
import { haptic } from "@/lib/haptics";

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

  const validateForm = () => {
    const trimmedName = name.trim();
    const trimmedVillage = village.trim();

    if (!trimmedName) {
      return "Farmer name is required.";
    }

    if (!mobileNumber.trim()) {
      return "Mobile number is required.";
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return "Enter a valid 10-digit mobile number.";
    }

    if (!trimmedVillage) {
      return "Village name is required.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      haptic("warning");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      mobile_number: mobileNumber,
      village: village.trim(),
      notes: notes.trim(),
    };

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("farmers")
        .update(payload)
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
        ...payload,
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

    router.push(
      isEdit ? `/dashboard/farmers/${farmer.id}` : "/dashboard/farmers",
    );

    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${farmer.name}? This cannot be undone.`)) return;

    haptic("warning");

    setDeleting(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("farmers")
      .delete()
      .eq("id", farmer.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    router.push("/dashboard/farmers");
    router.refresh();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <TextInput
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Farmer's full name"
          />
        </Field>

        <Field label="Mobile number">
          <TextInput
            type="tel"
            required
            value={mobileNumber}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) =>
              setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit mobile number"
          />
        </Field>

        <Field label="Village">
          <TextInput
            required
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village name"
          />
        </Field>

        <Field label="Notes (Optional)">
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
            className="text-[13px] rounded-2xl px-4 py-3 error-shake"
            style={{
              backgroundColor: "var(--color-danger-bg)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </p>
        )}

        <PrimaryButton type="submit" loading={loading}>
          {isEdit ? "Save changes" : "Add farmer"}
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
              Deleting this farmer will permanently remove their record. This
              action cannot be undone.
            </p>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="danger-btn w-full rounded-2xl py-3.5 font-medium text-[15px] disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-danger)",
                color: "#fff",
              }}
            >
              {deleting ? "Deleting..." : "Delete Farmer"}
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

        .error-shake {
          animation: shake 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .form-textarea,
          .danger-btn,
          .error-shake {
            transition-duration: 0.001s !important;
            animation-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}
