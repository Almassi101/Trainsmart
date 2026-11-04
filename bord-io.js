/* ============================================================
   bord-io.js — SAVING & VIEWING EXERCISES (US2 + US3)
   The bridge between the tactics board and the library.
   ============================================================ */

/* 💾 Save exercise: the board + the equipment count go into the library */
document.getElementById("saveOefBtn").onclick = () => {
  const naam = document.getElementById("oefNaam").value.trim();
  if (!naam) return alert("Geef de oefening eerst een naam!");
  const doel = document.getElementById("oefInfo").value.trim();
  const duur = Math.min(180, Math.max(1, Number(document.getElementById("oefDuur").value) || STANDAARD_DUUR));

  const data = { naam, doel, duur, materiaal: telMateriaal(bord), bord: { items: bord } };

  /* Same name = edit, new name = add */
  const bestaande = oefeningen.find(o => o.naam === naam);
  bestaande ? Object.assign(bestaande, data) : oefeningen.push({ id: Date.now(), gemaakt: fmtDate(new Date()), ...data });
  bewaar(LAGEN.oefeningen, oefeningen);

  leegBord();
  document.getElementById("oefNaam").value = "";
  document.getElementById("oefInfo").value = "";
  document.getElementById("oefDuur").value = "";
  renderBibliotheek();
  renderPlanner();
  wisselTab("planner");
  alert(`Oefening "${naam}" opgeslagen. Je vindt haar terug in de bibliotheek.`);
};

/* 👁 Put an exercise back on the board (view/edit) */
function bekijkOefening(oef) {
  if (bordVuil() && !confirm("Je tekening op het bord is nog niet opgeslagen. Wil je die weggooien en deze oefening openen?")) return;
  wisselTab("bord");
  document.getElementById("bordTitle").textContent = `👁 ${oef.naam}`;
  document.getElementById("oefNaam").value = oef.naam;
  document.getElementById("oefInfo").value = oef.doel || "";
  document.getElementById("oefDuur").value = duurVan(oef);
  bord = JSON.parse(JSON.stringify(oef.bord?.items || []));   // a copy, so the original stays safe
  bordBasis = JSON.stringify(bord);                           // this is the saved version
  renderBord();
}
