// GenRPM — Login (Netlify Edge Function)
// Melindungi seluruh situs dan layanan AI dengan login.
//
// Atur di Netlify → Project configuration → Environment variables:
//   GENRPM_USERS = nama:katasandi            (wajib untuk mengaktifkan login)
//                  beberapa pengguna dipisah koma, mis. "weda:Rahasia123,bu_sari:Guru2026"
//   AUTH_SECRET  = teks acak panjang          (opsional; bila diganti, semua orang harus login ulang)
// Jika GENRPM_USERS kosong, situs terbuka tanpa login.

const COOKIE = "genrpm_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari
const enc = new TextEncoder();

const PUBLIC_PATHS = ["/login.html", "/api/login", "/api/logout", "/favicon.ico"];
const PUBLIC_PREFIX = ["/assets/", "/css/"];

function b64url(bytes) {
  let s = "";
  new Uint8Array(bytes).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

function getUsers() {
  const raw = (Netlify.env.get("GENRPM_USERS") || "").trim();
  const users = new Map();
  raw.split(/[,\n;]+/).forEach((pair) => {
    const i = pair.indexOf(":");
    if (i > 0) users.set(pair.slice(0, i).trim().toLowerCase(), pair.slice(i + 1).trim());
  });
  return { users, raw };
}

async function hmacKey(raw) {
  const secret = Netlify.env.get("AUTH_SECRET") || "genrpm::" + raw;
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function makeToken(user, raw) {
  const payload = b64url(enc.encode(JSON.stringify({ u: user, exp: Math.floor(Date.now() / 1000) + MAX_AGE })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(raw), enc.encode(payload));
  return payload + "." + b64url(sig);
}

async function readToken(token, raw, users) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  let ok = false;
  try { ok = await crypto.subtle.verify("HMAC", await hmacKey(raw), fromB64url(sig), enc.encode(payload)); } catch { return null; }
  if (!ok) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (!data.u || !users.has(data.u) || data.exp < Date.now() / 1000) return null;
    return data.u;
  } catch { return null; }
}

function getCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// Perbandingan kata sandi dengan waktu konstan (lewat HMAC)
async function sameText(a, b) {
  const k = await crypto.subtle.importKey("raw", enc.encode("cmp"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const [x, y] = await Promise.all([crypto.subtle.sign("HMAC", k, enc.encode(a)), crypto.subtle.sign("HMAC", k, enc.encode(b))]);
  const ax = new Uint8Array(x), ay = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ ay[i];
  return diff === 0;
}

const redirect = (to, cookies = []) => {
  const h = new Headers({ Location: to, "Cache-Control": "no-store" });
  cookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(null, { status: 303, headers: h });
};
const sessionCookie = (val, age) => `${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const userCookie = (val, age) => `genrpm_user=${encodeURIComponent(val)}; Path=/; Secure; SameSite=Lax; Max-Age=${age}`;
const safeNext = (n) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const { users, raw } = getUsers();

  // Login belum diaktifkan → situs terbuka
  if (!users.size) {
    if (path === "/login.html" || path === "/api/login") return redirect("/");
    return context.next();
  }

  // Proses login
  if (path === "/api/login" && req.method === "POST") {
    const form = await req.formData();
    const name = String(form.get("username") || "").trim().toLowerCase();
    const pass = String(form.get("password") || "");
    const next = safeNext(String(form.get("next") || "/"));
    const expected = users.get(name);
    if (expected !== undefined && (await sameText(pass, expected))) {
      const token = await makeToken(name, raw);
      return redirect(next, [sessionCookie(token, MAX_AGE), userCookie(name, MAX_AGE)]);
    }
    await new Promise((r) => setTimeout(r, 800)); // memperlambat tebakan kata sandi
    return redirect("/login.html?e=1&next=" + encodeURIComponent(next));
  }

  // Keluar
  if (path === "/api/logout") return redirect("/login.html?out=1", [sessionCookie("", 0), userCookie("", 0)]);

  // Halaman/berkas publik
  if (PUBLIC_PATHS.includes(path) || PUBLIC_PREFIX.some((p) => path.startsWith(p))) {
    // Sudah login tapi membuka halaman login → langsung ke aplikasi
    if (path === "/login.html" && (await readToken(getCookie(req, COOKIE), raw, users))) return redirect("/");
    return context.next();
  }

  // Semua halaman lain wajib login
  const user = await readToken(getCookie(req, COOKIE), raw, users);
  if (user) return context.next();

  if (path.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "login", message: "Sesi login habis. Muat ulang halaman lalu login kembali." }), {
      status: 401, headers: { "content-type": "application/json" }
    });
  }
  return redirect("/login.html?next=" + encodeURIComponent(path + url.search));
};
