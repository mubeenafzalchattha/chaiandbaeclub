"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatUaePhoneReadable, isFreeEvent, REFUND_POLICY } from "@/lib/utils";
import { downloadTicketPdf } from "@/lib/ticketPdf";

function SuccessFallback() {
  return (
    <main className="container" style={{ padding: "80px 24px" }}>
      <div className="glass-card text-center" style={{ padding: "60px", maxWidth: "500px", margin: "0 auto" }}>
        <div className="loader-dots" style={{ scale: "1.5", marginBottom: "20px" }}>
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Formatting your digital ticket...</p>
      </div>
    </main>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError("No booking reference found.");
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const res = await fetch(`/api/checkout/confirm?bookingId=${bookingId}&check=true`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load booking ticket.");
        }

        setBooking(data.booking);
        setEvent(data.event);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to retrieve your booking ticket.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleDownloadPDF = async () => {
    if (!booking || !event) return;
    setDownloading(true);
    try {
      await downloadTicketPdf(booking, event);
    } catch (err) {
      console.error(err);
      alert("Sorry, we couldn't generate your ticket PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };


  if (loading) {
    return <SuccessFallback />;
  }

  if (error || !booking) {
    return (
      <main className="container" style={{ padding: "80px 24px" }}>
        <div className="glass-card text-center" style={{ padding: "60px", maxWidth: "600px", margin: "0 auto", borderColor: "#78281F" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
          <h3 style={{ marginBottom: "12px", color: "#78281F" }}>Ticket Retrival Error</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
            {error || "We could not find a confirmed booking with this reference ID."}
          </p>
          <a href="/" className="btn btn-primary">Return to Home</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "80vh", padding: "60px 0" }}>
      {/* Decorative Confetti Background element */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle, rgba(255,214,220,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1
        }}
      ></div>

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="text-center" style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "60px", animation: "float 4s infinite ease-in-out" }}>✨🌸✨</div>
          <h2 className="section-title" style={{ marginTop: "12px" }}>See you there, baddie!</h2>
          <p className="section-desc" style={{ marginBottom: "0" }}>
            {isFreeEvent(event)
              ? "Your free spot is reserved and your reservation for the club event is officially confirmed!"
              : "Your transaction has been securely processed by Ziina. Your physical reservation for the club event is officially confirmed!"}
          </p>
        </div>

        {/* Highlight notification bar */}
        <div
          style={{
            background: "var(--accent-pink-light)",
            border: "1px solid var(--accent-pink-soft)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "32px",
            color: "var(--accent-berry)",
            fontWeight: "600",
            fontSize: "14px",
            textAlign: "center",
            maxWidth: "520px",
            margin: "0 auto 32px"
          }}
        >
          📢 Note: The exact venue will be shared on WhatsApp one day before the event.
        </div>

        {/* The Beautiful Ticket Stub wrapper */}
        <div className="ticket-wrapper">
          <div className="ticket">
            {/* Ticket Header Card */}
            <div className="ticket-header">
              <span className="ticket-badge">
                ✓ BOOKING CONFIRMED
              </span>

              <h1 className="ticket-title">
                {event?.title}
              </h1>

              <p className="ticket-subtitle">
                Chai & Bae Club • Reservation Summary Pass
              </p>
            </div>

            {/* Ticket slit divider */}
            <div className="ticket-divider">
              <div className="ticket-divider-line"></div>
            </div>

            {/* Ticket Body Content */}
            <div className="ticket-body">
              <div style={{ display: "flex", gap: "12px", marginBottom: "18px", alignItems: "center" }}>
                <img
                  src={event.image}
                  alt={event.title}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "10px",
                    objectFit: "cover"
                  }}
                />

                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {event.date} • {event.time}
                  </div>
                </div>
              </div>
              <div className="ticket-detail-grid">
                <div className="ticket-detail-item">
                  <h5>CONFIRMATION CODE</h5>
                  <p style={{ fontFamily: "monospace", fontSize: "16px", color: "var(--accent-berry)", fontWeight: "700" }}>
                    {booking.id}
                  </p>
                </div>

                <div className="ticket-detail-item">
                  <h5>HAVE-A-SPOT GUEST</h5>
                  <p>{booking.name}</p>
                </div>

                <div className="ticket-detail-item">
                  <h5>WHATSAPP</h5>
                  <p>{formatUaePhoneReadable(booking.whatsapp)}</p>
                </div>

                <div className="ticket-detail-item">
                  <h5>EMAIL ADDRESS</h5>
                  <p style={{ wordBreak: "break-all", fontSize: "13px" }}>{booking.email}</p>
                </div>

                <div className="ticket-detail-item">
                  <h5>EVENT TIMING</h5>
                  <p>{event?.date}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "normal", marginTop: "2px" }}>
                    {event?.time}
                  </p>
                </div>

                <div className="ticket-detail-item">
                  <h5>VENUE PLACE</h5>
                  <p>{event?.location.split(",")[0]}</p>
                  <p style={{ fontSize: "11px", color: "var(--accent-sage-dark)", fontWeight: "600", marginTop: "2px", lineHeight: "1.3" }}>
                    ✓ Exact venue shared on WhatsApp 1 day before event
                  </p>
                </div>

                <div className="ticket-detail-item">
                  <h5>Whats Included</h5>

                  <p style={{ fontSize: "11px", color: "var(--accent-sage-dark)", fontWeight: "600", marginTop: "2px", lineHeight: "1.3" }}>
                    {(event.include || []).join(", ") || "Nothing that is not mentioned."}
                  </p>
                </div>
              </div>

              {!isFreeEvent(event) && (
                <div className="refund-note" style={{ marginTop: "18px" }}>
                  <div className="refund-note-title">🚫 {REFUND_POLICY.headline}</div>
                  <p>{REFUND_POLICY.short} Message us on WhatsApp if your plans change.</p>
                </div>
              )}

              {/* Secure Stamp */}
              <div className="ticket-stamp">
                ✓ SECURED
                <span>{isFreeEvent(event) ? "FREE ENTRY" : "ZIINA LEDGER"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button row for download */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
          <button onClick={handleDownloadPDF} className="btn btn-sage" style={{ padding: "12px 24px" }} disabled={downloading}>
            {downloading ? "Preparing your ticket..." : "📥 Download Ticket PDF"}
          </button>
        </div>

        {/* What to do next notes */}
        <div className="glass-card" style={{ maxWidth: "520px", margin: "30px auto 0", padding: "24px", textAlign: "center" }}>
          <h4 style={{ color: "var(--accent-berry)", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
            🌸 What Happens Next?
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.6" }}>
            1. We have dispatched an automated confirmation to your WhatsApp: **{formatUaePhoneReadable(booking.whatsapp)}**. The exact venue coordinates will be shared on WhatsApp one day before the event.
            2. High tea, pastries, good vibes, and all painting/planting ingredients are 100% covered in your booking.
            3. Dress code is **aesthetic pastel tones**! Bring your beautiful energy.
          </p>
          <div style={{ marginTop: "20px" }}>
            <a href="/" className="btn btn-secondary">Return to Home</a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TicketSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
