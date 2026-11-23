// SECURITY: verifies the Cloudflare Turnstile CAPTCHA token on the server.
// The browser can't fake this: Cloudflare checks the token with our secret key.

export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    // Network problem talking to Cloudflare. With Cloudflare's official
    // test keys (used in local development) we allow the token through.
    return secret.startsWith("1x0000") && token.length > 0;
  }
}
