import { jsPDF } from "jspdf";
import { formatCurrency, formatUaePhoneReadable, isFreeEvent, REFUND_POLICY } from "@/lib/utils";

/**
 * Downloadable ticket PDF, styled to match the website:
 * cream page, pastel blobs, berry + pastel pink palette, Indie Flower headings,
 * and a perforated ticket stub.
 */

type RGB = [number, number, number];

// Site palette (see :root tokens in globals.css)
const C = {
  cream: [250, 246, 240] as RGB,
  white: [255, 255, 255] as RGB,
  berry: [93, 18, 37] as RGB,
  pink: [255, 154, 162] as RGB,
  pinkDark: [230, 134, 142] as RGB,
  pinkLight: [255, 245, 246] as RGB,
  pinkBlob: [255, 225, 228] as RGB,
  peach: [232, 197, 200] as RGB,
  tealBlob: [222, 246, 240] as RGB,
  sageDark: [64, 92, 78] as RGB,
  text: [44, 30, 27] as RGB,
  muted: [107, 91, 87] as RGB,
};

// Indie Flower is the site's display font. jsPDF needs the TTF, so fetch it once
// (Google Fonts repo via jsDelivr) and fall back to Times italic if it can't load.
const INDIE_FLOWER_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/indieflower/IndieFlower-Regular.ttf";
let indieFlowerBase64: string | null | undefined;

async function loadIndieFlower(): Promise<string | null> {
  if (indieFlowerBase64 !== undefined) return indieFlowerBase64;
  try {
    const res = await fetch(INDIE_FLOWER_URL);
    if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    indieFlowerBase64 = btoa(binary);
  } catch (err) {
    console.warn("Ticket font unavailable, using fallback.", err);
    indieFlowerBase64 = null;
  }
  return indieFlowerBase64;
}

// Crops the event image to cover the target box with rounded corners (like
// CSS object-fit: cover + border-radius) and returns a PNG data URL.
function loadCoverImage(url: string, wMm: number, hMm: number, radiusMm: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = 8; // px per mm, plenty for print/screens
        const w = Math.round(wMm * scale);
        const h = Math.round(hMm * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        const r = radiusMm * scale;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.arcTo(w, 0, w, h, r);
        ctx.arcTo(w, h, 0, h, r);
        ctx.arcTo(0, h, 0, 0, r);
        ctx.arcTo(0, 0, w, 0, r);
        ctx.closePath();
        ctx.clip();

        const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * ratio;
        const dh = img.naturalHeight * ratio;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null); // tainted canvas (no CORS) or decode issue
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

interface TicketEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  image: string;
  include?: string[];
  exclude?: string[];
}

interface TicketBooking {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
}

export async function downloadTicketPdf(booking: TicketBooking, event: TicketEvent): Promise<void> {
  const W = 148;
  const H = 250;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, H] });

  const [fontData, imageData] = await Promise.all([
    loadIndieFlower(),
    loadCoverImage(event.image, 116, 44, 4),
  ]);

  if (fontData) {
    doc.addFileToVFS("IndieFlower-Regular.ttf", fontData);
    doc.addFont("IndieFlower-Regular.ttf", "IndieFlower", "normal");
  }
  const display = (size: number) => {
    if (fontData) doc.setFont("IndieFlower", "normal");
    else doc.setFont("times", "italic");
    doc.setFontSize(size);
  };
  const sans = (size: number, weight: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
  };
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const label = (txt: string, x: number, y: number, c: RGB = C.pinkDark) => {
    sans(6, "bold");
    color(c);
    doc.text(txt.toUpperCase(), x, y, { charSpace: 0.6 });
  };

  const isFree = isFreeEvent(event);

  // ── Page: cream background with soft pastel blobs ──────────────
  fill(C.cream);
  doc.rect(0, 0, W, H, "F");
  fill(C.pinkBlob);
  doc.circle(W + 4, -6, 48, "F");
  fill(C.tealBlob);
  doc.circle(-10, H - 30, 44, "F");
  fill(C.pinkBlob);
  doc.circle(W - 6, H + 8, 26, "F");

  // ── Ticket card ────────────────────────────────────────────────
  const cardX = 10;
  const cardY = 10;
  const cardW = W - 20;
  const cardH = H - 20;
  fill(C.white);
  stroke(C.peach);
  doc.setLineWidth(0.35);
  doc.roundedRect(cardX, cardY, cardW, cardH, 7, 7, "FD");

  const pad = 16;
  const contentW = W - pad * 2;
  let y = 23;

  // Brand
  display(19);
  color(C.berry);
  doc.text("bae club", pad, y);
  sans(5.5, "bold");
  color(C.pink);
  doc.text("CHAI & BAE", pad + 0.4, y + 4, { charSpace: 1.2 });

  // "Booking confirmed" pill
  const pillText = "BOOKING CONFIRMED";
  sans(6, "bold");
  const pillW = doc.getTextWidth(pillText) + 0.4 * pillText.length + 10;
  fill(C.berry);
  doc.roundedRect(W - pad - pillW, y - 5.5, pillW, 7.5, 3.75, 3.75, "F");
  color(C.cream);
  doc.text(pillText, W - pad - pillW / 2, y - 0.6, { align: "center", charSpace: 0.4 });

  y += 9;

  // Event image
  const imgH = 44;
  if (imageData) {
    doc.addImage(imageData, "PNG", pad, y, contentW, imgH, undefined, "FAST");
  } else {
    fill(C.pinkLight);
    stroke(C.peach);
    doc.roundedRect(pad, y, contentW, imgH, 4, 4, "FD");
    display(16);
    color(C.pink);
    doc.text("chai & bae", W / 2, y + imgH / 2 + 2, { align: "center" });
  }
  y += imgH + 11;

  // Event title
  display(20);
  color(C.berry);
  const titleLines = (doc.splitTextToSize(event.title, contentW) as string[]).slice(0, 2);
  doc.text(titleLines, pad, y, { lineHeightFactor: 1.05 });
  y += (titleLines.length - 1) * 8 + 9;

  // When / Time / Where
  const colW = contentW / 3;
  const infoCols: [string, string][] = [
    ["When", event.date],
    ["Time", event.time],
    ["Where", event.location.split(",")[0]],
  ];
  let infoBottom = y;
  infoCols.forEach(([lbl, val], i) => {
    const x = pad + colW * i;
    label(lbl, x, y);
    sans(8.5, "bold");
    color(C.text);
    const lines = (doc.splitTextToSize(val, colW - 4) as string[]).slice(0, 2);
    doc.text(lines, x, y + 5, { lineHeightFactor: 1.25 });
    infoBottom = Math.max(infoBottom, y + 5 + (lines.length - 1) * 3.8);
  });
  y = infoBottom + 4;
  sans(6.5);
  color(C.sageDark);
  doc.text("Exact venue shared on WhatsApp 1 day before the event", pad, y);

  // ── Perforation with side notches ──────────────────────────────
  y += 8;
  fill(C.cream);
  doc.circle(cardX, y, 4.5, "F");
  doc.circle(cardX + cardW, y, 4.5, "F");
  stroke(C.peach);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(cardX + 7, y, cardX + cardW - 7, y);
  doc.setLineDashPattern([], 0);
  y += 10;

  // ── Guest details ──────────────────────────────────────────────
  const half = contentW / 2;
  const detail = (lbl: string, val: string, x: number, yy: number, w: number, mono = false) => {
    label(lbl, x, yy);
    if (mono) {
      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      color(C.berry);
    } else {
      sans(9, "bold");
      color(C.text);
    }
    const line = (doc.splitTextToSize(val, w - 3) as string[])[0];
    doc.text(line, x, yy + 5.2);
  };
  detail("Guest", booking.name, pad, y, half);
  detail("Booking ID", booking.id, pad + half, y, half, true);
  y += 13;
  detail("WhatsApp", formatUaePhoneReadable(booking.whatsapp), pad, y, half);
  detail("Email", booking.email, pad + half, y, half);
  y += 13;

  // Total paid
  fill(C.pinkLight);
  stroke(C.peach);
  doc.setLineWidth(0.3);
  doc.roundedRect(pad, y, contentW, 13, 3, 3, "FD");
  label(isFree ? "Entry" : "Total Paid", pad + 5, y + 7.8, C.berry);
  display(16);
  color(C.berry);
  doc.text(isFree ? "Free!" : formatCurrency(event.price), W - pad - 5, y + 8.8, { align: "right" });
  y += 21;

  // Includes / not included (kept compact so the ticket fits one page)
  const include = (event.include || []).filter(Boolean);
  const exclude = (event.exclude || []).filter(Boolean);
  if (include.length > 0 || exclude.length > 0) {
    const maxRows = 4;
    const colX = [pad, pad + half];
    const lists: [string, string[], RGB][] = [
      ["What's included", include, C.sageDark],
      ["Not included", exclude, C.pinkDark],
    ];
    let listBottom = y;
    lists.forEach(([lbl, items, dot], i) => {
      if (items.length === 0) return;
      const x = colX[i];
      label(lbl, x, y, i === 0 ? C.sageDark : C.pinkDark);
      let ly = y + 5.5;
      const shown = items.length > maxRows ? items.slice(0, maxRows - 1) : items;
      shown.forEach((item) => {
        fill(dot);
        doc.circle(x + 1, ly - 1.1, 0.9, "F");
        sans(7.5);
        color(C.text);
        doc.text((doc.splitTextToSize(item, half - 8) as string[])[0], x + 3.5, ly);
        ly += 4.6;
      });
      if (items.length > maxRows) {
        sans(7, "normal");
        color(C.muted);
        doc.text(`+ ${items.length - shown.length} more`, x + 3.5, ly);
        ly += 4.6;
      }
      listBottom = Math.max(listBottom, ly);
    });
    y = listBottom + 3;
  }

  // ── No-refund notice (paid events) ─────────────────────────────
  if (!isFree) {
    const boxH = 17;
    const boxY = Math.min(y, H - 28 - boxH - 4);
    fill(C.berry);
    doc.roundedRect(pad, boxY, contentW, boxH, 3, 3, "F");
    sans(8, "bold");
    color(C.cream);
    doc.text(REFUND_POLICY.headline.toUpperCase(), pad + 5, boxY + 6.5, { charSpace: 0.3 });
    sans(6.8);
    color(C.peach);
    doc.text(
      doc.splitTextToSize(`${REFUND_POLICY.short} Message us on WhatsApp if your plans change.`, contentW - 10),
      pad + 5,
      boxY + 11
    );
  }

  // ── Footer ─────────────────────────────────────────────────────
  const footY = H - 19;
  stroke(C.peach);
  doc.setLineWidth(0.25);
  doc.line(pad, footY - 5, W - pad, footY - 5);
  display(12);
  color(C.pink);
  doc.text("for all my baddies", pad, footY);
  sans(6.5);
  color(C.muted);
  doc.text("chaiandbae.qnchattha.com", W - pad, footY, { align: "right" });

  doc.save(`chai_and_bae_ticket_${booking.id}.pdf`);
}
