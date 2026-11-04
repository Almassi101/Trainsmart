/* ============================================================
   data.js — STORAGE + HELPERS (the memory of the app)
   Everything is kept in the browser (localStorage), so nothing
   is lost when you close the app.
   ============================================================ */

/* The three "drawers" the app stores its data in */
const LAGEN = { oefeningen: "trainsmart_oefeningen", planning: "trainsmart_planning", archief: "trainsmart_archief" };

/* Equipment icons (US3) and the 4 player colours */
const MATERIAAL = { hoedje: "🟡", pion: "🔺", bal: "⚽", doel: "🥅", starthoedje: "🔶",
                    vlag: "🚩", hoepel: "⭕", ladder: "🪜", handschoen: "🧤",
                    schijf: "⚪", horde: "🚧", rebounder: "🔄", mikdoel: "🎯", keeperpop: "🧍" };
const KLEUREN = { rood: "#e5484d", blauw: "#3b82f6", geel: "#f5c542", groen: "#22c55e" };

/* Cones in more colours: that way you can tell two areas or two teams apart */
const PIONKLEUREN = { oranje: "#ff7a1a", rood: "#e5484d", blauw: "#3b82f6",
                      geel: "#f5c542", groen: "#22c55e", wit: "#f2f6fb" };

/* Read and save */
function laad(sleutel, standaard) {
  try { return JSON.parse(localStorage.getItem(sleutel)) ?? standaard; }
  catch { return standaard; }
}
function bewaar(sleutel, waarde) {
  localStorage.setItem(sleutel, JSON.stringify(waarde));
  /* Also send it to Supabase, so you see it on your iPad as well.
     That happens in online.js; without internet it stays local. */
  if (typeof bewaarOnline === "function") bewaarOnline();
}

/* The three lists the whole app works with */
let oefeningen = laad(LAGEN.oefeningen, []);
let planning   = laad(LAGEN.planning, {});
let archief    = laad(LAGEN.archief, []);

/* How a training is built up: every exercise on a day belongs to a phase */
const FASES = ["Warming-up", "Kern", "Partijvorm", "Afsluiting"];
const STANDAARD_DUUR = 15;                     // minutes, used when the field is left empty
const duurVan = oef => Number(oef.duur) > 0 ? Number(oef.duur) : STANDAARD_DUUR;

/* Convert old storage (a day used to be a list of ids only) into
   { id, fase }, so existing schedules keep working. */
planning = Object.fromEntries(Object.entries(planning).map(([dag, lijst]) => [
  dag,
  (Array.isArray(lijst) ? lijst : [])
    .filter(x => x !== null && x !== undefined)
    .map(x => typeof x === "object"
      ? { id: x.id, fase: FASES.includes(x.fase) ? x.fase : "Kern" }
      : { id: x, fase: "Kern" })
]));

/* Date as "2026-09-21" — that is the "key" of every day.
   Deliberately via getFullYear/getMonth/getDate (local time), so
   the day does not shift because of time zones. */
const fmtDate = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* The Monday of this week (or a week earlier/later) */
function maandagVan(week = 0) {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() + 6) % 7 + week * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* "🟡 ×2 ⚽ ×1" — the equipment icons of an exercise */
function materiaalIcoontjes(oef) {
  const tekst = Object.entries(oef.materiaal || {})
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${MATERIAAL[type] || "❓"} ×${n}`).join("  ");
  return tekst || "—";
}

/* Count which equipment is on the board */
function telMateriaal(items) {
  const telling = {};
  items.forEach(it => { if (MATERIAAL[it.type]) telling[it.type] = (telling[it.type] || 0) + 1; });
  return telling;
}

/* Is this a phone? (screen narrower than 520px)
   Yes → the app is VIEW ONLY: no drawing, no planning.
   No  → laptop/tablet: everything is allowed (also with a finger, see board.js).
   The matching styles live at the bottom of style.css under
   "Phone: view only".

   Note: an iPad can also be narrower than 520px, for example when Safari
   runs in Split View next to another app. That is why the "Design anyway"
   button lets the user switch the block off for this device; that choice
   is remembered. */
const KLEIN_SLEUTEL = "trainsmart_ontwerp_klein";
const ontwerpKleinAan = () => localStorage.getItem(KLEIN_SLEUTEL) === "ja";

const isTelefoon = () => matchMedia("(max-width: 520px)").matches && !ontwerpKleinAan();

/* Switch designing on/off on a narrow screen.
   The class on <body> makes the styles follow along (style.css). */
function zetOntwerpKlein(aan) {
  localStorage.setItem(KLEIN_SLEUTEL, aan ? "ja" : "nee");
  document.body.classList.toggle("ontwerp-klein", aan);
}
document.body.classList.toggle("ontwerp-klein", ontwerpKleinAan());
