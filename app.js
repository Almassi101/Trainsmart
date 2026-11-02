/* ============================================================
   app.js — START + TABBLADEN
   Piepklein bestandje: regelt alleen de drie tabs bovenin en
   start de app op. De echte functies staan in de andere
   bestanden (zie de uitleg onderaan index.html).
   ============================================================ */

/* Tabbladen: toon het gekozen scherm, verberg de rest */
function wisselTab(naam) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === naam));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === naam));
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => wisselTab(tab.dataset.tab)));

/* Klik op het logo = naar de homepage (de planner) */
document.getElementById("logoLink").addEventListener("click", e => {
  e.preventDefault();            // niet echt naar #planner springen
  wisselTab("planner");
});

/* Klein scherm (telefoon of iPad in Split View): knop om tóch te ontwerpen.
   Zonder deze knop zou je op zo'n smal scherm alleen kunnen kijken. */
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

/* Start! Alles tekenen bj het openen van de app */
renderPlanner();
renderBibliotheek();
renderArchief();
