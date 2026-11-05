/* ============================================================
   auth.js — LOGIN (Supabase Auth: e-mail + password)
   The app stays behind the login screen until a trainer signs in.
   Every account has its own workspace row in Supabase, and the
   RLS rules only hand out that row to its owner (see supabase.sql).

   Loaded last: it uses the Supabase client from online.js and
   starts the sync once there is a session.
   ============================================================ */

const loginScherm     = document.getElementById("loginScherm");
const loginForm       = document.getElementById("loginForm");
const loginTitel      = document.getElementById("loginTitel");
const loginHint       = document.getElementById("loginHint");
const loginEmail      = document.getElementById("loginEmail");
const loginWachtwoord = document.getElementById("loginWachtwoord");
const loginFout       = document.getElementById("loginFout");
const loginBtn        = document.getElementById("loginBtn");
const loginWissel     = document.getElementById("loginWissel");
const uitlogBtn       = document.getElementById("uitlogBtn");

let accountAanmaken = false;   // false = sign in, true = create account
let gebruiker = null;          // the signed-in trainer (Supabase user)

/* online.js asks this before it talks to Supabase */
const huidigeGebruiker = () => gebruiker;

/* Show or hide the login screen; body.uitgelogd freezes the app behind it */
function toonLogin(ja) {
  loginScherm.hidden = !ja;
  document.body.classList.toggle("uitgelogd", ja);
  if (ja) setTimeout(() => loginEmail.focus(), 60);
}

function toonFout(tekst) {
  loginFout.textContent = tekst || "";
  loginFout.hidden = !tekst;
}

/* Switch between "sign in" and "create account" */
function zetModus(maak) {
  accountAanmaken = maak;
  loginTitel.textContent = maak ? "Account aanmaken" : "Inloggen bij TrainSmart";
  loginHint.textContent = maak
    ? "Kies je e-mailadres en een wachtwoord van minstens 6 tekens."
    : "Log in met je e-mailadres en wachtwoord.";
  loginBtn.textContent = maak ? "Account aanmaken" : "Inloggen";
  loginWissel.textContent = maak
    ? "Ik heb al een account — inloggen"
    : "Nog geen account? Maak er een aan";
  loginWachtwoord.autocomplete = maak ? "new-password" : "current-password";
  toonFout("");
}

/* Supabase speaks English; the trainer gets a Dutch sentence */
function nlFout(fout) {
  const m = (fout?.message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mailadres of wachtwoord klopt niet.";
  if (m.includes("email not confirmed"))       return "Bevestig eerst je e-mailadres via de link in je mailbox.";
  if (m.includes("already"))                   return "Dit e-mailadres heeft al een account. Log in.";
  if (m.includes("password should be"))        return "Kies een wachtwoord van minstens 6 tekens.";
  if (m.includes("invalid email") || m.includes("validate email")) return "Dit e-mailadres lijkt niet te kloppen.";
  if (m.includes("rate limit") || m.includes("too many")) return "Te veel pogingen achter elkaar. Probeer het over een minuut opnieuw.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Geen verbinding met Supabase. Controleer je internet.";
  return fout?.message || "Er ging iets mis. Probeer het opnieuw.";
}

/* Signed in: hide the screen and start the sync for this trainer */
async function startSessie(session) {
  gebruiker = session.user;
  uitlogBtn.hidden = false;
  uitlogBtn.title = `Ingelogd als ${gebruiker.email || "trainer"} — klik om uit te loggen`;
  loginWachtwoord.value = "";
  toonLogin(false);
  await haalOnlineOp();
}

/* Submit: sign in or create the account */
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const wachtwoord = loginWachtwoord.value;

  if (!email) return toonFout("Vul je e-mailadres in.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toonFout("Dit e-mailadres lijkt niet te kloppen.");
  if (!wachtwoord) return toonFout("Vul je wachtwoord in.");
  if (accountAanmaken && wachtwoord.length < 6) return toonFout("Kies een wachtwoord van minstens 6 tekens.");
  if (!db) return toonFout("Supabase is niet geladen. Controleer je internet en herlaad de pagina.");

  loginBtn.disabled = true;
  loginBtn.textContent = accountAanmaken ? "Bezig…" : "Inloggen…";
  toonFout("");

  try {
    const { data, error } = accountAanmaken
      ? await db.auth.signUp({ email, password: wachtwoord })
      : await db.auth.signInWithPassword({ email, password: wachtwoord });

    if (error) return toonFout(nlFout(error));

    /* "Confirm email" is on: there is no session until the link is clicked */
    if (!data.session) {
      toonFout("Bijna klaar: open de mail die je net hebt gekregen en klik op de link. Daarna kun je inloggen.");
      return;
    }
    await startSessie(data.session);
  } catch (fout) {
    toonFout(nlFout(fout));
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = accountAanmaken ? "Account aanmaken" : "Inloggen";
  }
});

loginWissel.addEventListener("click", () => zetModus(!accountAanmaken));

/* Log out: the local data stays, the shared data is no longer visible */
uitlogBtn.addEventListener("click", async () => {
  if (!confirm("Wil je uitloggen? Je oefeningen blijven bewaard.")) return;
  await db?.auth.signOut();
  gebruiker = null;
  uitlogBtn.hidden = true;
  zetStand("🔒 Uitgelogd", "uit", "Log in om je oefeningen tussen apparaten te delen.");
  toonLogin(true);
});

/* Someone signs out in another tab: follow along */
db?.auth.onAuthStateChange((gebeurtenis, session) => {
  if (session) return;
  gebruiker = null;
  uitlogBtn.hidden = true;
  zetStand("🔒 Uitgelogd", "uit", "Log in om je oefeningen tussen apparaten te delen.");
  toonLogin(true);
});

/* Start: is there already a session from last time? */
(async function start() {
  zetModus(false);
  if (!db) {
    toonFout("Supabase kon niet geladen worden. Zonder internet kun je niet inloggen.");
    return;
  }
  try {
    const { data } = await db.auth.getSession();
    if (data?.session) await startSessie(data.session);
    else toonLogin(true);
  } catch (fout) {
    toonFout(nlFout(fout));
  }
})();
