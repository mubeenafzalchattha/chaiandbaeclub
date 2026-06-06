"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency, formatUaePhoneReadable } from "@/lib/utils";
import { jsPDF } from "jspdf";

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

  // const handleDownloadPDF = () => {
  //   if (!booking || !event) return;

  //   const doc = new jsPDF({
  //     orientation: "portrait",
  //     unit: "mm",
  //     format: "a5",
  //   });

  //   // Background Card
  //   doc.setFillColor(250, 246, 240);
  //   doc.rect(0, 0, 148, 210, "F");

  //   // Top Header Ribbon
  //   doc.setFillColor(93, 18, 37);
  //   doc.rect(0, 0, 148, 30, "F");

  //   // Header Text
  //   doc.setTextColor(255, 240, 242);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setFontSize(10);
  //   doc.text("CHAI & BAE CLUB DUBAI", 74, 12, { align: "center" });
  //   doc.setFontSize(14);
  //   doc.text("OFFICIAL ENTRY PASS", 74, 20, { align: "center" });

  //   // Divider
  //   doc.setDrawColor(255, 142, 158);
  //   doc.setLineWidth(0.5);
  //   doc.line(10, 38, 138, 38);

  //   // Event Title
  //   doc.setTextColor(93, 18, 37);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setFontSize(15);
  //   doc.text(event.title || "Club Event Pass", 74, 48, { align: "center" });

  //   // Border container
  //   doc.setDrawColor(224, 109, 125);
  //   doc.rect(10, 58, 128, 122);

  //   // Grid details
  //   doc.setFontSize(9);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");

  //   // Left side info
  //   doc.text("CONFIRMATION CODE", 15, 68);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setTextColor(93, 18, 37);
  //   doc.setFontSize(12);
  //   doc.text(booking.id, 15, 74);

  //   doc.setFontSize(9);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");
  //   doc.text("GUEST NAME", 15, 90);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setTextColor(44, 30, 27);
  //   doc.setFontSize(11);
  //   doc.text(booking.name, 15, 96);

  //   doc.setFontSize(9);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");
  //   doc.text("WHATSAPP CONTACT", 15, 112);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setTextColor(44, 30, 27);
  //   doc.setFontSize(11);
  //   doc.text(booking.whatsapp, 15, 118);

  //   // Right side info
  //   doc.setFontSize(9);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");
  //   doc.text("EVENT TIMING", 80, 68);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setTextColor(44, 30, 27);
  //   doc.setFontSize(11);
  //   doc.text(event.date || "", 80, 74);
  //   doc.setFont("Helvetica", "normal");
  //   doc.setFontSize(10);
  //   doc.text(event.time || "", 80, 80);

  //   doc.setFontSize(9);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");
  //   doc.text("VENUE PLACE", 80, 96);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setTextColor(44, 30, 27);
  //   doc.setFontSize(11);
  //   doc.text(event.location.split(",")[0], 80, 102);

  //   doc.setFontSize(9);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");
  //   doc.text("EMAIL ADDRESS", 80, 112);
  //   doc.setFont("Helvetica", "bold");
  //   doc.setTextColor(44, 30, 27);
  //   doc.setFontSize(10);
  //   const splitEmail = doc.splitTextToSize(booking.email, 50);
  //   doc.text(splitEmail, 80, 118);

  //   // Divider line
  //   doc.setDrawColor(224, 109, 125);
  //   doc.line(10, 135, 138, 135);

  //   // Important notes
  //   doc.setFontSize(9);
  //   doc.setTextColor(92, 123, 108);
  //   doc.setFont("Helvetica", "bold");
  //   doc.text("IMPORTANT VENUE DETAILS", 74, 142, { align: "center" });

  //   doc.setFontSize(8.5);
  //   doc.setTextColor(107, 91, 87);
  //   doc.setFont("Helvetica", "normal");
  //   doc.text("The exact venue coordinates in Dubai will be shared", 74, 150, { align: "center" });
  //   doc.text("via WhatsApp (+971) one day before the event.", 74, 155, { align: "center" });

  //   // Seal
  //   doc.setDrawColor(92, 123, 108);
  //   doc.setLineWidth(1);
  //   doc.circle(74, 185, 12, "D");
  //   doc.setFontSize(8);
  //   doc.setTextColor(92, 123, 108);
  //   doc.setFont("Helvetica", "bold");
  //   doc.text("CONFIRMED", 74, 183, { align: "center" });
  //   doc.setFontSize(6);
  //   doc.text("BAE CLUB LEDGER", 74, 188, { align: "center" });

  //   doc.save(`chai_and_bae_ticket_${booking.id}.pdf`);
  // };

  const handleDownloadPDF = () => {
    if (!booking || !event) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const W = 148, H = 210;

    // ── Background ──────────────────────────────────────────────────
    doc.setFillColor(250, 246, 240);
    doc.rect(0, 0, W, H, "F");

    // ── Header ribbon ───────────────────────────────────────────────
    doc.setFillColor(93, 18, 37);
    doc.rect(0, 0, W, 38, "F");

    // Subtle circle decoration in header
    doc.setDrawColor(255, 240, 242);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 240, 242);
    // (jsPDF circle is outline-only; we skip the decorative circle for clean output)

    // Eyebrow label
    doc.setTextColor(255, 142, 158);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setCharSpace(2.5);
    doc.text("OFFICIAL ENTRY PASS", 74, 10, { align: "center" });
    doc.setCharSpace(0);

    // Club name
    doc.setTextColor(255, 240, 242);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CHAI & BAE CLUB DUBAI", 74, 20, { align: "center" });

    // Members line
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(255, 240, 242);
    doc.setCharSpace(2);
    doc.text("MEMBERS & GUESTS", 74, 29, { align: "center" });
    doc.setCharSpace(0);

    // ── Event banner (darker burgundy strip) ────────────────────────
    doc.setFillColor(110, 25, 45);
    doc.rect(0, 38, W, 14, "F");

    doc.setTextColor(255, 214, 222);
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(11);
    doc.text(event.title || "Club Event Pass", 15, 47);

    // Confirmed badge (right-aligned)
    doc.setDrawColor(92, 123, 108);
    doc.setLineWidth(0.4);
    doc.roundedRect(108, 42, 30, 7, 3, 3, "D");
    doc.setTextColor(92, 123, 108);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setCharSpace(1);
    doc.text("✓  CONFIRMED", 123, 47, { align: "center" });
    doc.setCharSpace(0);

    // ── Info grid border ────────────────────────────────────────────
    const gridX = 12, gridY = 58, gridW = 124, gridH = 66;
    doc.setDrawColor(224, 109, 125);
    doc.setLineWidth(0.4);
    doc.roundedRect(gridX, gridY, gridW, gridH, 3, 3, "D");

    // Grid internal lines
    doc.setDrawColor(240, 196, 204);
    doc.setLineWidth(0.3);
    // Vertical center divider (rows 2–4)
    doc.line(74, gridY + 16, 74, gridY + gridH);
    // Horizontal separators
    doc.line(gridX, gridY + 16, gridX + gridW, gridY + 16); // below code
    doc.line(gridX, gridY + 33, gridX + gridW, gridY + 33); // below row 2
    doc.line(gridX, gridY + 50, gridX + gridW, gridY + 50); // below row 3

    const label = (text: string, x: number, y: number) => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(160, 128, 122);
      doc.setCharSpace(1.5);
      doc.text(text, x, y);
      doc.setCharSpace(0);
    };

    const value = (text: string, x: number, y: number, size = 10.5) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(44, 30, 27);
      doc.text(text, x, y);
    };

    // Row 1 — Confirmation code (full width)
    label("CONFIRMATION CODE", 17, 65);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(93, 18, 37);
    doc.setCharSpace(1);
    doc.text(booking.id, 17, 73);
    doc.setCharSpace(0);

    // Row 2 — Name / Date
    label("GUEST NAME", 17, 81);
    value(booking.name, 17, 88);

    label("EVENT TIMING", 77, 81);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(44, 30, 27);
    doc.text(event.date || "", 77, 88);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 95, 90);
    doc.text(event.time || "", 77, 93);

    // Row 3 — WhatsApp / Venue
    label("WHATSAPP CONTACT", 17, 98);
    value(booking.whatsapp, 17, 105);

    label("VENUE", 77, 98);
    value(event.location.split(",")[0], 77, 105, 9.5);

    // Row 4 — Email
    label("EMAIL ADDRESS", 17, 115);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(44, 30, 27);
    const splitEmail = doc.splitTextToSize(booking.email, 115);
    doc.text(splitEmail, 17, 121);

    // ── Venue hint box ──────────────────────────────────────────────
    doc.setFillColor(235, 245, 240);
    doc.setDrawColor(92, 123, 108);
    doc.setLineWidth(0.35);
    doc.roundedRect(12, 130, 124, 20, 3, 3, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(74, 110, 94);
    doc.setCharSpace(1.5);
    doc.text("IMPORTANT — VENUE DETAILS", 74, 137, { align: "center" });
    doc.setCharSpace(0);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(92, 123, 108);
    doc.text(
      "Exact coordinates in Dubai will be shared via WhatsApp (+971)",
      74, 143, { align: "center" }
    );
    doc.text("one day before the event.", 74, 148, { align: "center" });

    // ── Tearline ────────────────────────────────────────────────────
    doc.setDrawColor(232, 197, 204);
    doc.setLineWidth(0.5);
    // Dashed line: draw as short segments
    const dashY = 158;
    for (let x = 14; x < 134; x += 5) {
      doc.line(x, dashY, Math.min(x + 3, 134), dashY);
    }
    // Small diamond in center
    doc.setFillColor(232, 197, 204);
    const cx = 74, cy = dashY;
    doc.setDrawColor(224, 109, 125);
    doc.circle(cx, cy, 2, "FD");

    // ── Footer ──────────────────────────────────────────────────────
    doc.setFillColor(253, 241, 243);
    doc.rect(0, 163, W, H - 163, "F");

    // Ledger seal — pill badge
    doc.setDrawColor(92, 123, 108);
    doc.setLineWidth(0.4);
    doc.roundedRect(49, 170, 50, 9, 4, 4, "D");
    doc.setTextColor(92, 123, 108);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setCharSpace(1.5);
    doc.text("BAE CLUB LEDGER", 74, 176, { align: "center" });
    doc.setCharSpace(0);

    // Footer fine print
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(138, 112, 112);
    doc.text("Present this pass at entry · Non-transferable · One admission", 74, 188, {
      align: "center",
    });

    doc.save(`chai_and_bae_ticket_${booking.id}.pdf`);
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
            Your transaction has been securely processed by Ziina. Your physical reservation
            for the club event is officially confirmed!
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
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", color: "var(--accent-pink-soft)" }}>
                OFFICIAL RESERVATION PASS
              </span>
              <h1 style={{ marginTop: "8px", fontFamily: "var(--font-serif)" }}>{event?.title}</h1>
              <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--accent-pink-light)" }}>
                Chai &amp; Bae Club Event
              </p>
            </div>

            {/* Ticket slit divider */}
            <div className="ticket-divider">
              <div className="ticket-divider-line"></div>
            </div>

            {/* Ticket Body Content */}
            <div className="ticket-body">
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
              </div>

              {/* Secure Stamp */}
              <div className="ticket-stamp">
                ✓ SECURED
                <span>ZIINA LEDGER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button row for download */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
          <button onClick={handleDownloadPDF} className="btn btn-sage" style={{ padding: "12px 24px" }}>
            📥 Download Ticket PDF
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
