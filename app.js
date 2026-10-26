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

/* Start! Alles tekenen bj het openen van de app */
renderPlanner();
renderBibliotheek();
renderArchief();
