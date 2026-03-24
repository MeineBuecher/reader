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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJsString(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function showPreview(url) {
  if (!url) {
    alert("Keine Vorschau hinterlegt.");
    return;
  }
  window.open(url, "_blank");
}

function readBook(url) {
  if (!url) {
    alert("Kein Buchlink hinterlegt.");
    return;
  }
  window.open(url, "_blank");
}

function buyBook(bookId, price) {
  if (!bookId) {
    alert("Keine Buch-ID hinterlegt.");
    return;
  }

  alert("Kauf-Funktion folgt als Nächstes. Buch-ID: " + bookId + " | Preis: " + price + " €");
}

function getBookTitle(book) {
  return book.title ?? book.name ?? book.buchtitel ?? "Ohne Titel";
}

function getBookPrice(book) {
  const rawPrice = book.price ?? book.preis ?? book.amount ?? book.betrag ?? null;

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return "";
  }

  const parsed = Number(rawPrice);
  if (Number.isNaN(parsed)) {
    return String(rawPrice);
  }

  return parsed.toFixed(2);
}

function getBookCoverUrl(book) {
  return (
    book.cover_url ??
    book.cover ??
    book.image ??
    book.image_url ??
    book.bild ??
    book.bild_url ??
    book.coverimage ??
    ""
  );
}

function getBookPreviewUrl(book) {
  return (
    book.preview_url ??
    book.preview ??
    book.vorschau ??
    book.vorschau_url ??
    book.preview_link ??
    ""
  );
}

function getBookFileUrl(book) {
  return (
    book.book_url ??
    book.pdf_url ??
    book.file_url ??
    book.datei_url ??
    book.buch_url ??
    book.pdf ??
    book.datei ??
    ""
  );
}

async function loadBooks() {
  if (!booksContainer) return;

  let query = client.from("books").select("*");

  const { data, error } = await query;

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

  const sortedBooks = [...data].sort((a, b) => {
    const titleA = String(getBookTitle(a)).toLowerCase();
    const titleB = String(getBookTitle(b)).toLowerCase();
    return titleA.localeCompare(titleB, "de");
  });

  console.log("Books-Daten:", sortedBooks);

  sortedBooks.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.style.background = "#fff";
    card.style.border = "1px solid #e5e5e5";
    card.style.borderRadius = "10px";
    card.style.padding = "16px";
    card.style.marginBottom = "14px";

    const title = escapeHtml(getBookTitle(book));
    const priceValue = getBookPrice(book);
    const coverUrl = getBookCoverUrl(book);
    const previewUrl = getBookPreviewUrl(book);
    const bookUrl = getBookFileUrl(book);
    const bookId = book.id ?? "";

    let coverHtml = "";
    if (coverUrl) {
      coverHtml = `
        <img
          src="${escapeHtml(coverUrl)}"
          alt="${title}"
          style="max-width:120px; display:block; margin-bottom:12px; border-radius:8px; cursor:pointer;"
          onclick="showPreview('${escapeJsString(coverUrl)}')"
        >
      `;
    }

    const priceHtml = priceValue ? `${escapeHtml(priceValue)} €` : "nicht gefunden";

    card.innerHTML = `
      ${coverHtml}
      <h3>${title}</h3>
      <p>Preis: ${priceHtml}</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" onclick="showPreview('${escapeJsString(previewUrl)}')">Vorschau</button>
        <button type="button" onclick="readBook('${escapeJsString(bookUrl)}')">Lesen</button>
        <button type="button" onclick="buyBook('${escapeJsString(bookId)}', '${escapeJsString(priceValue)}')">Kaufen</button>
      </div>
      <div style="margin-top:10px; font-size:12px; color:#666;">
        Felder gefunden: ${escapeHtml(Object.keys(book).join(", "))}
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
