const SUPABASE_URL = https://wveuqjdnhovwdwlrckwm.supabase.co;
const SUPABASE_KEY = "DEIN_SUPABASE_ANON_KEY";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🟢 Registrierung
async function signUp() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signUp({
    email,
    password
  });

  if (error) {
    alert("Registrierung fehlgeschlagen: " + error.message);
    return;
  }

  alert("Registrierung erfolgreich");
}

// 🔵 Login
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
    return;
  }

  window.location.href = "library.html";
}

// 🔴 Logout
async function logout() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

// 🔐 Nutzer prüfen
async function requireUser() {
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    window.location.href = "index.html";
    return null;
  }

  return data.user;
}

// 📚 Bücher + Käufe laden
async function loadBooksAndPurchases() {
  const user = await requireUser();
  if (!user) return;

  const [{ data: books, error: booksError }, { data: purchases, error: purchasesError }] =
    await Promise.all([
      client.from("books").select("*").eq("is_active", true).order("title"),
      client.from("purchases").select("book_id,status").eq("user_id", user.id)
    ]);

  if (booksError) {
    alert("Fehler beim Laden der Bücher: " + booksError.message);
    return;
  }

  if (purchasesError) {
    alert("Fehler beim Laden der Käufe: " + purchasesError.message);
    return;
  }

  const purchaseMap = new Map();
  (purchases || []).forEach(p => purchaseMap.set(p.book_id, p.status));

  const container = document.getElementById("books");
  container.innerHTML = "";

  books.forEach(book => {

    const status = purchaseMap.get(book.id) || "";
    const coverUrl = `${SUPABASE_URL}/storage/v1/object/public/${book.cover_path}`;

    const card = document.createElement("div");
    card.className = "card";

    let actionHtml = `
      <a class="btn" href="preview.html?slug=${encodeURIComponent(book.slug)}">
        Vorschau lesen
      </a>

      <button class="btn btn-buy"
        onclick="requestPurchase('${book.id}', '${book.title.replace(/'/g, "\\'")}', ${book.price_eur})">
        Kaufen (${Number(book.price_eur).toFixed(2)} €)
      </button>
    `;

    if (status === "pending") {
      actionHtml = `
        <a class="btn" href="preview.html?slug=${encodeURIComponent(book.slug)}">
          Vorschau lesen
        </a>
        <div class="status pending">
          Zahlung angelegt – warte auf Freischaltung
        </div>
      `;
    }

    if (status === "paid") {
      actionHtml = `
        <a class="btn" href="preview.html?slug=${encodeURIComponent(book.slug)}">
          Vorschau lesen
        </a>

        <button class="btn btn-open"
          onclick="openFullBook('${book.slug}')">
          Vollversion öffnen
        </button>

        <div class="status paid">
          Freigeschaltet
        </div>
      `;
    }

    card.innerHTML = `
      <img src="${coverUrl}">
      <h3>${book.title}</h3>
      <p>${book.preview_pages === 10 ? "10 Seiten Vorschau" : "20 Seiten Vorschau"}</p>
      ${actionHtml}
    `;

    container.appendChild(card);
  });
}

// 💳 Kauf anlegen
async function requestPurchase(bookId, title, price) {
  const user = await requireUser();
  if (!user) return;

  const { error } = await client.from("purchases").upsert({
    user_id: user.id,
    book_id: bookId,
    amount_eur: price,
    status: "pending",
    paypal_note: title
  }, {
    onConflict: "user_id,book_id"
  });

  if (error) {
    alert("Kauf konnte nicht angelegt werden: " + error.message);
    return;
  }

  alert("Bitte bei PayPal im Hinweis angeben: " + title);

  window.open(`https://paypal.me/Mayer68/${Number(price).toFixed(2)}`, "_blank");

  loadBooksAndPurchases();
}

// 📖 Vollversion öffnen (geschützt)
async function openFullBook(slug) {
  const user = await requireUser();
  if (!user) return;

  const { data: book, error: bookError } = await client
    .from("books")
    .select("id,title,full_pdf_path")
    .eq("slug", slug)
    .single();

  if (bookError) {
    alert("Buch nicht gefunden.");
    return;
  }

  const { data: purchase, error: purchaseError } = await client
    .from("purchases")
    .select("status")
    .eq("user_id", user.id)
    .eq("book_id", book.id)
    .eq("status", "paid")
    .single();

  if (purchaseError || !purchase) {
    alert("Dieses Buch ist für dich noch nicht freigeschaltet.");
    return;
  }

  const path = book.full_pdf_path.replace(/^full\//, "");

  const { data, error } = await client
    .storage
    .from("full")
    .createSignedUrl(path, 600); // 10 Minuten

  if (error) {
    alert("Fehler beim Laden des Buches: " + error.message);
    return;
  }

  window.open(data.signedUrl, "_blank");
}
