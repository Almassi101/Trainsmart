/* ============================================================
   online.js — DELEN TUSSEN LAPTOP EN IPAD (Supabase)
   De app bewaart alles in de browser (localStorage, zie data.js).
   Dit bestand zet dezelfde gegevens ook in Supabase, zodat je op
   je laptop én je iPad dezelfde oefeningen en planning ziet.
   ============================================================ */

/* 1. Je Supabase-project -------------------------------------
   De URL vind je in Supabase → Project Settings → Data API.
   De publieke sleutel (sb_publishable_…) mag in de code staan:
   die is bedoeld voor de browser. De beveiliging zit in de
   RLS-regels van de tabel (zie supabase.sql).

   Is de URL nog niet ingevuld, dan werkt de app gewoon zoals
   voorheen: alles lokaal op dit apparaat. */
const ONLINE_URL = "https://okdaoboojynsiorvbfnw.supabase.co";
const ONLINE_KEY = "sb_publishable_15H1yiEcY_6dt0MF8WRmPw_KVTD2P1t";
const ONLINE_TABEL = "werkruimte";
const ONLINE_RIJ = "gedeeld";            // één gedeelde werkruimte

const onlineAan = ONLINE_URL.startsWith("https://") && !ONLINE_URL.includes("JOUW-PROJECT");   // false = nog geen project ingevuld
const db = onlineAan && window.supabase ? window.supabase.createClient(ONLINE_URL, ONLINE_KEY) : null;

/* 2. Het statuslampje bovenin -------------------------------- */
const standEl = document.getElementById("onlineStand");
function zetStand(tekst, soort, uitleg) {
  if (!standEl) return;
  standEl.textContent = tekst;
  standEl.className = "online-stand " + soort;
  standEl.title = uitleg || tekst;
}

/* 3. Ophalen: wat online staat, komt in de app ----------------
   Let op: een lege rij online betekent "nog niets gedeeld", niet
   "alles wissen". Anders zou je oefeningen op je laptop verdwijnen
   zodra je de app voor het eerst opent.                          */
const heeftInhoud = h => !!h && (
  (Array.isArray(h.oefeningen) && h.oefeningen.length > 0) ||
  (Array.isArray(h.archief) && h.archief.length > 0) ||
  (!!h.planning && Object.values(h.planning).some(l => Array.isArray(l) && l.length > 0))
);

let onlineOphalen = false;              // voorkomt dat we ons eigen opslaan teruglezen

async function haalOnlineOp(stil = false) {
  if (!db) {
    /* Geen URL ingevuld, of de Supabase-bibliotheek kon niet laden (internet) */
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
      /* Ook lokaal bewaren, zodat de app zonder internet verder kan */
      bewaar(LAGEN.oefeningen, oefeningen);
      bewaar(LAGEN.planning, planning);
      bewaar(LAGEN.archief, archief);
      renderPlanner(); renderBibliotheek(); renderArchief();
    } else {
      /* Nog niets online: zet wat er nu lokaal staat als eerste versie neer */
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

/* 4. Opslaan: elke wijziging gaat (met een korte pauze) naar Supabase */
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

/* 5. Start: ophalen, en opnieuw ophalen als je terugkomt in de app.
      Zo zie je op je iPad wat je op je laptop hebt gemaakt. --------- */
haalOnlineOp();
document.addEventListener("visibilitychange", () => { if (!document.hidden) haalOnlineOp(true); });
