# ⚽ TrainSmart — Ontwerp. Train. Verbeter.

Een webapp voor trainers die hun trainingsweek willen plannen, oefeningen willen
tekenen op een tactiekbord en uitgevoerde trainingen willen archiveren.

**Geen installatie nodig:** download de map en dubbelklik op `index.html`.
Alles werkt offline en je opgeslagen planning blijft bewaard in je browser.

---

## 📁 De bestanden — elk onderdeel heeft zijn eigen bestand

| Bestand | Wat het doet | User stories |
|---|---|---|
| `index.html` | De drie schermen en alle knoppen (de *structuur*) | — |
| `style.css` | Alle kleuren en opmaak (hoe het *eruitziet*) | — |
| `data.js` | Het geheugen: opslag in de browser + hulpfuncties | — |
| `board.js` | Het tactiekbord: plaatsen, tekenen, slepen, ongedaan | US2 + US3 |
| `planner.js` | De weekplanner + oefeningenbibliotheek | US1 + US6 |
| `bord-io.js` | Oefeningen opslaan en terug op het bord zetten | US2 + US3 |
| `archief.js` | Afronden, zoeken, filteren, kopiëren | US5 + US6 |
| `app.js` | Start de app + de tabbladen | — |
| `online.js` | Deelt de oefeningen tussen laptop en iPad via Supabase | — |
| `supabase.sql` | De tabel + beveiligingsregels (één keer in Supabase draaien) | — |

**Laadvolgorde** (staat ook uitgelegd in `index.html`): `data.js` eerst, want de
rest gebruikt die opslag; `app.js` daarna, want die start alles op; `online.js`
als laatste, want die vult de app met wat er online staat.

---

## 🕐 Een training bestaat uit fases

Een training is zelden één oefening. Daarom krijgt elke oefening die je op een
dag zet een **fase**: Warming-up, Kern, Partijvorm of Afsluiting. De kaartjes
staan automatisch in die volgorde, met een kleurstreep per fase. Bij het
opslaan vul je de **duur in minuten** in (standaard 15), en de dag toont
bovenaan de **totale duur** — bijvoorbeeld *“Maandag 26 oktober · 45 min”*.

---

## ✅ De user stories

| US | Story | Waar in de app? | Welk bestand? |
|---|---|---|---|
| **US1** | *Als trainer wil ik mijn trainingen per dag plannen, zodat mijn week overzichtelijk is.* | Planner-tab: 7 dagen, kaartjes verslepen, fases per oefening, totale duur per dag, weekknoppen ‹ › | `planner.js` |
| **US2** | *Als trainer wil ik oefeningen kunnen tekenen, zodat spelers ze kunnen zien.* | Tactiekbord: spelers, materiaal, lijnen en zones op het veld | `board.js` |
| **US3** | *Als trainer wil ik per oefening zien welk materiaal ik nodig heb.* | Icoontjes worden automatisch geteld en op elk kaartje getoond | `data.js` + `bord-io.js` |
| **US5** | *Als trainer wil ik afgeronde trainingen terug kunnen kijken.* | "✔ Afgerond" → kies resultaat → archief met zoekbalk en filter | `archief.js` |
| **US6** | *Als trainer wil ik een geslaagde training makkelijk opnieuw plannen.* | "📋 Kopieer" op elk kaartje in de bibliotheek en het archief | `planner.js` + `archief.js` |

---

## 🎨 Het tactiekbord

De indeling: **bovenaan** geef je de oefening een naam en een doel en klik je op
**💾 Opslaan** — dat blijft altijd in beeld, dus je hoeft niet te scrollen.
**Links** staan de **spelers** en het uitklapbare **materiaal**, **rechts** staan
de **acties** (pijl, lijnen, boog, zone, cijfer/tekst, ongedaan en verwijderen).
Met de zoekbalk links bovenin vind je elk gereedschap in één keer terug. Op een
tablet worden de acties een strook boven het veld, zodat het veld breed blijft.

**Spelers in 4 kleuren** — rood, blauw, **geel** en **groen**. Elke kleur telt
zijn eigen rugnummers: plaats je twee rode spelers, dan krijgen die 1 en 2.
Zo kun je twee teams én bv. keepers of "neutrale" spelers een eigen kleur geven.

Verder als materiaal: bal, hoedje, pion, starthoedje, vlag, hoepel, ladder,
markeringsschijf, horde, rebounder, mikdoel, handschoen, keeperpop en doel;
**dribbellijn**
(geel), **schotlijn** (wit) en **looplijn** (groen gestippeld) om te tekenen;
**pijl** (oranje, met pijlpunt), **boogloop** (kromme gestippelde looplijn) en
zones om een gebied af te bakenen.

**Pionnen** kun je in zes kleuren plaatsen (oranje, rood, blauw, geel, groen en
wit) met de kleurstippen onder de pion-knop; klik je met de pion-tool op een
bestaande pion, dan krijgt die de gekozen kleur.

Bij elke pijl, lijn of boog kun je met **🏷️ Cijfer / tekst** een nummertje of
kort woord zetten (bv. "1", "2", "kaats"). Met **🧽 Verwijder item** haal je
één ding weg in plaats van het hele veld, met **Selecteer** versleep je alles
en met **Ongedaan** ga je een stap terug.

Met **Selecteer** pak je een pijl, lijn, boog of zone bij de streep vast om hem
te **verplaatsen**. Het witte bolletje aan het eind maak je hem langer of draai
je hem — zo verandert hij niet meer vanzelf als je hem alleen wilt verzetten.

Het bord werkt met muis én vinger: op een tablet teken, sleep en wis je gewoon
met je vinger.

---

## 📱 Telefoon: alleen bekijken

De app past zich automatisch aan het scherm aan:

- **Laptop / tablet (breder dan 520px)** — alles: tekenen, plannen, archiveren.
  Dit is de normale stand op een iPad (liggend én rechtop).
- **Smal scherm (smaller dan 520px)** — standaard **alleen bekijken**: de
  toolbox en de ontwerp-knop verdwijnen. Dat is de telefoon, maar het gebeurt
  óók op een iPad waar Safari in **Split View** naast een andere app staat.
  Daarom staat er boven het veld een melding met de knop **✏️ Toch ontwerpen**:
  één tik en je kunt op dat scherm alsnog oefeningen maken. De app onthoudt
  die keuze, dus je hoeft het maar één keer te doen (met **👁 Alleen bekijken**
  zet je het weer uit).

Op een iPad werkt het bord met je vinger: tik een gereedschap aan en tik of
sleep op het veld. Lang drukken geeft geen "kopieer/opslaan"-menu meer in de
weg, en de grepen zijn er iets groter zodat je ze met een vinger raakt.
Een oudere iPad (iPadOS 12, zonder pointer-events) gebruikt automatisch de
touch-bediening — daar hoef je niets voor in te stellen.

**Hoe het werkt** (makkelijk uit te leggen):
1. `data.js` heeft één vraag: `isTelefoon()` — *is het scherm smaller dan 520px
   én staat "toch ontwerpen" niet aan?*
2. `board.js` en `planner.js` vragen die vóór elke actie: bij "ja" doen ze niets.
3. `style.css` (onderaan) verbergt de gereedschappen met een media-query;
   `body.ontwerp-klein` zet ze weer aan als je op "Toch ontwerpen" tikt.

---

## 💾 Hoe de opslag werkt

De app bewaart drie lijsten in `localStorage` (het geheugen van de browser):

- `trainsmart_oefeningen` — je getekende oefeningen
- `trainsmart_planning` — welke oefening op welke dag staat
- `trainsmart_archief` — afgeronde trainingen met resultaat

Bij elke wijziging wordt de lijst opnieuw opgeslagen, dus niets gaat verloren
als je het tabblad sluit.

## ☁️ Delen tussen laptop en iPad (Supabase)

Dezelfde gegevens gaan ook naar een Supabase-database, zodat je op je iPad
de oefeningen van je laptop ziet. `online.js` doet dat:

1. Bij het openen haalt het de gedeelde werkruimte op en zet die in de app.
2. Elke wijziging wordt (na een korte pauze) naar de tabel `werkruimte` gestuurd.
3. Kom je terug in de app, dan ververst hij zichzelf.

Rechtsboven zie je de stand: **☁️ Online** (groen), **⚠️ Offline** of
**💾 Alleen dit apparaat**. Zonder internet blijft de app gewoon werken en
probeert hij het later opnieuw.

**Eenmalig instellen:** draai `supabase.sql` in de SQL Editor van je
Supabase-project, en vul in `online.js` de `ONLINE_URL` in (Project Settings →
Data API). De publieke sleutel (`sb_publishable_…`) mag in de code staan; de
beveiliging zit in de RLS-regels van `supabase.sql`.

*Let op:* elke trainer heeft sinds de login zijn **eigen werkruimte** in
Supabase. De rij met id `gedeeld` van vóór de login staat er nog, maar is niet
meer bereikbaar.

### 🔐 Inloggen

De app blijft achter een inlogscherm staan tot je inlogt: zonder account geeft
Supabase geen gegevens terug. De login staat in `auth.js` en gebruikt
**Supabase Auth** (e-mailadres + wachtwoord).

Eenmalig instellen in Supabase:

1. **Authentication → Providers → Email**: zet Email aan.
2. Voor een demo is het handig om **“Confirm email” uit** te zetten; staat die
   aan, dan moet je eerst op de link in je mailbox klikken voor je kunt inloggen.
3. Draai de nieuwe `supabase.sql` in de **SQL Editor** — dat vervangt de oude
   regels door regels die alleen de eigenaar toegang geven.
4. Maak accounts aan via **Authentication → Users → Add user**, of laat iedere
   trainer zich in de app registreren via “Nog geen account?”.

De beveiliging zit in de RLS-regels: een rij is alleen leesbaar als
`auth.uid()::text = id`, en de rij-id is het account van de trainer. Uitloggen
kan met de knop rechtsboven; de gegevens blijven dan bewaard.

---

## 🧭 Snelstart

1. Open de app → tab **📅 Planner**
2. Klik **➕ Nieuwe oefening ontwerpen** → je gaat naar het tactiekbord
3. Kies links een tool (bijv. *Speler rood*) en klik/sleep op het veld
4. Geef de oefening een naam, doel en duur en klik **💾 Opslaan in bibliotheek**
5. Terug in de planner: sleep je oefening van de bibliotheek naar een dag
6. Na de training: **✔ Afgerond** → kies goed/matig/slecht → belandt in het archief
7. Geslaagde training? **📋 Kopieer** zet 'm meteen in een nieuwe week
