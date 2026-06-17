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

  const handleDownloadPDF = () => {
    if (!booking || !event) return;

    // Landscape A5
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
    const W = 210, H = 148;

    // ── Background ──────────────────────────────────────────────────
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");

    // ── Art panel (left ~70mm wide) ─────────────────────────────────
    const artW = 72;
    doc.setFillColor(245, 230, 248); // pastel purple
    doc.rect(0, 0, artW, H, "F");

    // Decorative blobs
    doc.setFillColor(234, 212, 245);
    doc.ellipse(58, 20, 24, 18, "F");
    doc.setFillColor(200, 238, 224);
    doc.ellipse(62, 110, 18, 14, "F");
    doc.setFillColor(247, 212, 232);
    doc.ellipse(45, 75, 16, 13, "F");

    // Paint palette circles (decorative)
    const palette = [
      { x: 52, y: 88, r: 4, rgb: [245, 184, 212] },
      { x: 61, y: 83, r: 3, rgb: [160, 212, 184] },
      { x: 66, y: 92, r: 3.5, rgb: [200, 168, 232] },
      { x: 62, y: 101, r: 3, rgb: [240, 192, 144] },
      { x: 53, y: 100, r: 3.5, rgb: [144, 200, 224] },
      { x: 48, y: 92, r: 3, rgb: [240, 160, 192] },
    ];
    palette.forEach(p => {
      doc.setFillColor(p.rgb[0], p.rgb[1], p.rgb[2]);
      doc.circle(p.x, p.y, p.r, "F");
    });
    doc.setFillColor(232, 213, 245);
    doc.circle(57, 92, 9, "F");

    // Club name text
    doc.setTextColor(90, 30, 120);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setCharSpace(2);
    doc.text("OFFICIAL ENTRY PASS", 8, 22);
    doc.setCharSpace(0);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(60, 15, 90);
    doc.text("Chai & Bae", 8, 35);
    doc.text("Club Dubai", 8, 46);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(176, 122, 202);
    doc.text("Art, chai & good company", 8, 55);

    // Confirmed badge (bottom of art panel)
    doc.setDrawColor(108, 191, 154);
    doc.setLineWidth(0.4);
    doc.roundedRect(8, H - 22, 54, 8, 3, 3, "D");
    doc.setTextColor(42, 122, 82);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setCharSpace(1);
    doc.text("✓  CONFIRMED", 35, H - 16, { align: "center" });
    doc.setCharSpace(0);

    // ── Route bar ───────────────────────────────────────────────────
    const routeY = 0, routeH = 28;
    doc.setFillColor(124, 58, 173);
    doc.rect(artW, routeY, W - artW, routeH, "F");

    // YOU →✦→ DXB
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text("YOU", artW + 8, 18);
    doc.setFontSize(7);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(255, 255, 255, 0.6);
    doc.text("GUEST", artW + 8, 24);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(240, 192, 255);
    doc.setCharSpace(0.5);
    const eventLabel = (event.title || "Club Event").toUpperCase();
    doc.text(eventLabel, (artW + W) / 2, 16, { align: "center" });
    doc.setCharSpace(0);
    doc.setFontSize(6.5);
    doc.setTextColor(200, 160, 230);
    doc.text("EVENING EXPERIENCE", (artW + W) / 2, 22, { align: "center" });

    // Arrow line
    doc.setDrawColor(200, 160, 230);
    doc.setLineWidth(0.3);
    doc.line(artW + 24, 14, (artW + W) / 2 - 22, 14);
    doc.line((artW + W) / 2 + 22, 14, W - 28, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text("DXB", W - 8, 18, { align: "right" });
    doc.setFontSize(7);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(200, 160, 230);
    doc.text("DUBAI", W - 8, 24, { align: "right" });

    // ── Main body ───────────────────────────────────────────────────
    const bodyX = artW + 6;
    const bodyY = routeH + 8;

    const fieldLabel = (text: string, x: number, y: number) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(176, 122, 202);
      doc.setCharSpace(1.5);
      doc.text(text.toUpperCase(), x, y);
      doc.setCharSpace(0);
    };

    const fieldValue = (text: string, x: number, y: number, size = 10, color = [42, 26, 53]) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, x, y);
    };

    // Booking ID — full width highlight
    doc.setFillColor(245, 230, 248);
    doc.setDrawColor(209, 160, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(bodyX - 2, bodyY - 5, 88, 12, 2, 2, "FD");

    fieldLabel("Confirmation Code", bodyX + 2, bodyY);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(124, 58, 173);
    doc.setCharSpace(0.5);
    doc.text(booking.id, bodyX + 2, bodyY + 6);
    doc.setCharSpace(0);

    // Guest info grid
    const col1 = bodyX, col2 = bodyX + 48;
    let gy = bodyY + 18;

    fieldLabel("Guest Name", col1, gy);
    fieldValue(booking.name, col1, gy + 5, 10);

    fieldLabel("Date", col2, gy);
    fieldValue(event.date || "", col2, gy + 5, 9.5);

    gy += 16;
    fieldLabel("WhatsApp", col1, gy);
    fieldValue(booking.whatsapp, col1, gy + 5, 9);

    fieldLabel("Time", col2, gy);
    fieldValue(event.time || "", col2, gy + 5, 9.5);

    gy += 16;
    fieldLabel("Email", col1, gy);
    const emailText = doc.splitTextToSize(booking.email, 82);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(42, 26, 53);
    doc.text(emailText, col1, gy + 5);

    // ── Divider line ────────────────────────────────────────────────
    gy += 18;
    doc.setDrawColor(212, 232, 218);
    doc.setLineWidth(0.3);
    doc.line(bodyX - 2, gy, bodyX + 86, gy);

    // ── What's included ─────────────────────────────────────────────
    gy += 6;
    fieldLabel("What's Included", bodyX, gy);

    const included: string[] = booking.included || [
      "Canvas & paints",
      "Guided painting session",
      "All brushes & tools",
      "Apron & easel",
      "Take-home artwork",
    ];

    gy += 5;
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");

    const halfInc = Math.ceil(included.length / 2);
    included.forEach((item, i) => {
      const cx = i < halfInc ? col1 : col2;
      const cy = gy + (i < halfInc ? i : i - halfInc) * 7;

      // Green dot
      doc.setFillColor(108, 191, 154);
      doc.circle(cx, cy - 1.2, 1.2, "F");
      doc.setTextColor(42, 61, 48);
      doc.text(item, cx + 3.5, cy);
    });

    // ── Not included ────────────────────────────────────────────────
    const incRows = Math.ceil(included.length / 2);
    let excY = gy + incRows * 7 + 4;

    fieldLabel("Not Included", bodyX, excY);
    excY += 5;

    const excluded = ["Food", "Drinks", "Transport"];
    excluded.forEach((item, i) => {
      const cx = bodyX + i * 30;
      doc.setFillColor(232, 160, 184);
      doc.roundedRect(cx, excY - 2.5, 2.5, 2.5, 0.5, 0.5, "F");
      doc.setFontSize(7.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(107, 64, 80);
      doc.text(item, cx + 4, excY);
    });

    // ── Stub (right column) ─────────────────────────────────────────
    const stubX = W - 38;

    // Stub background
    doc.setFillColor(253, 244, 255);
    doc.rect(stubX - 4, routeH, 42, H - routeH, "F");

    // Dashed left border
    doc.setDrawColor(224, 184, 240);
    doc.setLineWidth(0.5);
    for (let y = routeH + 4; y < H - 4; y += 5) {
      doc.line(stubX - 4, y, stubX - 4, y + 3);
    }
    // Notch circles
    doc.setFillColor(255, 255, 255);
    doc.circle(stubX - 4, routeH, 3, "F");
    doc.circle(stubX - 4, H, 3, "F");

    // Stub content
    const sX = stubX + 2;
    doc.setTextColor(176, 122, 202);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6);
    doc.setCharSpace(1.2);
    doc.text("BOOKING ID", sX, routeH + 10, { align: "center" });
    doc.setCharSpace(0);

    doc.setTextColor(90, 30, 120);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    const idParts = booking.id.split("-");
    idParts.forEach((part: string, i: number) => {
      doc.text(part, sX, routeH + 17 + i * 6, { align: "center" });
    });

    // Stub divider
    doc.setDrawColor(224, 184, 240);
    doc.setLineWidth(0.3);
    doc.line(stubX - 1, routeH + 38, W - 3, routeH + 38);

    doc.setTextColor(176, 122, 202);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(6);
    doc.setCharSpace(1);
    doc.text("PASS NO.", sX, routeH + 46, { align: "center" });
    doc.setCharSpace(0);

    doc.setTextColor(124, 58, 173);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("A7", sX, routeH + 58, { align: "center" });

    // Stub divider 2
    doc.line(stubX - 1, routeH + 64, W - 3, routeH + 64);

    // Barcode (decorative bars)
    const barsStartY = routeH + 70;
    const barHeights = [14, 10, 18, 8, 14, 10, 20, 8, 12, 16, 10, 18];
    let bx = stubX - 1;
    barHeights.forEach((bh, i) => {
      doc.setFillColor(124, 58, 173);
      const bw = i % 3 === 0 ? 2 : 1;
      doc.setFillColor(124, 58, 173);
      doc.rect(bx, barsStartY, bw, bh, "F");
      bx += bw + 1.5;
    });

    doc.setTextColor(201, 160, 223);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text("SCAN AT ENTRY", sX, barsStartY + 24, { align: "center" });

    // ── Footer ──────────────────────────────────────────────────────
    doc.setFillColor(245, 250, 247);
    doc.rect(artW, H - 14, W - artW - 38, 14, "F");

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(90, 138, 106);
    doc.text(
      "Venue shared via WhatsApp 24hrs before · Non-transferable · One admission",
      artW + 8, H - 6
    );

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
