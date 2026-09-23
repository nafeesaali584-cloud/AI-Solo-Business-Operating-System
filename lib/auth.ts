// ==============================================================================
// ClientPulse — Edge-Compatible Session Authentication Utility
// Uses standard Web Crypto API (HMAC-SHA256) compatible with Edge & Node.js runtimes.
// ==============================================================================

export const SESSION_COOKIE_NAME = "clientpulse_session";

export interface SessionPayload {
  email: string;
  exp: number; // Unix timestamp in seconds
  iat: number;
}

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fallback for dev only; production should always set SESSION_SECRET
    return "clientpulse-solo-business-os-secure-fallback-secret-2026";
  }
  return secret;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a signed JWT-style token: base64url(payload).base64url(signature)
 */
export async function createSessionToken(
  email: string,
  durationSeconds: number = 60 * 60 * 24 * 30 // default 30 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email,
    iat: now,
    exp: now + durationSeconds,
  };

  const payloadString = JSON.stringify(payload);
  const payloadEncoded = base64UrlEncode(encoder.encode(payloadString));

  const secret = getSecret();
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadEncoded)
  );
  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadEncoded}.${signatureEncoded}`;
}

/**
 * Verifies the token signature and expiration. Returns payload if valid, null if invalid/expired.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadEncoded, signatureEncoded] = parts;

  try {
    const secret = getSecret();
    const key = await getCryptoKey(secret);
    const signatureBytes = base64UrlDecode(signatureEncoded);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadEncoded) as unknown as BufferSource
    );

    if (!isValid) {
      return null;
    }

    const payloadBytes = base64UrlDecode(payloadEncoded);
    const payloadString = new TextDecoder().decode(payloadBytes);
    const payload: SessionPayload = JSON.parse(payloadString);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Expired session
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to get default admin credentials from environment
 */
export function getAdminCredentials(): { email: string; passwordHashOrPlain: string } {
  const email = process.env.ADMIN_EMAIL || "admin@clientpulse.io";
  const password = process.env.ADMIN_PASSWORD || "SoloAdmin2026!";
  return { email, passwordHashOrPlain: password };
}
