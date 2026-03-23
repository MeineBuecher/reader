const SUPABASE_URL = https://wveuqjdnhovwdwlrckwm.supabase.co;
const SUPABASE_KEY = sb_publishable_OptCG7mWpIJhHGMr_1QF4w_IY2bObvs;

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function signup() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    alert("Eingabefelder nicht gefunden.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { data, error } = await client.auth.signUp({
    email,
    password
  });

  if (error) {
    alert("Registrierung fehlgeschlagen: " + error.message);
    return;
  }

  alert("Registrierung erfolgreich. Du kannst dich jetzt anmelden.");
  console.log("signup:", data);
}

async function login() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    alert("Eingabefelder nicht gefunden.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Anmeldung fehlgeschlagen: " + error.message);
    return;
  }

  alert("Login erfolgreich.");
  console.log("login:", data);

  const loginBox = document.getElementById("loginBox");
  const libraryBox = document.getElementById("libraryBox");

  if (loginBox) loginBox.style.display = "none";
  if (libraryBox) libraryBox.style.display = "block";

  await loadBooks();
}

async function logout() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Abmeldung fehlgeschlagen: " + error.message);
    return;
  }

  const loginBox = document.getElementById("loginBox");
  const libraryBox = document.getElementById("libraryBox");

  if (loginBox) loginBox.style.display = "block";
  if (libraryBox) libraryBox.style.display = "none";
}

async function loadBooks() {
  const booksContainer = document.getElementById("books");
  if (!booksContainer) return;

  const { data, error } = await client
    .from("books")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    booksContainer.innerHTML = "<p>Fehler beim Laden der Bücher.</p>";
    console.error(error);
    return;
  }

  booksContainer.innerHTML = "";

  data.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";

    card.innerHTML = `
      <h3>${book.title ?? ""}</h3>
      <p>Preis: ${Number(book.price ?? 0).toFixed(2)} €</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button onclick="showPreview('${book.preview ?? ""}')">Vorschau</button>
        <button onclick="buyBook('${book.id}', '${book.price ?? ""}')">Kaufen</button>
      </div>
    `;

    booksContainer.appendChild(card);
  });
}

function showPreview(url) {
  if (!url) {
    alert("Keine Vorschau hinterlegt.");
    return;
  }
  window.open(url, "_blank");
}

function buyBook(bookId, price) {
  window.open(`https://paypal.me/Mayer68/${price}`, "_blank");
}

async function checkSession() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  const session = data.session;
  const loginBox = document.getElementById("loginBox");
  const libraryBox = document.getElementById("libraryBox");

  if (session) {
    if (loginBox) loginBox.style.display = "none";
    if (libraryBox) libraryBox.style.display = "block";
    await loadBooks();
  } else {
    if (loginBox) loginBox.style.display = "block";
    if (libraryBox) libraryBox.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", checkSession);
