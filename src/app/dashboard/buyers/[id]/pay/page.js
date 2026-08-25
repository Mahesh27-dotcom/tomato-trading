"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import BuyerPaymentForm from "@/components/payments/BuyerPaymentForm";

export default function AddBuyerPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("buyers").select("*").eq("id", params.id).single();
      setBuyer(data);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Buyer not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={() => router.push(`/dashboard/buyers/${buyer.id}`)}
          className="back-btn text-[14px] font-medium mb-5 inline-flex items-center gap-1"
          style={{ color: "var(--color-accent)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <span className="back-arrow">←</span> Back to {buyer.name}
        </button>

        <h1
          className="text-[22px] font-semibold mb-6"
          style={{ color: "var(--color-text)", animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both" }}
        >
          Add Payment
        </h1>

        <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}>
          <BuyerPaymentForm buyerId={buyer.id} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .back-btn { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out; }
        .back-btn:active { transform: scale(0.96); opacity: 0.7; }
        .back-arrow { display: inline-block; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) { .back-btn:hover .back-arrow { transform: translateX(-3px); } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001s !important;
            animation-delay: 0s !important;
            transition-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}