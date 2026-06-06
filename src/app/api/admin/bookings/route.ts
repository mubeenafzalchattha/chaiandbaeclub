import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Authentication helper
function checkAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  return !!session && session.startsWith("authenticated_");
}

// Fetch bookings list (GET)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    let bookings = db.getBookings();
    
    if (eventId) {
      bookings = bookings.filter(b => b.eventId === eventId);
    }

    // Sort by creation date descending
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    return NextResponse.json({ message: "Failed to read bookings list." }, { status: 500 });
  }
}

// Manually update booking status (POST)
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const { bookingId, status } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json({ message: "Booking ID and status are required." }, { status: 400 });
    }

    if (!["pending", "paid", "failed"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking reference not found." }, { status: 404 });
    }

    const payId = status === "paid" ? "manual_override_" + Date.now() : undefined;
    const success = db.updateBookingStatus(bookingId, status, payId);

    if (!success) {
      throw new Error("Local database update failed.");
    }

    return NextResponse.json({
      success: true,
      message: `Booking manually updated to ${status}.`,
      booking: db.getBookingById(bookingId)
    });

  } catch (error: any) {
    console.error("Admin bookings update error:", error);
    return NextResponse.json({ message: error.message || "Failed to update booking status." }, { status: 500 });
  }
}

// Remove booking record (DELETE)
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID parameter is required." }, { status: 400 });
    }

    const success = db.deleteBooking(bookingId);
    if (!success) {
      return NextResponse.json({ message: "Unable to find and delete booking record." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Booking record successfully removed." });

  } catch (error) {
    console.error("Admin bookings delete error:", error);
    return NextResponse.json({ message: "Failed to delete booking records." }, { status: 500 });
  }
}
