const BOOK_PASSWORDS = {
  "universum": "UNI-2026-ATILA",
  "glauben": "GLAUBEN-2026-ATILA",
  "namen-allahs": "99NAMEN-2026-ATILA",
  "uebermittler": "UEBERMITTLER-2026-ATILA",
  "liebe": "LIEBE-2026-ATILA",
  "neue-gewalt": "GEWALT-2026-ATILA",
  "quantenethik": "QUANTENETHIK-2026-ATILA",
  "freies-hoeren": "FREIESHOEREN-2026-ATILA"
};

function unlockBook(bookKey) {
  const input = document.getElementById("pw-" + bookKey);
  const gate = document.getElementById("gate-" + bookKey);
  const reader = document.getElementById("reader-" + bookKey);
  const error = document.getElementById("error-" + bookKey);

  if (!input || !gate || !reader || !error) return;

  const value = input.value.trim();

  if (value === BOOK_PASSWORDS[bookKey]) {
    localStorage.setItem("book-access-" + bookKey, "ok");
    gate.style.display = "none";
    reader.style.display = "block";
    error.style.display = "none";
  } else {
    error.style.display = "block";
  }
}

function restoreBookAccess(bookKey) {
  const gate = document.getElementById("gate-" + bookKey);
  const reader = document.getElementById("reader-" + bookKey);

  if (!gate || !reader) return;

  if (localStorage.getItem("book-access-" + bookKey) === "ok") {
    gate.style.display = "none";
    reader.style.display = "block";
  } else {
    gate.style.display = "block";
    reader.style.display = "none";
  }
}
