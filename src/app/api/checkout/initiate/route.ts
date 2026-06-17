import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBookingId, validateUaePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { eventId, name, email, whatsapp } = await req.json();

    // 1. Basic field validation
    if (!eventId || !name || !email || !whatsapp) {
      return NextResponse.json(
        { message: "All form fields are required." },
        { status: 400 }
      );
    }

    // 2. Validate UAE Phone format (+971 5X-XXX-XXXX)
    if (!validateUaePhone(whatsapp)) {
      return NextResponse.json(
        { message: "A valid UAE WhatsApp mobile number is required (+971 5X-XXX-XXXX)." },
        { status: 400 }
      );
    }

    // 3. Fetch event details
    const event = await db.getEventById(eventId);
    if (!event || event.status !== "active") {
      return NextResponse.json(
        { message: "Selected event is not active or does not exist." },
        { status: 404 }
      );
    }

    // 4. Validate event status (expired vs capacity limit)
    const isDeadlinePassed = new Date(event.deadline).getTime() < Date.now();
    if (isDeadlinePassed) {
      return NextResponse.json(
        { message: "We apologize, but booking for this event has closed." },
        { status: 400 }
      );
    }

    const bookings = await db.getBookingsByEventId(eventId);
    const paidCount = bookings.filter((b) => b.status === "paid").length;
    if (paidCount >= event.maxSlots) {
      return NextResponse.json(
        { message: "This event is fully booked." },
        { status: 400 }
      );
    }

    // 5. Generate secure booking ID
    const bookingId = generateBookingId();

    // 6. Record pending booking in the JSON DB
    const success = await db.createBooking({
      id: bookingId,
      eventId,
      name,
      email,
      whatsapp,
      status: "pending",
      createdAt: new Date().toISOString(),
      amount: event.price
    });

    if (!success) {
      throw new Error("Unable to save pending transaction.");
    }

    let redirectUrl = "";

    if (!process.env.ZIINA_API_KEY) {
      return NextResponse.json(
        { message: "Configuration Error: ZIINA_API_KEY environment variable is missing." },
        { status: 500 }
      );
    }

    // Call live Ziina payment gateway API
    const ziinaResponse = await fetch("https://api-v2.ziina.com/api/payment_intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ZIINA_API_KEY}`
      },
      body: JSON.stringify({
        amount: event.price * 100,
        currency_code: "AED",
        message: `Chai & Bae Club: ${event.title} (${bookingId})`,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/checkout/confirm?bookingId=${bookingId}&status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/${eventId}?error=cancelled`,
        failure_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/${eventId}?error=failed`,
        test: false,
        allow_tips: false
      })
    });

    const ziinaData = await ziinaResponse.json();

    if (ziinaResponse.ok && ziinaData.redirect_url) {
      redirectUrl = ziinaData.redirect_url;
    } else {
      console.error("Ziina API payment intent creation failed:", ziinaData);
      return NextResponse.json(
        {
          message: `Ziina API Error (${ziinaResponse.status}): ${ziinaData.message || JSON.stringify(ziinaData)}`
        },
        { status: ziinaResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId,
      redirectUrl
    });

  } catch (error: any) {
    console.error("Checkout initiation server error:", error);
    return NextResponse.json(
      { message: "Unable to process payment booking. Please try again." },
      { status: 500 }
    );
  }
}
