/* ============================================================
   online.js — SHARING BETWEEN LAPTOP AND IPAD (Supabase)
   The app keeps everything in the browser (localStorage, see data.js).
   This file also puts the same data in Supabase, so you see the same
   exercises and schedule on your laptop and your iPad.
   ============================================================ */

/* 1. Your Supabase project -----------------------------------
   You find the URL in Supabase → Project Settings → Data API.
   The public key (sb_publishable_…) may sit in the code: it is
   meant for the browser. Security lives in the RLS rules of
   the table (see supabase.sql).

   If the URL is not filled in yet, the app simply works the way
   it did before: everything local on this device. */
const ONLINE_URL = "https://okdaoboojynsiorvbfnw.supabase.co";
const ONLINE_KEY = "sb_publishable_15H1yiEcY_6dt0MF8WRmPw_KVTD2P1t";
const ONLINE_TABEL = "werkruimte";
const ONLINE_RIJ = "gedeeld";            // one shared workspace

const onlineAan = ONLINE_URL.startsWith("https://") && !ONLINE_URL.includes("JOUW-PROJECT");   // false = no project filled in yet
const db = onlineAan && window.supabase ? window.supabase.createClient(ONLINE_URL, ONLINE_KEY) : null;

/* 2. The status light at the top ------------------------------ */
const standEl = document.getElementById("onlineStand");
function zetStand(tekst, soort, uitleg) {
  if (!standEl) return;
  standEl.textContent = tekst;
  standEl.className = "online-stand " + soort;
  standEl.title = uitleg || tekst;
}

/* 3. Fetching: whatever is online ends up in the app ----------
   Note: an empty row online means "nothing shared yet", not
   "delete everything". Otherwise your exercises on the laptop would
   vanish the first time you open the app.                        */
const heeftInhoud = h => !!h && (
  (Array.isArray(h.oefeningen) && h.oefeningen.length > 0) ||
  (Array.isArray(h.archief) && h.archief.length > 0) ||
  (!!h.planning && Object.values(h.planning).some(l => Array.isArray(l) && l.length > 0))
);

let onlineOphalen = false;              // stops us from reading back our own save

async function haalOnlineOp(stil = false) {
  if (!db) {
    /* No URL filled in, or the Supabase library could not load (internet) */
    onlineAan
      ? zetStand("⚠️ Offline", "fout", "Kon Supabase niet laden. De app werkt verder met wat lokaal staat.")
      : zetStand("💾 Alleen dit apparaat", "uit", "Vul de Supabase-URL in online.js in om te delen tussen apparaten.");
    return;
  }
  if (onlineOphalen) return;
  onlineOphalen = true;
  if (!stil) zetStand("☁️ Ophalen…", "bezig");

  try {
    const { data, error } = await db.from(ONLINE_TABEL).select("inhoud").eq("id", ONLINE_RIJ).maybeSingle();
    if (error) throw error;

    if (heeftInhoud(data?.inhoud)) {
      const { oefeningen: o, planning: p, archief: a } = data.inhoud;
      if (Array.isArray(o)) oefeningen = o;
      if (p && typeof p === "object") planning = p;
      if (Array.isArray(a)) archief = a;
      /* Save it locally too, so the app keeps working without internet */
      bewaar(LAGEN.oefeningen, oefeningen);
      bewaar(LAGEN.planning, planning);
      bewaar(LAGEN.archief, archief);
      renderPlanner(); renderBibliotheek(); renderArchief();
    } else {
      /* Nothing online yet: publish whatever is local now as the first version */
      onlineOphalen = false;
      await bewaarOnline();
      return;
    }
    zetStand("☁️ Online", "ok", "Je oefeningen staan in Supabase en zijn op elk apparaat hetzelfde.");
  } catch (fout) {
    console.warn("Ophalen uit Supabase mislukt:", fout);
    zetStand("⚠️ Offline", "fout", "Kon Supabase niet bereiken. De app werkt verder met wat lokaal staat.");
  } finally {
    onlineOphalen = false;
  }
}

/* 4. Saving: every change goes to Supabase (after a short pause) */
let onlineTimer = null;
let onlineBezig = false;

async function bewaarOnline() {
  if (!db || onlineOphalen) return;
  clearTimeout(onlineTimer);
  zetStand("☁️ Opslaan…", "bezig");
  onlineTimer = setTimeout(async () => {
    if (onlineBezig) return;
    onlineBezig = true;
    try {
      const { error } = await db.from(ONLINE_TABEL).upsert({
        id: ONLINE_RIJ,
        inhoud: { oefeningen, planning, archief },
        bijgewerkt: new Date().toISOString()
      });
      if (error) throw error;
      zetStand("☁️ Online", "ok", "Je oefeningen staan in Supabase en zijn op elk apparaat hetzelfde.");
    } catch (fout) {
      console.warn("Opslaan in Supabase mislukt:", fout);
      zetStand("⚠️ Niet opgeslagen", "fout", "De wijziging staat alleen nog op dit apparaat. Controleer je internet.");
    } finally {
      onlineBezig = false;
    }
  }, 700);
}

/* 5. Start: fetch, and fetch again when you come back to the app.
      That way your iPad shows what you made on your laptop. -------- */
haalOnlineOp();
document.addEventListener("visibilitychange", () => { if (!document.hidden) haalOnlineOp(true); });
