// Shared code for the portal, the admin page and the seed script (browser + Node 18+).
// How the lock works:
//   - Each person's profile is encrypted (AES-GCM) with its own random key.
//   - That key is wrapped once per accepted spelling of their riddle answer,
//     using a key derived from the answer (PBKDF2-SHA256).
//   - The portal finds the right entry by a SHA-256 hash of the answer, so the
//     site never stores names, answers or stats in readable form.
//   - The admin copy of everything is encrypted with the admin password.

export const STATS = ["Kindness", "Helpfulness", "Humor", "Teamwork", "Reliability", "Good vibes"];
export const TEAMS = {
  "IT": "#2f6fed",
  "Marketing": "#d63c84",
  "Ops": "#e07a12",
  "Tour Consult Agent": "#14946f",
  "RC": "#7350e6",
  "Tour Consultant Walk-in": "#0b8fa3",
  "HR": "#cc4232",
  "ACC": "#9a7412",
};
export const SIGN_OFF = "IT HENSEM";
const ITER = 150000;

const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = globalThis.crypto.subtle;

// "The Keyboard!" -> "keyboard", "wi-fi" -> "wifi"
export function norm(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the|your|my)\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}

// Accepted spellings for one answer: as given, plus simple singular/plural.
export function variants(answer, aliases = []) {
  const out = new Set();
  for (const raw of [answer, ...aliases]) {
    const a = norm(raw);
    if (!a) continue;
    out.add(a);
    if (a.length > 3) {
      if (a.endsWith("s")) out.add(a.slice(0, -1));
      else out.add(a + "s");
    }
  }
  return [...out];
}

export const ovr = (s) => Math.round(s.reduce((a, b) => a + b, 0) / s.length);
export const tierOf = (o) => (o >= 90 ? "Legend" : o >= 80 ? "All-Star" : o >= 70 ? "Starter" : "Rising Star");

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const rand = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

async function sha256hex(text) {
  const h = await subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function deriveKey(secret, salt, iter = ITER) {
  const base = await subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal(key, bytes) {
  const iv = rand(12);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { iv: b64(iv), ct: b64(ct) };
}
async function open(key, box) {
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.ct)));
}

// Public part of a person: what the stat page shows. Riddle and answer stay admin-only.
export function publicProfile(p) {
  return { name: p.name, team: p.team, role: p.role, move: p.move, why: p.why, media: p.media || "", s: p.s };
}

// Returns a list of problems; empty means OK.
export function validate(people) {
  const problems = [];
  const seen = new Map();
  people.forEach((p) => {
    if (!norm(p.answer)) problems.push(`${p.name} has no answer.`);
    for (const v of variants(p.answer, p.aliases)) {
      if (seen.has(v) && seen.get(v) !== p.name) problems.push(`${p.name} and ${seen.get(v)} share the answer "${v}".`);
      seen.set(v, p.name);
    }
  });
  return [...new Set(problems)];
}

// Build the whole data.json from the admin's list of people.
export async function buildData(people, adminPassword) {
  const problems = validate(people);
  if (problems.length) throw new Error(problems.join("\n"));
  const gsalt = b64(rand(16));
  const entries = {};
  const idx = {};
  for (const [n, p] of people.entries()) {
    const id = "e" + n;
    const dek = rand(32);
    const dekKey = await subtle.importKey("raw", dek, "AES-GCM", false, ["encrypt"]);
    entries[id] = await seal(dekKey, enc.encode(JSON.stringify(publicProfile(p))));
    for (const v of variants(p.answer, p.aliases)) {
      const salt = rand(16);
      const kek = await deriveKey(v, salt);
      const wrapped = await seal(kek, dek);
      idx[await sha256hex(gsalt + ":" + v)] = { id, salt: b64(salt), ...wrapped };
    }
  }
  const asalt = rand(16);
  const akey = await deriveKey(adminPassword, asalt);
  const admin = { salt: b64(asalt), ...(await seal(akey, enc.encode(JSON.stringify({ people })))) };
  return { v: 1, iter: ITER, gsalt, entries, idx, admin };
}

// Portal: answer -> profile, or null if no one has that answer.
export async function unlock(data, answer) {
  const v = norm(answer);
  if (!v) return null;
  const hit = data.idx[await sha256hex(data.gsalt + ":" + v)];
  if (!hit) return null;
  const kek = await deriveKey(v, unb64(hit.salt), data.iter);
  const dek = await open(kek, hit);
  const dekKey = await subtle.importKey("raw", dek, "AES-GCM", false, ["decrypt"]);
  return JSON.parse(dec.decode(await open(dekKey, data.entries[hit.id])));
}

// Admin: password -> { people }, throws if the password is wrong.
export async function adminOpen(data, password) {
  const key = await deriveKey(password, unb64(data.admin.salt), data.iter);
  return JSON.parse(dec.decode(await open(key, data.admin)));
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = (n) => String(n || "?").trim().slice(0, 2).toUpperCase();
const safeMedia = (m) => (/^(https:\/\/|data:image\/)/i.test(m || "") ? m : "");

// The player profile card, used by the portal and the admin preview.
export function profileHTML(p) {
  const o = ovr(p.s);
  const team = TEAMS[p.team] || "#2f6fed";
  const media = safeMedia(p.media);
  const stats = p.s.map((v, i) => {
    const on = Math.round(v / 10);
    const segs = Array.from({ length: 10 }, (_, k) => `<i class="${k < on ? "on" : ""}" style="--d:${k * 40}ms"></i>`).join("");
    return `<div class="stat"><span>${STATS[i]}</span><div class="segs">${segs}</div><b>${v}</b></div>`;
  }).join("");
  return `<article class="pf" style="--team:${team}" aria-label="${esc(p.name)}'s player profile">
    <div class="media">
      ${media ? `<img alt="A GIF picked for ${esc(p.name)}" src="${esc(media)}" referrerpolicy="no-referrer">` : `<div class="mono">${esc(initials(p.name))}</div>`}
      <div class="teamchip">${esc(p.team)}</div>
      <div class="ovr"><b>${o}</b><span>OVERALL</span></div>
    </div>
    <div class="pf-body">
      <div><div class="pname">${esc(p.name)}</div><div class="prole">${esc(p.role)}</div></div>
      <dl class="facts">
        <dt>Team</dt><dd>${esc(p.team)}</dd>
        <dt>Tier</dt><dd>${tierOf(o)}</dd>
        <dt>Signature move</dt><dd>${esc(p.move)}</dd>
      </dl>
      <div class="stats">${stats}</div>
      <div class="report"><div class="k">Scouting report</div><p>${esc(p.why)}</p></div>
      <div class="sign">— ${SIGN_OFF}</div>
    </div>
  </article>`;
}
