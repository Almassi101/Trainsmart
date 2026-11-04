/* ============================================================
   archief.js — THE ARCHIVE (US5 + US6)
   "✔ Afgerond" in the planner asks how it went and puts the
   training here in the archive. Search bar + filter + copy.
   ============================================================ */

const BADGE = { goed: "👍", matig: "😐", slecht: "👎" };

/* US5: finish a training → ask for the result → move to the archive */
function zetAfgerond(oef, datum, entry) {
  const antwoord = (prompt(`Hoe ging "${oef.naam}" op ${datum}?\nTyp: goed / matig / slecht`, "goed") || "").toLowerCase().trim();
  if (!BADGE[antwoord]) return alert("Vul goed, matig of slecht in.");

  archief.push({ id: Date.now(), naam: oef.naam, doel: oef.doel || "", datum, resultaat: antwoord, materiaal: oef.materiaal || {} });
  bewaar(LAGEN.archief, archief);
  planning[datum] = (planning[datum] || []).filter(e => e !== entry);   // remove it from the planner
  bewaar(LAGEN.planning, planning);
  renderPlanner();
  renderArchief();
}

/* Draw the archive (with search + filter) */
function renderArchief() {
  const zoek = document.getElementById("zoekArchief").value.toLowerCase();
  const filter = document.getElementById("filterArchief").value;

  const treffers = archief
    .filter(a => (!filter || a.resultaat === filter) &&
                 (!zoek || `${a.naam} ${a.doel} ${a.datum}`.toLowerCase().includes(zoek)))
    .sort((a, b) => b.datum.localeCompare(a.datum));   // newest on top

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
      /* Exercise no longer exists? Then put it back in the library first. */
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
