const PRIVATE_BOOKS_BUCKET = "books.private";
const SUPABASE_URL = "https://wveuqjdnhovwdwlrckwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_OptCG7mWpIJhHGMr_1QF4w_IY2bObvs";

const SITE_BASE_URL = "https://meinebuecher.github.io/reader/";

const statusBox = document.getElementById("status");
const loginBox = document.getElementById("loginBox");
const libraryBox = document.getElementById("libraryBox");
const booksContainer = document.getElementById("books");
const authorRequestForm = document.getElementById("authorRequestForm");
const authorRequestStatusBox = document.getElementById("authorRequestStatus");
const logoutBtn = document.getElementById("logoutBtn");

let pendingAction = null;

function setStatus(text) {
  if (statusBox) statusBox.textContent = text;
  console.log(text);
}

function setAuthorRequestStatus(text) {
  if (authorRequestStatusBox) authorRequestStatusBox.textContent = text;
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

function escapeJsString(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildAssetUrl(path) {
  if (!path) return "";

  const cleanPath = String(path).trim();

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  return SITE_BASE_URL + cleanPath.replace(/^\/+/, "");
}

function getBookDescription(book) {
  const title = String(book?.title ?? "").trim();

  const descriptions = {
    "Das freie Hören":
      "Ein Buch über das bewusste Hören in einer Welt voller Stimmen. Es lädt dazu ein, wieder die eigene innere Wahrheit wahrzunehmen.",
    "Das Universum als lebendiges Wesen":
      "Eine tiefgehende Reise durch Bewusstsein, Liebe und die Frage, ob das Universum mehr ist als nur Materie.",
    "Der Mensch und sein Glauben":
      "Ein stiller Blick auf den Glauben des Menschen – jenseits von Grenzen, Institutionen und äußeren Zuschreibungen.",
    "Die 99 Namen Allahs":
      "Eine Annäherung an die 99 Namen Allahs als lebendige Erinnerung, die Herz, Sprache und Alltag miteinander verbindet.",
    "Die neue Gewalt":
      "Ein aufrüttelnder Blick auf die neue Form von Gewalt, die nicht immer sichtbar ist und dennoch tief in unsere Gesellschaft eingreift.",
    "Die Übermittler des Universums":
      "Ein Buch über das, was zwischen den Welten wirkt – über Hinweise, Verbindung und die stillen Impulse des Lebens.",
    "Liebe, das erste Licht":
      "Eine Erinnerung daran, dass Liebe nicht nur Gefühl ist, sondern Ursprung, Bewegung und erste Kraft des Daseins.",
    "Liebe - das erste Licht":
      "Eine Erinnerung daran, dass Liebe nicht nur Gefühl ist, sondern Ursprung, Bewegung und erste Kraft des Daseins.",
    "Meine Quantenethik":
      "Ein neuer Blick auf Verantwortung, Bewusstsein und die Frage, wie Denken, Wahrnehmung und Handeln zusammenwirken."
  };

  return descriptions[title] || "Eine besondere Veröffentlichung auf Meine Buchmesse.";
}

function getEmail() {
  return document.getElementById("email")?.value.trim() || "";
}

function getPassword() {
  return document.getElementById("password")?.value || "";
}

function showLoginForAction(message) {
  if (loginBox) {
    loginBox.style.display = "block";
    loginBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (message) setStatus(message);
}

async function getCurrentUser() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    console.error("Session-Fehler:", error);
    return null;
  }

  return data?.session?.user || null;
}

async function ensureLoggedIn(actionData) {
  const user = await getCurrentUser();

  if (user) {
    return true;
  }

  pendingAction = actionData;
  showLoginForAction("Bitte melde dich an, um zu kaufen oder die Vollversion zu lesen.");
  return false;
}

async function runPendingAction() {
  if (!pendingAction) return;

  const action = pendingAction;
  pendingAction = null;

  if (action.type === "read") {
    await readBook(action.bookId, action.fullPdfPath, true);
    return;
  }

  if (action.type === "buy") {
    await buyBook(action.bookId, action.price, true);
  }
}

async function sendMagicLink(email) {
  const cleanEmail = String(email || "").trim();

  if (!cleanEmail) {
    setStatus("Bitte E-Mail eingeben.");
    return false;
  }

  setStatus("Anmeldelink wird gesendet...");

  const { error } = await client.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: "https://meinebuecher.github.io/reader/"
    }
  });

  if (error) {
    setStatus("Link konnte nicht gesendet werden: " + error.message);
    return false;
  }

  setStatus("Anmeldelink wurde an deine E-Mail gesendet.");
  return true;
}

async function signup() {
  const email = getEmail();

  if (!email) {
    setStatus("Bitte E-Mail eingeben.");
    return;
  }

  await sendMagicLink(email);
}

async function login() {
  const email = getEmail();
  const password = getPassword();

  if (!email) {
    setStatus("Bitte E-Mail eingeben.");
    return;
  }

  if (!password) {
    await sendMagicLink(email);
    return;
  }

  setStatus("Anmeldung wird geprüft...");

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus("Anmeldung fehlgeschlagen: " + error.message);
    return;
  }

  if (loginBox) loginBox.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";
  setStatus("Login erfolgreich.");

  await runPendingAction();
}

async function logout() {
  const { error } = await client.auth.signOut();

  if (error) {
    setStatus("Abmeldung fehlgeschlagen: " + error.message);
    return;
  }

  if (loginBox) loginBox.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";
  setStatus("Abgemeldet. Vorschau bleibt frei sichtbar.");
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
    console.error("Keine gültige Session:", sessionError);
    setStatus("Keine gültige Anmeldung gefunden.");
    return false;
  }

  const userId = sessionData.session.user.id;
  const cleanBookId = String(bookId ?? "").trim();

  console.log("Prüfe Kauf für user_id:", userId, "book_id:", cleanBookId);

  const { data, error } = await client
    .from("purchases")
    .select("id, user_id, book_id, status")
    .eq("user_id", userId)
    .eq("book_id", cleanBookId)
    .eq("status", "paid")
    .maybeSingle();

  if (error) {
    console.error("Fehler bei Kaufprüfung:", error);
    setStatus("Fehler bei Kaufprüfung: " + error.message);
    return false;
  }

  console.log("Kaufprüfung Ergebnis:", data);

  return !!data;
}

async function readBook(bookId, fullPdfPath, skipLoginCheck = false) {
  if (!bookId) {
    alert("Keine Buch-ID hinterlegt.");
    return;
  }

  if (!fullPdfPath) {
    alert("Keine Vollversion hinterlegt.");
    return;
  }

  if (!skipLoginCheck) {
    const loggedIn = await ensureLoggedIn({
      type: "read",
      bookId,
      fullPdfPath
    });

    if (!loggedIn) return;
  }

  const cleanBookId = String(bookId).trim();
  const cleanFullPdfPath = String(fullPdfPath).trim();

  setStatus("Prüfe Freischaltung...");

  const purchased = await hasPurchasedBook(cleanBookId);

  if (!purchased) {
    alert("Dieses Buch ist noch nicht freigeschaltet. Bitte zuerst kaufen.");
    setStatus("Buch nicht freigeschaltet.");
    return;
  }

  setStatus("Freigeschaltet. Geschützter Link wird erstellt...");

  const { data, error } = await client.storage
    .from(PRIVATE_BOOKS_BUCKET)
    .createSignedUrl(cleanFullPdfPath, 300);

  if (error || !data?.signedUrl) {
    console.error("Fehler bei Signed URL:", error);
    alert("Geschützter Zugriff konnte nicht erstellt werden: " + (error?.message || "Unbekannter Fehler"));
    setStatus("Fehler beim Erstellen des geschützten Zugriffs.");
    return;
  }

  setStatus("Buch wird geöffnet...");
  window.open(data.signedUrl, "_blank");
}

async function buyBook(bookId, price, skipLoginCheck = false) {
  if (!bookId) {
    alert("Keine Buch-ID hinterlegt.");
    return;
  }

  if (!price) {
    alert("Kein Preis hinterlegt.");
    return;
  }

  if (!skipLoginCheck) {
    const loggedIn = await ensureLoggedIn({
      type: "buy",
      bookId,
      price
    });

    if (!loggedIn) return;
  }

  setStatus("Weiterleitung zum Kauf...");
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

    const title = escapeHtml(book.title ?? "Ohne Titel");
    const description = escapeHtml(getBookDescription(book));
    const rawPrice = book.price_eur;
    const price =
      rawPrice !== null && rawPrice !== undefined && rawPrice !== ""
        ? Number(rawPrice).toFixed(2).replace(".", ",")
        : "0,00";

    const coverUrl = buildAssetUrl(book.cover_path);
    const previewUrl = buildAssetUrl(book.preview_pdf_path);
    const fullPdfPath = book.full_pdf_path || "";
    const bookId = book.id ?? "";

    const previewUrlEscaped = escapeJsString(previewUrl);
    const fullPdfPathEscaped = escapeJsString(fullPdfPath);
    const bookIdEscaped = escapeJsString(bookId);
    const rawPriceEscaped = escapeJsString(rawPrice ?? "");
    const coverUrlEscaped = escapeHtml(coverUrl);

    const coverHtml = coverUrl
      ? `
        <img
          src="${coverUrlEscaped}"
          alt="${title}"
          class="book-cover"
          onclick="showPreview('${previewUrlEscaped}')"
        >
      `
      : `
        <div class="book-cover" style="display:flex;align-items:center;justify-content:center;background:#e5e7eb;color:#6b7280;">
          Kein Cover
        </div>
      `;

    card.innerHTML = `
      ${coverHtml}
      <div class="book-info">
        <h3 class="book-title">${title}</h3>
        <p class="book-description">${description}</p>
        <div class="book-price">Preis: ${price} €</div>
        <div class="book-buttons">
          <button type="button" onclick="showPreview('${previewUrlEscaped}')">Vorschau</button>
          <button type="button" onclick="readBook('${bookIdEscaped}', '${fullPdfPathEscaped}')">Lesen</button>
          <button type="button" onclick="buyBook('${bookIdEscaped}', '${rawPriceEscaped}')">Kaufen</button>
        </div>
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
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    setStatus("Angemeldet.");
    await runPendingAction();
  } else {
    if (libraryBox) libraryBox.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    setStatus("Bücher frei sichtbar. Anmeldung erst bei Kauf oder Lesen nötig.");
  }
}

async function handleAuthorRequest(event) {
  event.preventDefault();

  const name = document.getElementById("authorName")?.value.trim() || "";
  const email = document.getElementById("authorEmail")?.value.trim() || "";
  const penName = document.getElementById("authorPenName")?.value.trim() || "";
  const project = document.getElementById("authorProject")?.value.trim() || "";
  const reason = document.getElementById("authorReason")?.value.trim() || "";
  const message = document.getElementById("authorMessage")?.value.trim() || "";

  if (!name || !email || !project || !reason) {
    setAuthorRequestStatus("Bitte mindestens Name, E-Mail, Projekt und Begründung ausfüllen.");
    return;
  }

  const subject = encodeURIComponent("Autorenanfrage – Meine Buchmesse");
  const body = encodeURIComponent(
`Name: ${name}
E-Mail: ${email}
Autorenname/Künstlername: ${penName}
Projekt: ${project}

Warum ich als Autor auftreten möchte:
${reason}

Zusätzliche Nachricht:
${message}`
  );

  setAuthorRequestStatus("Dein Mailprogramm wird geöffnet. Dort kannst du die Anfrage direkt absenden.");
  window.location.href = `mailto:DEINE-EMAIL@DOMAIN.DE?subject=${subject}&body=${body}`;
}

window.showPreview = showPreview;
window.readBook = readBook;
window.buyBook = buyBook;

document.addEventListener("DOMContentLoaded", async () => {
  setStatus("DOM geladen, Bücher werden geladen");
  setAuthorRequestStatus("Hier kannst du später eine Autorenanfrage senden.");

  document.getElementById("registerBtn")?.addEventListener("click", signup);
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  authorRequestForm?.addEventListener("submit", handleAuthorRequest);

  await loadBooks();
  await checkSession();
});
