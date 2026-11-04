/* ============================================================
   planner.js — THE PLANNER + LIBRARY (US1, US3, US6)
   Left: the week (Monday to Sunday). Below: the
   exercise library. You drag exercises onto a day.
   ============================================================ */

const DAGEN = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
let weekOffset = 0;   // 0 = this week, -1 previous, +1 next
const fmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" });

/* Get all training cards of one day: { entry, oef } */
function dagKaarten(sleutel) {
  return (planning[sleutel] || [])
    .map(entry => ({ entry, oef: oefeningen.find(o => o.id === entry.id) }))
    .filter(x => x.oef)
    .sort((a, b) => FASES.indexOf(a.entry.fase) - FASES.indexOf(b.entry.fase));   // order of the training
}

/* ---------- Draw the week ---------- */
function renderPlanner() {
  const start = maandagVan(weekOffset);
  const eind = new Date(start); eind.setDate(eind.getDate() + 6);
  document.getElementById("weekLabel").textContent =
    ["Vorige week", "Deze week", "Volgende week"][weekOffset + 1] || `${fmt.format(start)} – ${fmt.format(eind)}`;

  /* The "This week" button is pointless when you are already on this week */
  document.getElementById("weekToday").hidden = weekOffset === 0;

  const grid = document.getElementById("weekGrid");
  grid.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const datum = new Date(start); datum.setDate(datum.getDate() + i);
    const sleutel = fmtDate(datum);

    const dag = document.createElement("div");
    dag.className = "day" + (fmtDate(new Date()) === sleutel ? " is-today" : "");
    dag.dataset.datum = sleutel;
    dag.innerHTML = `<div class="dayhead"><strong class="dayname">${DAGEN[i]}</strong>
      <span class="daydate">${fmt.format(datum)}</span></div><div class="daybody"></div>`;
    const kaarten = dagKaarten(sleutel);
    const minuten = kaarten.reduce((som, k) => som + duurVan(k.oef), 0);
    if (kaarten.length) dag.querySelector(".daydate")
      .insertAdjacentHTML("afterend", ` <span class="daytot">· ${minuten} min</span>`);

    const body = dag.querySelector(".daybody");
    kaarten.forEach(({ entry, oef }) => body.appendChild(maakKaart(oef, sleutel, entry)));

    /* Drag an exercise here */
    dag.addEventListener("dragover", e => { e.preventDefault(); dag.classList.add("drop"); });
    dag.addEventListener("dragleave", () => dag.classList.remove("drop"));
    dag.addEventListener("drop", e => {
      e.preventDefault(); dag.classList.remove("drop");
      if (isTelefoon()) return;                    // phone = view only
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.van && Array.isArray(planning[data.van]) && data.index >= 0)
        planning[data.van].splice(data.index, 1);                       // move it
      (planning[sleutel] = planning[sleutel] || []).push({ id: data.oefId, fase: data.fase || "Kern" });
      bewaar(LAGEN.planning, planning);
      renderPlanner();
    });
    grid.appendChild(dag);
  }
}

/* A training card on a day, with its phase in the training */
function maakKaart(oef, datum, entry) {
  const kaart = document.createElement("div");
  kaart.className = "kaart";
  kaart.draggable = true;
  kaart.dataset.fase = entry.fase;               // colour stripe per phase (style.css)
  const faseOpties = FASES.map(f => `<option ${f === entry.fase ? "selected" : ""}>${f}</option>`).join("");
  kaart.innerHTML = `<div class="kaartkop">
      <h4>${oef.naam}</h4>
      <span class="sleepgreep" title="Sleep dit kaartje naar een andere dag" aria-hidden="true">⠿</span>
    </div>
    ${oef.doel ? `<div class="doel">${oef.doel}</div>` : ""}
    <div class="mat">${materiaalIcoontjes(oef)}</div>
    <div class="kmeta">
      <select class="fase" data-a="fase" title="Fase in de training">${faseOpties}</select>
      <span class="duur">⏱ ${duurVan(oef)} min</span>
      <button class="kbtn del" data-a="verwijder" title="Van deze dag halen">✕</button>
    </div>
    <div class="kacties">
      <button class="kbtn done" data-a="klaar">✔ Afgerond</button>
      <button class="kbtn" data-a="bekijk">👁 Bekijk</button>
    </div>`;
  kaart.addEventListener("dragstart", e =>
    e.dataTransfer.setData("text/plain", JSON.stringify({
      oefId: oef.id, van: datum, fase: entry.fase,
      index: (planning[datum] || []).indexOf(entry)
    })));
  kaart.querySelector('[data-a="fase"]').addEventListener("change", e => {
    entry.fase = e.target.value;
    bewaar(LAGEN.planning, planning);
    renderPlanner();              // put the cards back in training order
  });
  knop(kaart, "klaar",    () => zetAfgerond(oef, datum, entry));
  knop(kaart, "bekijk",   () => bekijkOefening(oef));
  knop(kaart, "verwijder",() => {
    planning[datum] = (planning[datum] || []).filter(e => e !== entry);
    bewaar(LAGEN.planning, planning); renderPlanner();
  });
  return kaart;
}

/* Small helper: give a button with data-a="..." a click handler */
function knop(ouder, actie, fn) {
  ouder.querySelector(`[data-a="${actie}"]`).addEventListener("click", fn);
}

/* Week buttons ‹ › and "This week" */
document.getElementById("weekPrev").onclick  = () => { weekOffset--; renderPlanner(); };
document.getElementById("weekNext").onclick  = () => { weekOffset++; renderPlanner(); };
document.getElementById("weekToday").onclick = () => { weekOffset = 0; renderPlanner(); };

/* ---------- Schedule by tapping (tablet and phone) ----------
   Dragging only works with a mouse. That is why “📅 Inplannen”
   lets you pick a day in the week you are viewing; that works with a finger. */
let dagKiezerOef = null;      // the exercise you want to schedule
let dagKiezerWeek = 0;        // which week the picker shows
const dagKiezerEl = document.getElementById("dagKiezer");

function openDagKiezer(oef) {
  dagKiezerOef = oef;
  dagKiezerWeek = weekOffset;
  dagKiezerEl.hidden = false;
  tekenDagKiezer();
}

function sluitDagKiezer() {
  dagKiezerEl.hidden = true;
  dagKiezerOef = null;
}

function tekenDagKiezer() {
  const start = maandagVan(dagKiezerWeek);
  const eind = new Date(start); eind.setDate(eind.getDate() + 6);
  document.getElementById("dagKiezerOef").textContent = dagKiezerOef
    ? `“${dagKiezerOef.naam}” · ${fmt.format(start)} – ${fmt.format(eind)}`
    : "";

  const vak = document.getElementById("dagKiezerDagen");
  vak.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const datum = new Date(start); datum.setDate(datum.getDate() + i);
    const sleutel = fmtDate(datum);
    const dagknop = document.createElement("button");
    dagknop.type = "button";
    dagknop.className = "dagknop" + (fmtDate(new Date()) === sleutel ? " is-vandaag" : "");
    dagknop.innerHTML = `<strong>${DAGEN[i].slice(0, 2)}</strong><span>${fmt.format(datum)}</span>`;
    dagknop.addEventListener("click", () => planOpDag(sleutel));
    vak.appendChild(dagknop);
  }
}

/* The chosen day: add the exercise (as “Kern”, just like dragging does) */
function planOpDag(sleutel) {
  if (!dagKiezerOef) return;
  (planning[sleutel] = planning[sleutel] || []).push({ id: dagKiezerOef.id, fase: "Kern" });
  bewaar(LAGEN.planning, planning);
  weekOffset = dagKiezerWeek;                 // show the right week straight away
  renderPlanner();
  sluitDagKiezer();
  document.querySelector(`.day[data-datum="${sleutel}"]`)
    ?.scrollIntoView({ block: "center", behavior: "smooth" });
}

dagKiezerEl.addEventListener("click", e => { if (e.target === dagKiezerEl) sluitDagKiezer(); });
document.getElementById("dagKiezerSluit").onclick    = sluitDagKiezer;
document.getElementById("dagKiezerVorige").onclick   = () => { dagKiezerWeek--; tekenDagKiezer(); };
document.getElementById("dagKiezerVolgende").onclick = () => { dagKiezerWeek++; tekenDagKiezer(); };
document.addEventListener("keydown", e => { if (e.key === "Escape" && !dagKiezerEl.hidden) sluitDagKiezer(); });

/* ---------- Exercise library ---------- */
function renderBibliotheek() {
  const lijst = document.getElementById("oefList");
  if (!oefeningen.length) {
    lijst.innerHTML = `<p class="hint">Nog geen oefeningen — klik op “➕ Nieuwe oefening ontwerpen”.</p>`;
    return;
  }
  lijst.innerHTML = "";
  oefeningen.forEach(oef => lijst.appendChild(maakOefKaart(oef)));
}

/* An exercise card in the library (with a small preview) */
function maakOefKaart(oef) {
  const kaart = document.createElement("div");
  kaart.className = "oefkaart";
  kaart.draggable = true;
  kaart.innerHTML = `<div class="kaartkop">
      <h4>${oef.naam}</h4>
      <span class="sleepgreep" title="Sleep mij naar een dag" aria-hidden="true">⠿</span>
    </div>
    ${oef.doel ? `<div class="doel">${oef.doel}</div>` : ""}
    <div class="mini">${tekenMini(oef)}</div>
    <div class="duur">⏱ ${duurVan(oef)} min</div>
    <div class="mat">${materiaalIcoontjes(oef)}</div>
    <div class="oacties">
      <button class="kbtn" data-a="bekijk">👁 Bekijk / bewerk</button>
      <button class="kbtn plan" data-a="plan">📅 Inplannen</button>
      <button class="kbtn" data-a="kopieer">📋 Kopieer</button>
      <button class="kbtn del" data-a="verwijder">✕</button>
    </div>`;
  kaart.addEventListener("dragstart", e =>
    e.dataTransfer.setData("text/plain", JSON.stringify({ oefId: oef.id })));
  knop(kaart, "bekijk",   () => bekijkOefening(oef));
  knop(kaart, "plan",     () => openDagKiezer(oef));
  knop(kaart, "kopieer",  () => kopieerNaarDatum(oef));
  knop(kaart, "verwijder",() => {
    if (!confirm(`"${oef.naam}" echt verwijderen uit de bibliotheek?`)) return;
    oefeningen = oefeningen.filter(o => o.id !== oef.id);
    bewaar(LAGEN.oefeningen, oefeningen); renderBibliotheek(); renderPlanner();
  });
  return kaart;
}

/* Small preview: an svg with dots (players), strokes (lines),
   arrows, arcs and the numbers/text you add to an arrow */
const escapeer = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function tekenMini(oef) {
  const stipKleur = it =>
    it.type === "speler" ? (KLEUREN[it.kleur] || "#ffd23f")
    : it.type === "pion" ? (PIONKLEUREN[it.kleur] || PIONKLEUREN.oranje)
    : "#ffd23f";
  const stip = it => `<circle cx="${it.x}" cy="${it.y}" r="${it.type === "speler" ? 3 : 2.5}" fill="${stipKleur(it)}"/>`;
  const eind = l => ({
    x: l.x + Math.cos(l.a * Math.PI / 180) * l.l,
    y: l.y + Math.sin(l.a * Math.PI / 180) * l.l
  });
  const streep = l => {
    const e = eind(l);
    const kleur = LIJNEN[l.type] || "#fff";
    const stippel = l.type === "dribbel" || l.type === "loop" ? ' stroke-dasharray="3 2"' : "";
    let kop = "";
    if (l.type === "pijl") {                       // small arrow head
      const ux = Math.cos(l.a * Math.PI / 180), uy = Math.sin(l.a * Math.PI / 180), s = 4;
      kop = `<polygon fill="${kleur}" points="${e.x},${e.y} ${e.x - s * ux + s * 0.55 * uy},${e.y - s * uy - s * 0.55 * ux} ${e.x - s * ux - s * 0.55 * uy},${e.y - s * uy + s * 0.55 * ux}"/>`;
    }
    return `<line x1="${l.x}" y1="${l.y}" x2="${e.x}" y2="${e.y}"
      stroke="${kleur}" stroke-width="1.5" stroke-linecap="round"${stippel}/>${kop}`;
  };
  const boog = it => `<path d="M${it.x} ${it.y} Q${it.x + it.l / 2} ${it.y - it.h} ${it.x + it.l} ${it.y}"
    transform="rotate(${it.a} ${it.x} ${it.y})" fill="none" stroke="${LIJNEN.boog}"
    stroke-width="1.5" stroke-dasharray="3 2" stroke-linecap="round"/>`;
  const label = it => {
    const x = it.type === "boog" ? it.x + it.l / 2 : it.x + Math.cos(it.a * Math.PI / 180) * it.l / 2;
    const y = it.type === "boog" ? it.y - it.h * 0.62 : it.y + Math.sin(it.a * Math.PI / 180) * it.l / 2;
    return `<text x="${x}" y="${y}" fill="#fff" font-size="7" font-weight="700"
      text-anchor="middle" paint-order="stroke" stroke="#0d1b2a" stroke-width="2">${escapeer(it.label)}</text>`;
  };

  const delen = (oef.bord?.items || []).map(it => {
    if (it.type === "zone")
      return `<rect x="${it.x}" y="${it.y}" width="${it.b}" height="${it.h}" fill="rgba(126,240,178,.15)"/>`;
    if (it.type === "speler" || MATERIAAL[it.type]) return stip(it);
    const vorm = it.type === "boog" ? boog(it) : streep(it);
    return vorm + (it.label ? label(it) : "");
  }).join("");

  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${delen}</svg>`;
}

/* US6: put an exercise on another date with one click */
function kopieerNaarDatum(oef) {
  const datum = prompt("Kopieer naar welke datum? (JJJJ-MM-DD)", fmtDate(maandagVan(1)));
  if (!datum) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return alert("Gebruik JJJJ-MM-DD, bv. 2026-09-23.");
  (planning[datum] = planning[datum] || []).push({ id: oef.id, fase: "Kern" });
  bewaar(LAGEN.planning, planning);
  renderPlanner();
  alert(`"${oef.naam}" staat nu op ${datum}. 📅`);
}

/* "➕ Nieuwe oefening ontwerpen" → empty board + go to the tactics board tab */
document.getElementById("nieuweOefeningBtn").onclick = () => {
  /* Do not silently throw away work that is not saved yet (bord-io.js only
     saves when you press “💾 Opslaan in bibliotheek”). */
  if (bordVuil() && !confirm("Je tekening op het bord is nog niet opgeslagen. Wil je een nieuwe oefening beginnen en de tekening weggooien?")) return;
  leegBord();
  document.getElementById("bordTitle").textContent = "Nieuwe oefening ontwerpen";
  document.getElementById("oefNaam").value = "";
  document.getElementById("oefInfo").value = "";
  document.getElementById("oefDuur").value = "";
  wisselTab("bord");
};
