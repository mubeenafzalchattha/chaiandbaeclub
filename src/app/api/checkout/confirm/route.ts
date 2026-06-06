import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Handle transaction checks & callbacks (GET)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const checkOnly = searchParams.get("check") === "true";
    const statusParam = searchParams.get("status"); // 'success' when redirected from live Ziina

    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID is required." }, { status: 400 });
    }

    const booking = await db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const event = await db.getEventById(booking.eventId);
    if (!event) {
      return NextResponse.json({ message: "Associated event not found." }, { status: 404 });
    }

    // If live Ziina returns successfully, automatically confirm booking
    if (statusParam === "success") {
      await db.updateBookingStatus(bookingId, "paid", "ziina_live_" + Date.now().toString());
      // Redirect directly to success page
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(`${baseUrl}/checkout/success?bookingId=${bookingId}`);
    }

    if (checkOnly) {
      return NextResponse.json({
        success: true,
        booking,
        event
      });
    }

    return NextResponse.json({ message: "Invalid request action." }, { status: 400 });

  } catch (error) {
    console.error("Booking verification error:", error);
    return NextResponse.json({ message: "Failed to verify transaction." }, { status: 500 });
  }
}

// Handle payment success confirmations (POST)
export async function POST(req: NextRequest) {
  try {
    const { bookingId, status } = await req.json();

    if (!bookingId || status !== "paid") {
      return NextResponse.json(
        { message: "Booking ID and paid status are required." },
        { status: 400 }
      );
    }

    const booking = await db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking reference not found." }, { status: 404 });
    }

    // Generate simulated payment receipt token
    const mockPaymentId = "ziina_sim_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Confirm booking in the database
    const success = await db.updateBookingStatus(bookingId, "paid", mockPaymentId);

    if (!success) {
      throw new Error("Failed to update ledger records.");
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully confirmed.",
      paymentId: mockPaymentId
    });

  } catch (error: any) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to confirm payment details." },
      { status: 500 }
    );
  }
}
