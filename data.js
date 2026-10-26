/* ============================================================
   data.js — OPSLAG + HULPFUNCTIES (het geheugen van de app)
   Alles wordt bewaard in de browser (localStorage), dus niets
   gaat verloren als je de app sluit.
   ============================================================ */

/* De drie "lades" waarin de app bewaart */
const LAGEN = { oefeningen: "trainsmart_oefeningen", planning: "trainsmart_planning", archief: "trainsmart_archief" };

/* Materiaal-icoontjes (US3) en de 4 spelerkleuren */
const MATERIAAL = { hoedje: "🟡", pion: "🔺", bal: "⚽", doel: "🥅", starthoedje: "🔶",
                    vlag: "🚩", hoepel: "⭕", ladder: "🪜", handschoen: "🧤",
                    schijf: "⚪", horde: "🚧", rebounder: "🔄", mikdoel: "🎯", keeperpop: "🧍" };
const KLEUREN = { rood: "#e5484d", blauw: "#3b82f6", geel: "#f5c542", groen: "#22c55e" };

/* Pionnen in meer kleuren: zo onderscheid je bijvoorbeeld twee vakken of teams */
const PIONKLEUREN = { oranje: "#ff7a1a", rood: "#e5484d", blauw: "#3b82f6",
                      geel: "#f5c542", groen: "#22c55e", wit: "#f2f6fb" };

/* Uitlezen en opslaan */
function laad(sleutel, standaard) {
  try { return JSON.parse(localStorage.getItem(sleutel)) ?? standaard; }
  catch { return standaard; }
}
function bewaar(sleutel, waarde) { localStorage.setItem(sleutel, JSON.stringify(waarde)); }

/* De drie lijsten die de hele app gebruikt */
let oefeningen = laad(LAGEN.oefeningen, []);
let planning   = laad(LAGEN.planning, {});
let archief    = laad(LAGEN.archief, []);

/* De opbouw van een training: elke oefening op een dag hoort bij een fase */
const FASES = ["Warming-up", "Kern", "Partijvorm", "Afsluiting"];
const STANDAARD_DUUR = 15;                     // minuten, als je niets invult
const duurVan = oef => Number(oef.duur) > 0 ? Number(oef.duur) : STANDAARD_DUUR;

/* Oude opslag (een dag was een lijst met alleen id's) omzetten naar
   { id, fase }, zodat bestaande planningen gewoon blijven werken. */
planning = Object.fromEntries(Object.entries(planning).map(([dag, lijst]) => [
  dag,
  (Array.isArray(lijst) ? lijst : [])
    .filter(x => x !== null && x !== undefined)
    .map(x => typeof x === "object"
      ? { id: x.id, fase: FASES.includes(x.fase) ? x.fase : "Kern" }
      : { id: x, fase: "Kern" })
]));

/* Datum als "2026-09-21" — dat is de "sleutel" van elke dag.
   Bewust via getFullYear/getMonth/getDate (lokale tijd), zodat
   de dag niet verschuift door tijdzones. */
const fmtDate = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* De maandag van deze week (of een week eerder/later) */
function maandagVan(week = 0) {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() + 6) % 7 + week * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* "🟡 ×2 ⚽ ×1" — de materiaal-icoontjes van een oefening */
function materiaalIcoontjes(oef) {
  const tekst = Object.entries(oef.materiaal || {})
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${MATERIAAL[type] || "❓"} ×${n}`).join("  ");
  return tekst || "—";
}

/* Tellen welk materiaal er op het bord ligt */
function telMateriaal(items) {
  const telling = {};
  items.forEach(it => { if (MATERIAAL[it.type]) telling[it.type] = (telling[it.type] || 0) + 1; });
  return telling;
}

/* Is dit een telefoon? (scherm smaller dan 520px)
   Ja  → de app is ALLEEN BEKIJKEN: geen tekenen, geen plannen.
   Nee → laptop/tablet: alles mag (ook met een vinger, zie board.js).
   De bijbehorende opmaak staat onderin style.css bij
   "Telefoon: alleen bekijken". */
const isTelefoon = () => matchMedia("(max-width: 520px)").matches;
