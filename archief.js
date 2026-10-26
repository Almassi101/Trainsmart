/* ============================================================
   archief.js — HET ARCHIEF (US5 + US6)
   "✔ Afgerond" in de planner vraagt hoe het ging en zet de
   training hier in het archief. Zoekbalk + filter + kopiëren.
   ============================================================ */

const BADGE = { goed: "👍", matig: "😐", slecht: "👎" };

/* US5: training afronden → vraag resultaat → naar archief */
function zetAfgerond(oef, datum, entry) {
  const antwoord = (prompt(`Hoe ging "${oef.naam}" op ${datum}?\nTyp: goed / matig / slecht`, "goed") || "").toLowerCase().trim();
  if (!BADGE[antwoord]) return alert("Vul goed, matig of slecht in.");

  archief.push({ id: Date.now(), naam: oef.naam, doel: oef.doel || "", datum, resultaat: antwoord, materiaal: oef.materiaal || {} });
  bewaar(LAGEN.archief, archief);
  planning[datum] = (planning[datum] || []).filter(e => e !== entry);   // uit de planner weg
  bewaar(LAGEN.planning, planning);
  renderPlanner();
  renderArchief();
}

/* Het archief tekenen (met zoeken + filter) */
function renderArchief() {
  const zoek = document.getElementById("zoekArchief").value.toLowerCase();
  const filter = document.getElementById("filterArchief").value;

  const treffers = archief
    .filter(a => (!filter || a.resultaat === filter) &&
                 (!zoek || `${a.naam} ${a.doel} ${a.datum}`.toLowerCase().includes(zoek)))
    .sort((a, b) => b.datum.localeCompare(a.datum));   // nieuwste bovenaan

  const lijst = document.getElementById("archList");
  if (!treffers.length) {
    lijst.innerHTML = `<p class="hint">Nog niets in het archief. Rond een training af in de planner met “✔ Afgerond”.</p>`;
    return;
  }

  lijst.innerHTML = "";
  treffers.forEach(a => {
    const el = document.createElement("div");
    el.className = "architem";
    el.innerHTML = `<span class="badge">${BADGE[a.resultaat]}</span>
      <div class="info"><strong>${a.naam}</strong>
      <span>${a.datum} · ${BADGE[a.resultaat] ? { goed: "Goed gegaan", matig: "Matig", slecht: "Zwaar / lastig" }[a.resultaat] : ""}${a.doel ? " · " + a.doel : ""}</span></div>
      <span class="mat">${materiaalIcoontjes(a)}</span>
      <button class="kbtn" data-a="herhaal">📋 Kopieer naar komende week</button>
      <button class="kbtn del" data-a="verwijder">✕</button>`;

    knop(el, "herhaal", () => {
      /* Oefening bestaat niet meer? Dan eerst terug in de bibliotheek zetten. */
      let oef = oefeningen.find(o => o.naam === a.naam);
      if (!oef) {
        oef = { id: Date.now(), naam: a.naam, doel: a.doel, materiaal: a.materiaal || {}, bord: { items: [] }, gemaakt: a.datum };
        oefeningen.push(oef);
        bewaar(LAGEN.oefeningen, oefeningen);
        renderBibliotheek();
      }
      kopieerNaarDatum(oef);
    });
    knop(el, "verwijder", () => {
      archief = archief.filter(x => x.id !== a.id);
      bewaar(LAGEN.archief, archief);
      renderArchief();
    });
    lijst.appendChild(el);
  });
}

document.getElementById("zoekArchief").addEventListener("input", renderArchief);
document.getElementById("filterArchief").addEventListener("change", renderArchief);
