/* ============================================================
   app.js — START + TABS
   A tiny file: it only handles the three tabs at the top and
   starts the app. The real features live in the other files
   (see the notes at the bottom of index.html).
   ============================================================ */

/* Tabs: show the chosen screen, hide the rest */
function wisselTab(naam) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === naam));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === naam));
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => wisselTab(tab.dataset.tab)));

/* Clicking the logo = go to the home page (the planner) */
document.getElementById("logoLink").addEventListener("click", e => {
  e.preventDefault();            // do not actually jump to #planner
  wisselTab("planner");
});

/* Small screen (phone or iPad in Split View): a button to design anyway.
   Without it, such a narrow screen would be view only. */
const ontwerpKleinBtn = document.getElementById("ontwerpKleinBtn");
function toonKleinStand() {
  const aan = ontwerpKleinAan();
  ontwerpKleinBtn.textContent = aan ? "👁 Alleen bekijken" : "✏️ Toch ontwerpen";
  document.getElementById("kleinMeldingTekst").textContent = aan
    ? "✏️ Ontwerpen staat aan voor dit scherm — kies links een gereedschap en tik op het veld."
    : "📱 Alleen bekijken op een smal scherm — tik op “Toch ontwerpen” om hier toch te tekenen.";
}
ontwerpKleinBtn.addEventListener("click", () => {
  zetOntwerpKlein(!ontwerpKleinAan());
  toonKleinStand();
  renderBord();
});
toonKleinStand();

/* Start! Draw everything when the app opens */
renderPlanner();
renderBibliotheek();
renderArchief();
