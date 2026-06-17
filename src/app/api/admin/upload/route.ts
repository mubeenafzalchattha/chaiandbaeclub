// import { NextRequest, NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";

// // Helper to check authentication
// function checkAuth(req: NextRequest): boolean {
//   const session = req.cookies.get("admin_session")?.value;
//   return !!session && session.startsWith("authenticated_");
// }

// export async function POST(req: NextRequest) {
//   if (!checkAuth(req)) {
//     return NextResponse.json({ message: "Unauthorized access." }, { status: 401 });
//   }

//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ message: "No file was uploaded." }, { status: 400 });
//     }

//     // Convert file to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // Build storage path under public/uploads
//     const uploadDir = path.join(process.cwd(), "public", "uploads");
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     // Sanitize and generate unique filename
//     const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
//     const filename = `${Date.now()}-${safeName}`;
//     const filePath = path.join(uploadDir, filename);

//     // Save file
//     fs.writeFileSync(filePath, buffer);

//     // Return the local static asset URL path
//     return NextResponse.json({
//       success: true,
//       url: `/uploads/${filename}`
//     });

//   } catch (error: any) {
//     console.error("Image upload server error:", error);
//     return NextResponse.json(
//       { message: error.message || "Failed to upload image." },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Helper to check authentication
function checkAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  return !!session && session.startsWith("authenticated_");
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json(
      { message: "Unauthorized access." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file was uploaded." },
        { status: 400 }
      );
    }

    // Sanitize and generate unique filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;

    // Upload directly to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });

  } catch (error: any) {
    console.error("Image upload server error:", error);

    return NextResponse.json(
      {
        message: error.message || "Failed to upload image.",
      },
      { status: 500 }
    );
  }
}
