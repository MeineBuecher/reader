const books = {
  universum: {
    title: "Das Universum als lebendiges Wesen",
    content: `
      <p>Dies ist die geschützte Leseansicht deines Buches.</p>
      <p>Hier fügst du später den echten Buchtext ein – kapitelweise oder komplett.</p>
      <p>Beispieltext: Das Universum ist nicht nur Raum, nicht nur Materie, nicht nur Bewegung. Es ist Beziehung, Erinnerung und Resonanz.</p>
      <p>Jede Seite dieses Buches kann später in einzelne Abschnitte aufgeteilt werden.</p>
    `
  },
  glauben: {
    title: "Der Mensch und sein Glauben",
    content: `
      <p>Auch dieses Buch wird nur im Reader angezeigt.</p>
      <p>Hier kannst du den Text des zweiten Buches einfügen.</p>
      <p>Beispieltext: Der Mensch glaubt nicht nur mit seinem Kopf. Er glaubt mit seiner Sehnsucht, seiner Angst, seiner Hoffnung und seiner Erinnerung.</p>
    `
  }
};

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

const bookKey = getParam("book");
const buyer = getParam("buyer");
const email = getParam("email");

const book = books[bookKey];

if (!book) {
  document.body.innerHTML = "<div class='reader'><h1>Buch nicht gefunden</h1></div>";
} else {
  document.getElementById("book-title").textContent = book.title;
  document.getElementById("buyer-info").textContent = "Freigeschaltet für: " + buyer + " | " + email;
  document.getElementById("book-content").innerHTML = book.content;

  document.getElementById("watermark").innerHTML =
    buyer + "<br>" + email + "<br>" + new Date().toLocaleDateString("de-DE");
}

// einfache Schutzmaßnahmen
document.addEventListener("contextmenu", event => event.preventDefault());

document.addEventListener("keydown", function (e) {
  const blocked =
    (e.ctrlKey && ["c", "u", "s", "p", "a"].includes(e.key.toLowerCase())) ||
    e.key === "PrintScreen";

  if (blocked) {
    e.preventDefault();
    alert("Diese Funktion ist in der Leseansicht deaktiviert.");
  }
});

document.addEventListener("copy", function (e) {
  e.preventDefault();
});

document.addEventListener("selectstart", function (e) {
  e.preventDefault();
});