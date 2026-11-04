/* ============================================================
   board.js — THE TACTICS BOARD (US2 + US3)
   Pick a tool on the left → click (or drag) on the pitch.
   "Selecteer" lets you move things, "Ongedaan" goes one
   step back. Everything lives in the `bord` list.

   Works with a mouse and with a finger (pointer-events + touch
   action), so you can build a training on a tablet as well.
   ============================================================ */

const PITCH = document.getElementById("pitch");
const ITEMS = document.getElementById("items");

/* Colours of the lines, arrows and arcs */
const LIJNEN  = { dribbel: "#f5c542", schot: "#ffffff", loop: "#7ef0b2", pijl: "#ffa94d", boog: "#7ef0b2" };
const STIPPEL = { dribbel: true, loop: true };      // these two are dashed

let tool = "select";       // which tool is active
let pionKleur = "oranje";  // the colour the next cone gets
let bord = [];             // everything that is on the pitch
let bordBasis = "[]";      // how the board looked when it was empty or saved
let greep = null;          // what is being held right now
const geschiedenis = [];   // history for "Ongedaan" (undo)

/* Is there anything drawn that is not in the library yet? A board is only
   saved when you press “💾 Opslaan in bibliotheek” (bord-io.js). */
const bordVuil = () => JSON.stringify(bord) !== bordBasis;

/* Is this a line, arrow or arc? */
const isLijn = it => !!LIJNEN[it.type];

/* Snapshot before a change → undo can go back */
const snapshot = () => geschiedenis.push(JSON.stringify(bord));

/* Convert a mouse/finger position into a % of the pitch */
function muisPos(e) {
  const r = PITCH.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100, r };
}

/* Where does the label (number/text) of an arrow or line go?
   The middle of the stroke, and slightly above the arc for an arc. */
function labelPos(it) {
  const r = PITCH.getBoundingClientRect();
  const aspect = r.width / r.height;                 // % across is wider than % down
  const rad = it.a * Math.PI / 180;
  if (it.type === "boog") {
    return { x: it.x + Math.cos(rad) * it.l / 2 + Math.sin(rad) * it.h * 0.62 / aspect,
             y: it.y + Math.sin(rad) * it.l / 2 * aspect - Math.cos(rad) * it.h * 0.62 };
  }
  /* The label floats above the line instead of sitting inside it, so the arrow
     stays one continuous stroke. It turns along with the line. */
  const afstand = 15 + Math.abs(Math.sin(rad)) * 22;   // a bit further aside on a steep line
  const kant = Math.cos(rad) >= 0 ? 1 : -1;            // always on the upper side
  return { x: it.x + Math.cos(rad) * it.l / 2 + kant * Math.sin(rad) * afstand / r.width * 100,
           y: it.y + Math.sin(rad) * it.l / 2 * aspect - kant * Math.cos(rad) * afstand / r.height * 100 };
}

/* Draw one item on the board (player, equipment, line, arrow, arc or zone) */
function maakElement(it, i) {
  const el = document.createElement("div");
  el.className = "item " + it.type;
  el.dataset.index = i;                              // this tells us which item you touch
  el.style.left = it.x + "%";
  el.style.top = it.y + "%";

  if (it.type === "speler") {                        // player = coloured dot with a shirt number
    el.textContent = it.nr;
    el.style.background = KLEUREN[it.kleur];
  } else if (it.type === "pion") {                   // cone = little pyramid in the chosen colour
    el.style.setProperty("--kleur", PIONKLEUREN[it.kleur] || PIONKLEUREN.oranje);
  } else if (MATERIAAL[it.type]) {                   // equipment = an icon
    el.textContent = MATERIAAL[it.type];
  } else if (it.type === "boog") {                   // arc = curved line with an arrow head
    el.style.width = it.l + "%";
    el.style.height = it.h + "%";
    el.style.transform = `translate(0, -100%) rotate(${it.a}deg)`;
    el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 98 Q50 2 98 98" fill="none" stroke="${LIJNEN.boog}" stroke-width="4"
        stroke-dasharray="9 7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  } else if (isLijn(it)) {                           // line/arrow = stroke with length + angle
    el.classList.add("lijn");
    el.style.width = it.l + "%";
    el.style.transform = `rotate(${it.a}deg)`;
    if (it.type === "pijl") {                        // an arrow gets an arrow head (see style.css)
      el.style.setProperty("--kleur", LIJNEN.pijl);
    } else {
      el.style.background = STIPPEL[it.type]
        ? `repeating-linear-gradient(90deg, ${LIJNEN[it.type]} 0 7px, transparent 7px 13px)`
        : LIJNEN[it.type];
    }
  } else {                                           // zone = rectangle
    el.style.width = it.b + "%";
    el.style.height = it.h + "%";
  }

  /* Handle at the end: use it to make a line/arc/zone longer or smaller.
     Visible as soon as you pick "Selecteer" (see style.css). */
  if (isLijn(it) || it.type === "zone") {
    const g = document.createElement("span");
    g.className = "greep";
    el.appendChild(g);
  }
  return el;
}

/* The number or text next to an arrow/line/arc (separate element, so it stays upright) */
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

/* Redraw the whole pitch from the data */
function renderBord() {
  const nodes = [];
  bord.forEach((it, i) => {
    nodes.push(maakElement(it, i));
    const label = maakLabel(it, i);
    if (label) nodes.push(label);
  });
  ITEMS.replaceChildren(...nodes);
}
function leegBord() { bord = []; bordBasis = "[]"; renderBord(); }

/* Put a number or text next to an arrow/line/arc.
   No browser popup, but a small input field on the pitch itself:
   type and press Enter (or click elsewhere) = save, Esc = cancel. */
let bewaarLabel = null;      // closes the open text field neatly

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

/* Where is the point of this event? Pointer events put the
   coordinates on the event itself, touch events keep them in
   changedTouches/touches. That way one piece of code handles both. */
const puntVan = e => e.changedTouches?.[0] || e.touches?.[0] || e;

/* Start: press a finger or mouse on the pitch */
function startOp(e) {
  if (isTelefoon()) return;                          // narrow screen = view only
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.target.closest(".labeledit")) return;         // you are typing a number/text
  if (bewaarLabel) { bewaarLabel(); return; }         // close the open text field first
  e.preventDefault();                                // no text selection / no page scrolling
  const p = muisPos(puntVan(e));
  const raak = e.target.closest(".item");
  const bestaand = raak ? bord[+raak.dataset.index] : null;

  if (tool === "select") {                           // ── grab something
    if (!bestaand) return;
    const viaGreep = !!e.target.closest(".greep");   // on the handle = resize, otherwise move
    greep = {
      it: bestaand, start: { x: bestaand.x, y: bestaand.y }, bestaand: true,
      soort: !viaGreep ? "sleep"
        : bestaand.type === "zone" ? "zone"
        : bestaand.type === "boog" ? "boog" : "lijn",
      verschil: { dx: bestaand.x - p.x, dy: bestaand.y - p.y }   // do not jump when you grab it
    };
    return;
  }

  if (tool === "erase") {                            // ── remove one thing
    if (!bestaand) return;
    snapshot();
    bord = bord.filter(x => x !== bestaand);
    renderBord();
    return;
  }

  if (tool === "label") {                            // ── number/text next to an arrow
    if (!bestaand || !isLijn(bestaand))
      return alert("Klik op een pijl, lijn of boog om er een cijfer of tekst bij te zetten.");
    vraagLabel(bestaand);
    return;
  }

  if (tool === "pion" && bestaand?.type === "pion") { // ── give an existing cone another colour
    snapshot();
    bestaand.kleur = pionKleur;
    renderBord();
    return;
  }

  /* ── place something new (allowed on top of an existing item) */
  snapshot();
  let nieuw;
  if (tool.startsWith("speler-")) {                  // shirt number per colour: 1, 2, 3…
    const kleur = tool.slice(7);
    const nrs = bord.filter(i => i.type === "speler" && i.kleur === kleur).map(i => i.nr);
    nieuw = { type: "speler", kleur, nr: nrs.length ? Math.max(...nrs) + 1 : 1, x: p.x, y: p.y };
  } else if (tool === "boog") {                      // click = small arc, drag = bigger arc
    nieuw = { type: "boog", x: p.x, y: p.y, l: 12, a: 0, h: 10 };
  } else if (isLijn({ type: tool })) {               // click = short line, drag = roll it out
    nieuw = { type: tool, x: p.x, y: p.y, l: 12, a: 0 };
  } else if (tool === "zone") {
    nieuw = { type: "zone", x: p.x, y: p.y, b: 15, h: 12 };
  } else if (tool === "pion") {                      // a cone remembers its colour
    nieuw = { type: "pion", kleur: pionKleur, x: p.x, y: p.y };
  } else {
    nieuw = { type: tool, x: p.x, y: p.y };
  }

  bord.push(nieuw);
  greep = { it: nieuw, start: { x: p.x, y: p.y },
            soort: nieuw.type === "zone" ? "zone" : nieuw.type === "boog" ? "boog" : isLijn(nieuw) ? "lijn" : "sleep" };
  renderBord();
}

/* Dragging: move a player, roll out a line/arrow, enlarge an arc or size a zone */
function beweegOp(e) {
  if (!greep) return;
  if (e.cancelable) e.preventDefault();
  if (!greep.verplaatst) {                           // first movement = one undo step
    greep.verplaatst = true;
    if (greep.bestaand) snapshot();
  }
  const p = muisPos(puntVan(e));

  if (greep.soort === "sleep") {
    const v = greep.verschil || { dx: 0, dy: 0 };
    greep.it.x = Math.min(100, Math.max(0, p.x + v.dx));
    greep.it.y = Math.min(100, Math.max(0, p.y + v.dy));
  } else if (greep.soort === "lijn") {               // length + angle from the difference
    const dx = (p.x - greep.start.x) * p.r.width / 100;
    const dy = (p.y - greep.start.y) * p.r.height / 100;
    greep.it.l = Math.max(1, Math.hypot(dx, dy) / p.r.width * 100);
    greep.it.a = Math.atan2(dy, dx) * 180 / Math.PI;
  } else if (greep.soort === "boog") {               // arc: the longer, the rounder
    const dx = (p.x - greep.start.x) * p.r.width / 100;
    const dy = (p.y - greep.start.y) * p.r.height / 100;
    const lengte = Math.max(1, Math.hypot(dx, dy) / p.r.width * 100);
    greep.it.l = lengte;
    greep.it.a = Math.atan2(dy, dx) * 180 / Math.PI;
    greep.it.h = Math.min(55, Math.max(6, lengte * 0.7));
  } else {                                           // zone: width × height
    greep.it.b = Math.max(1, p.x - greep.start.x);
    greep.it.h = Math.max(1, p.y - greep.start.y);
  }
  renderBord();
}

const stopGreep = () => (greep = null);

/* Subscribe. Pointer events are the modern way (iPadOS 13 and newer,
   and every laptop). An older iPad does not know them; there we catch
   the finger with touch events, so drawing works there just as well. */
if (window.PointerEvent) {
  PITCH.addEventListener("pointerdown", startOp);
  window.addEventListener("pointermove", beweegOp);
  window.addEventListener("pointerup", stopGreep);
  window.addEventListener("pointercancel", stopGreep);
} else {
  PITCH.addEventListener("touchstart", startOp, { passive: false });
  window.addEventListener("touchmove", beweegOp, { passive: false });
  window.addEventListener("touchend", stopGreep);
  window.addEventListener("touchcancel", stopGreep);
}

/* Wire up all board buttons at once (data-tool="speler-rood", "undo", …) */
document.querySelectorAll("[data-tool]").forEach(knop => knop.addEventListener("click", () => {
  const t = knop.dataset.tool;
  if (t === "undo" && geschiedenis.length) bord = JSON.parse(geschiedenis.pop());
  else if (t === "leeg" && bord.length) { snapshot(); leegBord(); }
  else tool = t;
  PITCH.dataset.tool = tool;              // this tells the styles whether the handle must show
  document.querySelectorAll("[data-tool]").forEach(k => k.classList.toggle("active", k === knop && t !== "undo" && t !== "leeg"));
  renderBord();
}));

/* 🎨 Pick the cone colour (the dots under the cone button) */
const stippen = [...document.querySelectorAll("[data-pionkleur]")];
stippen.forEach(stip => stip.addEventListener("click", () => {
  pionKleur = stip.dataset.pionkleur;
  stippen.forEach(s => s.classList.toggle("active", s === stip));
  tool = "pion";   // ready to place right away
  PITCH.dataset.tool = tool;
  document.querySelectorAll("[data-tool]").forEach(k => k.classList.toggle("active", k.dataset.tool === "pion"));
}));

/* 🔍 Search the tools: type "pijl" and only the arrow
   buttons remain. The equipment group opens by itself. */
const zoekTool = document.getElementById("zoekTool");
const geenTool = document.getElementById("geenTool");
const groepen = [...document.querySelectorAll(".bordwrap .toolgroup")];
const zelfOpengezet = new Set();

zoekTool.addEventListener("input", () => {
  const q = zoekTool.value.toLowerCase().trim();

  zelfOpengezet.forEach(g => (g.open = false));           // close what the previous search opened
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

/* If you close the tab with an unsaved drawing, the browser warns you */
window.addEventListener("beforeunload", e => {
  if (!bordVuil()) return;
  e.preventDefault();
  e.returnValue = "";          // this makes browsers show their own warning
});
