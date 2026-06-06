import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const expectedUser = process.env.ADMIN_USER || "admin";
    const expectedPass = process.env.ADMIN_PASS || "admin123";

    if (username === expectedUser && password === expectedPass) {
      // Create session cookie response
      const response = NextResponse.json({ success: true, message: "Authorized" });
      
      // Set HttpOnly cookie for security
      response.cookies.set({
        name: "admin_session",
        value: "authenticated_" + Date.now(),
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 24 Hours session
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });

      return response;
    }

    return NextResponse.json(
      { message: "Invalid administrator username or password." },
      { status: 401 }
    );

  } catch (error) {
    console.error("Admin Login API error:", error);
    return NextResponse.json(
      { message: "Server auth processing failed." },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Clear administrative cookie session (Log out)
  const response = NextResponse.json({ success: true, message: "Logged out" });
  
  response.cookies.set({
    name: "admin_session",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0 // Expire instantly
  });

  return response;
}
