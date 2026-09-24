import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getAdminCredentials,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const admin = getAdminCredentials();

    const isEmailValid =
      email.trim().toLowerCase() === admin.email.trim().toLowerCase();
    const isPasswordValid = password === admin.passwordHashOrPlain;

    if (!isEmailValid || !isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // 30 days if rememberMe, otherwise 1 day
    const durationSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    const token = await createSessionToken(admin.email, durationSeconds);

    const isSecure = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
      user: {
        email: admin.email,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: durationSeconds,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal login error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
