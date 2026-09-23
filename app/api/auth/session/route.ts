import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
    },
  });
}
