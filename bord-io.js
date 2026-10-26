/* ============================================================
   bord-io.js — OPSLAAN & BEKIJKEN VAN OEFENINGEN (US2 + US3)
   De brug tussen het tactiekbord en de bibliotheek.
   ============================================================ */

/* 💾 Oefening opslaan: bord + materiaal-telling gaan de bibliotheek in */
document.getElementById("saveOefBtn").onclick = () => {
  const naam = document.getElementById("oefNaam").value.trim();
  if (!naam) return alert("Geef de oefening eerst een naam!");
  const doel = document.getElementById("oefInfo").value.trim();
  const duur = Math.min(180, Math.max(1, Number(document.getElementById("oefDuur").value) || STANDAARD_DUUR));

  const data = { naam, doel, duur, materiaal: telMateriaal(bord), bord: { items: bord } };

  /* Zelfde naam = bewerken, nieuwe naam = erbij */
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

/* 👁 Oefening terug op het bord zetten (bekijken/bewerken) */
function bekijkOefening(oef) {
  wisselTab("bord");
  document.getElementById("bordTitle").textContent = `👁 ${oef.naam}`;
  document.getElementById("oefNaam").value = oef.naam;
  document.getElementById("oefInfo").value = oef.doel || "";
  document.getElementById("oefDuur").value = duurVan(oef);
  bord = JSON.parse(JSON.stringify(oef.bord?.items || []));   // kopie, zodat origineel veilig blijft
  renderBord();
}
