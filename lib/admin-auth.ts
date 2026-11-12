import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "thseasons_admin";
const LIFETIME = 8 * 60 * 60;

export function adminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32 && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(process.env.ADMIN_PASSWORD_HASH ?? ""));
}

function signature(payload: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).update(process.env.ADMIN_PASSWORD_HASH!).digest("hex");
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 1024) return false;
  try {
    const [payload, signed, extra] = token.split(".");
    if (extra || !payload || !signed || !/^[a-f0-9]{64}$/.test(signed)) return false;
    if (!timingSafeEqual(Buffer.from(signed, "hex"), Buffer.from(signature(payload), "hex"))) return false;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return session.user === process.env.ADMIN_USERNAME && typeof session.exp === "number" && session.exp > Date.now();
  } catch { return false; }
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// A single local administrator: bound in-memory throttling for this test deployment.
const attempts = { failures: 0, resetAt: 0 };
export async function verifyAdmin(username: string, password: string) {
  if (!adminConfigured()) return "unconfigured";
  if (Date.now() >= attempts.resetAt) { attempts.failures = 0; attempts.resetAt = Date.now() + 5 * 60 * 1000; }
  if (attempts.failures >= 10) return "throttled";
  if (username.length > 100 || !password || password.length > 256) { attempts.failures++; return "invalid"; }
  const [salt, hash] = process.env.ADMIN_PASSWORD_HASH!.split(":");
  const actual = await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key)));
  const usernameMatches = timingSafeEqual(createHash("sha256").update(username).digest(), createHash("sha256").update(process.env.ADMIN_USERNAME!).digest());
  if (!timingSafeEqual(actual, Buffer.from(hash, "hex")) || !usernameMatches) { attempts.failures++; return "invalid"; }
  attempts.failures = 0;
  return "valid";
}

export async function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ user: process.env.ADMIN_USERNAME, exp: Date.now() + LIFETIME * 1000, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${signature(payload)}`, {
    httpOnly: true, sameSite: "strict", secure: process.env.ADMIN_COOKIE_SECURE !== "false", path: "/admin", maxAge: LIFETIME,
  });
}

export async function clearAdminSession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.ADMIN_COOKIE_SECURE !== "false", path: "/admin", maxAge: 0 });
}
