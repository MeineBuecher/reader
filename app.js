const SUPABASE_URL = "https://wveuqjdnhovwdwlrckwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_OptCG7mWpIJhHGMr_1QF4w_IY2bObvs";

const statusBox = document.getElementById("status");
const loginBox = document.getElementById("loginBox");
const libraryBox = document.getElementById("libraryBox");
const booksContainer = document.getElementById("books");

function setStatus(text) {
  if (statusBox) statusBox.textContent = text;
  console.log(text);
}

setStatus("app.js wurde geladen");

if (!window.supabase) {
  setStatus("Fehler: Supabase-Skript wurde nicht geladen.");
  throw new Error("Supabase library fehlt.");
}

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function signup() {
  setStatus("Registrieren geklickt");

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    setStatus("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await client.auth.signUp({ email, password });

  if (error) {
    setStatus("Registrierung fehlgeschlagen: " + error.message);
    return;
  }

  setStatus("Registrierung erfolgreich.");
}

async function login() {
  setStatus("Anmelden geklickt");

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    setStatus("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus("Anmeldung fehlgeschlagen: " + error.message);
    return;
  }

  setStatus("Login erfolgreich.");
  loginBox.style.display = "none";
  libraryBox.style.display = "block";
  await loadBooks();
}

async function logout() {
  const { error } = await client.auth.signOut();

  if (error) {
    setStatus("Abmeldung fehlgeschlagen: " + error.message);
    return;
  }

  loginBox.style.display = "block";
  libraryBox.style.display = "none";
  setStatus("Abgemeldet.");
}

async function loadBooks() {
  if (!booksContainer) return;

  const { data, error } = await client
    .from("books")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    booksContainer.innerHTML = "<p>Fehler beim Laden der Bücher.</p>";
    setStatus("Fehler beim Laden der Bücher: " + error.message);
    return;
  }

  booksContainer.innerHTML = "";

  if (!data || data.length === 0) {
    booksContainer.innerHTML = "<p>Noch keine Bücher vorhanden.</p>";
    return;
  }

  data.forEach((book) => {
    const card = document.createElement("div");
    card.style.background = "#fff";
    card.style.border = "1px solid #e5e5e5";
    card.style.borderRadius = "10px";
    card.style.padding = "16px";
    card.style.marginBottom = "14px";

    card.innerHTML = `
      <h3>${book.title ?? ""}</h3>
      <p>Preis: ${Number(book.price ?? 0).toFixed(2)} €</p>
    `;

    booksContainer.appendChild(card);
  });
}

async function checkSession() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    setStatus("Session-Fehler: " + error.message);
    return;
  }

  if (data.session) {
    loginBox.style.display = "none";
    libraryBox.style.display = "block";
    setStatus("Bereits eingeloggt.");
    await loadBooks();
  } else {
    loginBox.style.display = "block";
    libraryBox.style.display = "none";
    setStatus("Nicht eingeloggt.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setStatus("DOM geladen, Buttons werden verbunden");

  document.getElementById("registerBtn")?.addEventListener("click", signup);
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  checkSession();
});
