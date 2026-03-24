const SUPABASE_URL = "https://wveuqjdnhovwdwlrckwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_OptCG7mWpIJhHGMr_1QF4w_IY2bObvs";

const SITE_BASE_URL = "https://meinebuecher.github.io/reader/";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildAssetUrl(path) {
  if (!path) return "";

  const cleanPath = String(path).trim();

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  return SITE_BASE_URL + cleanPath.replace(/^\/+/, "");
}

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
  if (loginBox) loginBox.style.display = "none";
  if (libraryBox) libraryBox.style.display = "block";
  await loadBooks();
}

async function logout() {
  const { error } = await client.auth.signOut();

  if (error) {
    setStatus("Abmeldung fehlgeschlagen: " + error.message);
    return;
  }

  if (loginBox) loginBox.style.display = "block";
  if (libraryBox) libraryBox.style.display = "none";
  setStatus("Abgemeldet.");
}

function showPreview(url) {
  if (!url) {
    alert("Keine Vorschau hinterlegt.");
    return;
  }
  window.open(url, "_blank");
}

async function hasPurchasedBook(bookId) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError || !sessionData?.session?.user) {
    return false;
  }

  const userId = sessionData.session.user.id;

  const { data, error } = await client
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .limit(1);

  if (error) {
    console.error("Fehler bei Kaufprüfung:", error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

async function readBook(bookId, fullBookUrl) {
  if (!bookId) {
    alert("Keine Buch-ID hinterlegt.");
    return;
  }

  if (!fullBookUrl) {
    alert("Keine Buchdatei hinterlegt.");
    return;
  }

  const purchased = await hasPurchasedBook(bookId);

  if (!purchased) {
    alert("Dieses Buch ist noch nicht freigeschaltet. Bitte zuerst kaufen.");
    return;
  }

  window.open(fullBookUrl, "_blank");
}

function buyBook(bookId, price) {
  if (!bookId) {
    alert("Keine Buch-ID hinterlegt.");
    return;
  }

  if (!price) {
    alert("Kein Preis hinterlegt.");
    return;
  }

  // Vorläufig: PayPal-Link öffnen
  // Du kannst später pro Buch eigene Links hinterlegen
  window.open(`https://paypal.me/Mayer68/${price}`, "_blank");
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
    card.className = "book-card";
    card.style.background = "#fff";
    card.style.border = "1px solid #e5e5e5";
    card.style.borderRadius = "10px";
    card.style.padding = "16px";
    card.style.marginBottom = "14px";

    const title = escapeHtml(book.title ?? "Ohne Titel");
    const rawPrice = book.price_eur;
    const price =
      rawPrice !== null && rawPrice !== undefined && rawPrice !== ""
        ? Number(rawPrice).toFixed(2)
        : "0.00";

    const coverUrl = buildAssetUrl(book.cover_path);
    const previewUrl = buildAssetUrl(book.preview_pdf_path);

    // Hier brauchst du in deiner books-Tabelle noch eine Spalte für die Vollversion
    const fullBookUrl = buildAssetUrl(book.book_pdf_path || "");

    const bookId = book.id ?? "";

    let coverHtml = "";
    if (coverUrl) {
      coverHtml = `
        <img
          src="${escapeHtml(coverUrl)}"
          alt="${title}"
          style="max-width:120px; display:block; margin-bottom:12px; border-radius:8px; cursor:pointer;"
          onclick="showPreview('${String(coverUrl).replace(/'/g, "\\'")}')"
        >
      `;
    }

    card.innerHTML = `
      ${coverHtml}
      <h3>${title}</h3>
      <p>Preis: ${price} €</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" onclick="showPreview('${String(previewUrl).replace(/'/g, "\\'")}')">Vorschau</button>
        <button type="button" onclick="readBook('${String(bookId).replace(/'/g, "\\'")}', '${String(fullBookUrl).replace(/'/g, "\\'")}')">Lesen</button>
        <button type="button" onclick="buyBook('${String(bookId).replace(/'/g, "\\'")}', '${String(rawPrice ?? "").replace(/'/g, "\\'")}')">Kaufen</button>
      </div>
    `;

    booksContainer.appendChild(card);
  });

  setStatus("Bücher geladen.");
}

async function checkSession() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    setStatus("Session-Fehler: " + error.message);
    return;
  }

  if (data.session) {
    if (loginBox) loginBox.style.display = "none";
    if (libraryBox) libraryBox.style.display = "block";
    setStatus("Bereits eingeloggt.");
    await loadBooks();
  } else {
    if (loginBox) loginBox.style.display = "block";
    if (libraryBox) libraryBox.style.display = "none";
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
