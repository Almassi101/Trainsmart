/* ============================================================
   board.js — HET TACTIEKBORD (US2 + US3)
   Klik links een tool → klik (of sleep) op het veld.
   Met "Selecteer" versleep je dingen, "Ongedaan" gaat een
   stap terug. Alles ligt in de lijst `bord`.

   Werkt met een muis én met een vinger (pointer-events + touch
   action), zodat je ook op een tablet een training kunt maken.
   ============================================================ */

const PITCH = document.getElementById("pitch");
const ITEMS = document.getElementById("items");

/* Kleuren van de lijnen, pijlen en bogen */
const LIJNEN  = { dribbel: "#f5c542", schot: "#ffffff", loop: "#7ef0b2", pijl: "#ffa94d", boog: "#7ef0b2" };
const STIPPEL = { dribbel: true, loop: true };      // deze twee zijn gestippeld

let tool = "select";       // welke tool actief is
let pionKleur = "oranje";  // de kleur die de volgende pion krijgt
let bord = [];             // alles wat op het veld staat
let greep = null;          // wat er nu vastgepakt is
const geschiedenis = [];   // geheugen voor "Ongedaan"

/* Is dit een lijn, pijl of boog? */
const isLijn = it => !!LIJNEN[it.type];

/* Opname vóór een verandering → undo kan terug */
const snapshot = () => geschiedenis.push(JSON.stringify(bord));

/* Muis-/vingerpositie omrekenen naar % van het veld */
function muisPos(e) {
  const r = PITCH.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100, r };
}

/* Waar komt het label (cijfer/tekst) van een pijl of lijn?
   Het midden van de streep, bij een boog iets boven de boog. */
function labelPos(it) {
  const r = PITCH.getBoundingClientRect();
  const aspect = r.width / r.height;                 // % in de breedte is breder dan % in de hoogte
  const rad = it.a * Math.PI / 180;
  if (it.type === "boog") {
    return { x: it.x + Math.cos(rad) * it.l / 2 + Math.sin(rad) * it.h * 0.62 / aspect,
             y: it.y + Math.sin(rad) * it.l / 2 * aspect - Math.cos(rad) * it.h * 0.62 };
  }
  /* Label zweeft boven de lijn in plaats van er middenin, zodat de pijl
     één doorlopende streep blijft. De richting draait mee met de lijn. */
  const afstand = 15 + Math.abs(Math.sin(rad)) * 22;   // bij een steile lijn iets verder opzij
  const kant = Math.cos(rad) >= 0 ? 1 : -1;            // altijd aan de bovenkant
  return { x: it.x + Math.cos(rad) * it.l / 2 + kant * Math.sin(rad) * afstand / r.width * 100,
           y: it.y + Math.sin(rad) * it.l / 2 * aspect - kant * Math.cos(rad) * afstand / r.height * 100 };
}

/* Eén item op het bord tekenen (speler, materiaal, lijn, pijl, boog of zone) */
function maakElement(it, i) {
  const el = document.createElement("div");
  el.className = "item " + it.type;
  el.dataset.index = i;                              // zo weten we welk item je aanraakt
  el.style.left = it.x + "%";
  el.style.top = it.y + "%";

  if (it.type === "speler") {                        // speler = gekleurd cirkeltje met rugnummer
    el.textContent = it.nr;
    el.style.background = KLEUREN[it.kleur];
  } else if (it.type === "pion") {                   // pion = kegeltje in de gekozen kleur
    el.style.setProperty("--kleur", PIONKLEUREN[it.kleur] || PIONKLEUREN.oranje);
  } else if (MATERIAAL[it.type]) {                   // materiaal = icoontje
    el.textContent = MATERIAAL[it.type];
  } else if (it.type === "boog") {                   // boog = kromme lijn met pijlpunt
    el.style.width = it.l + "%";
    el.style.height = it.h + "%";
    el.style.transform = `translate(0, -100%) rotate(${it.a}deg)`;
    el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 98 Q50 2 98 98" fill="none" stroke="${LIJNEN.boog}" stroke-width="4"
        stroke-dasharray="9 7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  } else if (isLijn(it)) {                           // lijn/pijl = streep met lengte + hoek
    el.classList.add("lijn");
    el.style.width = it.l + "%";
    el.style.transform = `rotate(${it.a}deg)`;
    if (it.type === "pijl") {                        // pijl krijgt een pijlpunt (zie style.css)
      el.style.setProperty("--kleur", LIJNEN.pijl);
    } else {
      el.style.background = STIPPEL[it.type]
        ? `repeating-linear-gradient(90deg, ${LIJNEN[it.type]} 0 7px, transparent 7px 13px)`
        : LIJNEN[it.type];
    }
  } else {                                           // zone = rechthoek
    el.style.width = it.b + "%";
    el.style.height = it.h + "%";
  }

  /* Greepje aan het eind: daarmee maak je een lijn/boog/zone langer of kleiner.
     Zichtbaar zodra je "Selecteer" kiest (zie style.css). */
  if (isLijn(it) || it.type === "zone") {
    const g = document.createElement("span");
    g.className = "greep";
    el.appendChild(g);
  }
  return el;
}

/* Het cijfer of de tekst bij een pijl/lijn/boog (los element, zodat het recht blijft) */
function maakLabel(it, i) {
  if (!it.label || !isLijn(it)) return null;
  const pos = labelPos(it);
  const el = document.createElement("div");
  el.className = "item bordlabel";
  el.dataset.index = i;
  el.style.left = pos.x + "%";
  el.style.top = pos.y + "%";
  el.textContent = it.label;
  return el;
}

/* Het hele veld opnieuw tekenen vanuit de data */
function renderBord() {
  const nodes = [];
  bord.forEach((it, i) => {
    nodes.push(maakElement(it, i));
    const label = maakLabel(it, i);
    if (label) nodes.push(label);
  });
  ITEMS.replaceChildren(...nodes);
}
function leegBord() { bord = []; renderBord(); }

/* Cijfer of tekst bij een pijl/lijn/boog zetten.
   Geen browser-popup, maar een klein invoerveldje op het veld zelf:
   typen en Enter (of ergens anders klikken) = bewaren, Esc = annuleren. */
let bewaarLabel = null;      // sluit het openstaande tekstveld netjes af

function vraagLabel(it) {
  document.querySelector(".labeledit")?.remove();
  const pos = labelPos(it);

  const veld = document.createElement("input");
  veld.className = "labeledit";
  veld.type = "text";
  veld.maxLength = 20;
  veld.placeholder = "1, 2, kaats…";
  veld.value = it.label || "";
  veld.style.left = pos.x + "%";
  veld.style.top = pos.y + "%";
  PITCH.appendChild(veld);
  veld.focus();
  veld.select();

  const sluit = bewaren => {
    if (!veld.isConnected) return;
    if (bewaren) {
      snapshot();
      it.label = veld.value.trim().slice(0, 20);
      renderBord();
    }
    veld.remove();
    bewaarLabel = null;
  };
  bewaarLabel = () => sluit(true);

  veld.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); sluit(true); }
    if (e.key === "Escape") { e.preventDefault(); sluit(false); }
  });
  veld.addEventListener("blur", () => sluit(true));
}

/* Starten: vinger of muis indrukken op het veld */
PITCH.addEventListener("pointerdown", e => {
  if (isTelefoon()) return;                          // telefoon = alleen bekijken
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.target.closest(".labeledit")) return;         // je bent een cijfer/tekst aan het typen
  if (bewaarLabel) { bewaarLabel(); return; }         // eerst het open tekstveld netjes afsluiten
  e.preventDefault();                                // geen tekst selecteren / pagina schuiven
  const p = muisPos(e);
  const raak = e.target.closest(".item");
  const bestaand = raak ? bord[+raak.dataset.index] : null;

  if (tool === "select") {                           // ── iets vastpakken
    if (!bestaand) return;
    const viaGreep = !!e.target.closest(".greep");   // aan het greepje = rekken, anders verplaatsen
    greep = {
      it: bestaand, start: { x: bestaand.x, y: bestaand.y }, bestaand: true,
      soort: !viaGreep ? "sleep"
        : bestaand.type === "zone" ? "zone"
        : bestaand.type === "boog" ? "boog" : "lijn",
      verschil: { dx: bestaand.x - p.x, dy: bestaand.y - p.y }   // niet verspringen bij het vastpakken
    };
    return;
  }

  if (tool === "erase") {                            // ── één ding weghalen
    if (!bestaand) return;
    snapshot();
    bord = bord.filter(x => x !== bestaand);
    renderBord();
    return;
  }

  if (tool === "label") {                            // ── cijfer/tekst bij een pijl
    if (!bestaand || !isLijn(bestaand))
      return alert("Klik op een pijl, lijn of boog om er een cijfer of tekst bij te zetten.");
    vraagLabel(bestaand);
    return;
  }

  if (tool === "pion" && bestaand?.type === "pion") { // ── bestaande pion een andere kleur geven
    snapshot();
    bestaand.kleur = pionKleur;
    renderBord();
    return;
  }

  /* ── iets nieuws plaatsen (mag óp een bestaand item) */
  snapshot();
  let nieuw;
  if (tool.startsWith("speler-")) {                  // rugnummer per kleur: 1, 2, 3…
    const kleur = tool.slice(7);
    const nrs = bord.filter(i => i.type === "speler" && i.kleur === kleur).map(i => i.nr);
    nieuw = { type: "speler", kleur, nr: nrs.length ? Math.max(...nrs) + 1 : 1, x: p.x, y: p.y };
  } else if (tool === "boog") {                      // klik = boogje, slepen = grotere boog
    nieuw = { type: "boog", x: p.x, y: p.y, l: 12, a: 0, h: 10 };
  } else if (isLijn({ type: tool })) {               // klik = korte lijn, slepen = uitrollen
    nieuw = { type: tool, x: p.x, y: p.y, l: 12, a: 0 };
  } else if (tool === "zone") {
    nieuw = { type: "zone", x: p.x, y: p.y, b: 15, h: 12 };
  } else if (tool === "pion") {                      // pion onthoudt zijn kleur
    nieuw = { type: "pion", kleur: pionKleur, x: p.x, y: p.y };
  } else {
    nieuw = { type: tool, x: p.x, y: p.y };
  }

  bord.push(nieuw);
  greep = { it: nieuw, start: { x: p.x, y: p.y },
            soort: nieuw.type === "zone" ? "zone" : nieuw.type === "boog" ? "boog" : isLijn(nieuw) ? "lijn" : "sleep" };
  renderBord();
});

/* Slepen: speler verplaatsen, lijn/pijl uitrollen, boog groter maken of zone op maat trekken */
window.addEventListener("pointermove", e => {
  if (!greep) return;
  if (e.cancelable) e.preventDefault();
  if (!greep.verplaatst) {                           // eerste beweging = één undo-stap
    greep.verplaatst = true;
    if (greep.bestaand) snapshot();
  }
  const p = muisPos(e);

  if (greep.soort === "sleep") {
    const v = greep.verschil || { dx: 0, dy: 0 };
    greep.it.x = Math.min(100, Math.max(0, p.x + v.dx));
    greep.it.y = Math.min(100, Math.max(0, p.y + v.dy));
  } else if (greep.soort === "lijn") {               // lengte + hoek uit het verschil
    const dx = (p.x - greep.start.x) * p.r.width / 100;
    const dy = (p.y - greep.start.y) * p.r.height / 100;
    greep.it.l = Math.max(1, Math.hypot(dx, dy) / p.r.width * 100);
    greep.it.a = Math.atan2(dy, dx) * 180 / Math.PI;
  } else if (greep.soort === "boog") {               // boog: hoe langer, hoe ronder
    const dx = (p.x - greep.start.x) * p.r.width / 100;
    const dy = (p.y - greep.start.y) * p.r.height / 100;
    const lengte = Math.max(1, Math.hypot(dx, dy) / p.r.width * 100);
    greep.it.l = lengte;
    greep.it.a = Math.atan2(dy, dx) * 180 / Math.PI;
    greep.it.h = Math.min(55, Math.max(6, lengte * 0.7));
  } else {                                           // zone: breedte × hoogte
    greep.it.b = Math.max(1, p.x - greep.start.x);
    greep.it.h = Math.max(1, p.y - greep.start.y);
  }
  renderBord();
});

const stopGreep = () => (greep = null);
window.addEventListener("pointerup", stopGreep);
window.addEventListener("pointercancel", stopGreep);

/* Alle bordknoppen in één keer koppelen (data-tool="speler-rood", "undo", …) */
document.querySelectorAll("[data-tool]").forEach(knop => knop.addEventListener("click", () => {
  const t = knop.dataset.tool;
  if (t === "undo" && geschiedenis.length) bord = JSON.parse(geschiedenis.pop());
  else if (t === "leeg" && bord.length) { snapshot(); leegBord(); }
  else tool = t;
  PITCH.dataset.tool = tool;              // zo weet de opmaak of het greepje zichtbaar moet zijn
  document.querySelectorAll("[data-tool]").forEach(k => k.classList.toggle("active", k === knop && t !== "undo" && t !== "leeg"));
  renderBord();
}));

/* 🎨 Kleur van de pion kiezen (de stippen onder de pion-knop) */
const stippen = [...document.querySelectorAll("[data-pionkleur]")];
stippen.forEach(stip => stip.addEventListener("click", () => {
  pionKleur = stip.dataset.pionkleur;
  stippen.forEach(s => s.classList.toggle("active", s === stip));
  tool = "pion";   // meteen klaar om te plaatsen
  PITCH.dataset.tool = tool;
  document.querySelectorAll("[data-tool]").forEach(k => k.classList.toggle("active", k.dataset.tool === "pion"));
}));

/* 🔍 Zoeken in het gereedschap: typ je "pijl", dan blijven alleen de
   pijl-knoppen over. Materiaal klapt dan vanzelf open. */
const zoekTool = document.getElementById("zoekTool");
const geenTool = document.getElementById("geenTool");
const groepen = [...document.querySelectorAll(".bordwrap .toolgroup")];
const zelfOpengezet = new Set();

zoekTool.addEventListener("input", () => {
  const q = zoekTool.value.toLowerCase().trim();

  zelfOpengezet.forEach(g => (g.open = false));           // vorige zoekactie weer dicht
  zelfOpengezet.clear();

  groepen.forEach(g => {
    const knoppen = [...g.querySelectorAll(".tool")];
    knoppen.forEach(b => (b.hidden = !!q && !b.textContent.toLowerCase().includes(q)));
    const gevonden = knoppen.some(b => !b.hidden);
    g.hidden = !!q && !gevonden;
    if (q && gevonden && g.tagName === "DETAILS" && !g.open) {
      g.open = true;
      zelfOpengezet.add(g);
    }
  });

  geenTool.hidden = groepen.some(g => !g.hidden);
});

PITCH.dataset.tool = tool;
renderBord();
