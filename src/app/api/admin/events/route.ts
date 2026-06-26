import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Authentication helper
function checkAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  return !!session && session.startsWith("authenticated_");
}

// Read events list (GET)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const events = await db.getEvents();
    // Sort: active first, then by date descending
    const sorted = [...events].sort((a, b) => {
      if (a.status === "active") return -1;
      if (b.status === "active") return 1;
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    });
    return NextResponse.json({ success: true, events: sorted });
  } catch (error) {
    return NextResponse.json({ message: "Failed to read events list." }, { status: 500 });
  }
}

// Create or update event (POST)
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, description, date, time, location, price, deadline, maxSlots, image, status, instagramUrl, include, exclude } = body;

    if (!title || !description || !date || !time || !location || price === undefined || !deadline || !maxSlots || !image) {
      return NextResponse.json({ message: "All required event parameters are required." }, { status: 400 });
    }

    const eventId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const eventObj = {
      id: eventId,
      title,
      description,
      date,
      time,
      location,
      price: Number(price),
      deadline: new Date(deadline).toISOString(),
      maxSlots: Number(maxSlots),
      image,
      status: status || "active",
      instagramUrl: instagramUrl?.trim() || undefined,
      include: include || [],
      exclude: exclude || []
    };

    // createdAt is stamped via $setOnInsert in db.createEvent (only on first insert)
    const success = await db.createEvent(eventObj);

    if (!success) {
      throw new Error("Local MongoDB database save failed.");
    }

    return NextResponse.json({
      success: true,
      message: "Event saved successfully.",
      event: eventObj
    });

  } catch (error: any) {
    console.error("Admin event save error:", error);
    return NextResponse.json({ message: error.message || "Failed to save event details." }, { status: 500 });
  }
}

// Delete event (DELETE)
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ message: "Event ID parameter is required." }, { status: 400 });
    }

    const success = await db.deleteEvent(eventId);
    if (!success) {
      return NextResponse.json({ message: "Unable to delete event from database." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Event and associated bookings successfully removed." });

  } catch (error) {
    console.error("Admin event delete error:", error);
    return NextResponse.json({ message: "Failed to delete event records." }, { status: 500 });
  }
}
