import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CheckoutFormClient from "./CheckoutFormClient";

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  
  // Fetch event details
  const event = await db.getEventById(id);
  
  if (!event || event.status !== "active") {
    return notFound();
  }

  // Count active reservations
  const bookings = await db.getBookingsByEventId(id);
  const paidCount = bookings.filter(b => b.status === "paid").length;
  const isSoldOut = paidCount >= event.maxSlots;
  const isDeadlinePassed = new Date(event.deadline).getTime() < Date.now();

  if (isSoldOut || isDeadlinePassed) {
    return (
      <main className="container" style={{ padding: "80px 24px" }}>
        <div className="glass-card text-center" style={{ padding: "60px", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚨</div>
          <h3 style={{ marginBottom: "12px" }}>Booking Unavailable</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
            We apologize, but this event is no longer accepting reservations. 
            The slots may be fully booked or the registration deadline has passed.
          </p>
          <a href="/" className="btn btn-primary">Return to Home</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "80vh", padding: "40px 0" }}>
      <div className="container">
        <CheckoutFormClient event={event} spotsLeft={event.maxSlots - paidCount} />
      </div>
    </main>
  );
}
