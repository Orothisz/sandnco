import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 1. Target the 'logo.png' file sitting in your project ROOT
    // process.cwd() gets the main folder where package.json lives
    const filePath = path.join(process.cwd(), 'logo.png');

    // 2. Read the file from the disk
    const fileBuffer = fs.readFileSync(filePath);

    // 3. Serve it as a proper image response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        // Optional: Cache it so it loads fast next time
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Error serving logo:", error);
    return new NextResponse('Logo not found in root directory', { status: 404 });
  }
}
