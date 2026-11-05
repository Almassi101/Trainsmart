# TrainSmart — versie 1 + versie 2

**Status:** versie 1 is ingeleverd · versie 2 is in ontwikkeling
**Laatst bijgewerkt:** 5 november 2026

TrainSmart is een webapp waarmee een voetbaltrainer zijn trainingsweek plant,
oefeningen tekent op een tactiekbord en afgeronde trainingen archiveert.
Live: https://trainsmart.vercel.app

---

## Versie 1 — ingeleverd (2 november 2026)

Commit `a32fa76` · precies zoals gepresenteerd en ingeleverd.

| User story | Wat het doet |
|---|---|
| US1 | Weekplanner met 7 dagen, fases per oefening (warming-up → afsluiting) en totale duur per dag |
| US2 | Tactiekbord: spelers in 4 kleuren, 14 materiaalsoorten, lijnen, pijl, boog, zone, cijfers bij pijlen, undo, wissen |
| US3 | Materiaal wordt automatisch geteld en op elk kaartje en op het bord getoond |
| US5 | Afronden met resultaat → archief met zoekbalk en filter |
| US6 | Kopiëren naar een nieuwe week, vanuit de bibliotheek en het archief |

Verder in versie 1:

- werkt met muis én vinger (tablet), grepen iets groter op een touchscreen
- telefoon: alleen bekijken, met een knop om op een smal scherm toch te ontwerpen
- inplannen zonder slepen via “📅 Inplannen” en een dagkiezer
- waarschuwing bij het sluiten van een niet-opgeslagen tekening
- delen tussen laptop en iPad via Supabase
- statische HTML/CSS/JS, geen installatie nodig, werkt offline met `localStorage`

**Bewuste beperkingen van versie 1** (destijds bekend, nu de basis voor versie 2):

- één gedeelde werkruimte zonder login — iedereen met de link kon alles lezen en wijzigen
- geen export: een oefening kon niet geprint of als PDF meegenomen worden
- het archief bewaart alleen goed/matig/slecht, geen aantekeningen
- oefeningen met dezelfde naam overschrijven elkaar
- geen geautomatiseerde tests
- US4 ontbreekt in de user stories (we hebben US1, 2, 3, 5 en 6)

---

## Versie 2 — verdere ontwikkeling

### Al gedaan na de inlevering

| Datum | Commit | Wat |
|---|---|---|
| 4 november | `4f1caeb` | Al het codecommentaar naar het Engels, zodat de code voor iedereen leesbaar is |

Een login is tussendoor gebouwd en daarna weer verwijderd: die hoort bij de
bespreking van versie 2 en niet bij wat er nu live staat. De app werkt voorlopig
weer zoals in versie 1, zonder account.

### Gepland, in deze volgorde

1. **Export** — een oefening als PDF of afbeelding printen en delen, zodat hij mee het veld op kan.
2. **Notities bij afronden** — naast goed/matig/slecht een kort notitieveld: wat ging goed, wat volgende keer anders.
3. **Dupliceren en zoeken** — een variatie van een oefening maken zonder het origineel te overschrijven, plus een zoekveld in de bibliotheek.
4. **Focusmodus op het bord** — het bord schermvullend tonen tijdens de uitleg op het veld.
5. **Meerdere mensen met een eigen account** — zie hieronder.
6. **Back-up** — gegevens kunnen exporteren en terugzetten, zodat een opgeruimde browser geen bibliotheek kost.
7. **Kwaliteit** — automatische tests en de app installeerbaar maken op de iPad (PWA).

---

## Het idee: meer mensen, ieder een eigen account

De app is nu voor één trainer bedoeld. Zodra er meer mensen komen — collega-
trainers, vrijwilligers, iemand die een training overneemt — moet iedereen zelf
een account kunnen maken en daarmee toegang krijgen, zonder dat de één het werk
van de ander kan overschrijven of wissen.

Dat werkt in drie lagen:

| Laag | Wat het is |
|---|---|
| **Account** | Per persoon, met e-mailadres en wachtwoord. Bestaat al sinds versie 2. |
| **Club / team** | Een club met leden. Wie een account heeft, wordt lid van de club van zijn team. |
| **Rol** | Beheerder (leden beheren), trainer (oefeningen maken en plannen), vrijwilliger (alleen bekijken wat voor hem is ingepland). |

Wat dat in de praktijk betekent:

- oefeningen en planningen worden per **club** gedeeld in plaats van per persoon
- een beheerder nodigt mensen uit per e-mail; zij maken zelf een wachtwoord
- per rol verschillen de rechten: de één mag wijzigen, de ander alleen lezen
- wat nu per trainer is opgeslagen, verhuist mee naar de club

Wat er technisch nog voor nodig is (plan, nog niet gebouwd):

- tabellen `clubs` en `leden` (account + club + rol)
- beveiligingsregels die niet “ben ik de eigenaar” controleren, maar “ben ik lid van deze club”
- een scherm om leden uit te nodigen en rollen te zetten
- oefeningen en planning krijgen een club-id in plaats van een gebruikers-id

---

## Openstaande punten

- **US4** — in de user stories ontbreekt US4 (we hebben US1, 2, 3, 5 en 6). Navragen of die is komen te vervallen.
- **Keuze voor stap 5** — aparte werkruimte per trainer (zoals nu) of één gedeelde clubwerkruimte? Dat bepaalt hoe de club-laag eruit komt te zien.

---

## Overzicht

| Versie | Status | Commit |
|---|---|---|
| 1.0 | ingeleverd op 2 november 2026 | `a32fa76` |
| 1.1 | commentaar naar het Engels, login weer verwijderd | `4f1caeb` |
| 2.0 | in ontwikkeling, nog te bespreken | nog geen code |
