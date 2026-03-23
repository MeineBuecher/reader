function checkCode() {
  const code = document.getElementById("code").value.trim().toUpperCase();

  const codes = {
    "UNI2026": {
      book: "universum",
      buyer: "Demo Käufer",
      email: "demo@beispiel.de"
    },
    "GLAUBEN2026": {
      book: "glauben",
      buyer: "Demo Käufer",
      email: "demo@beispiel.de"
    }
  };

  if (codes[code]) {
    const data = codes[code];
    const url =
      "reader.html?book=" + encodeURIComponent(data.book) +
      "&buyer=" + encodeURIComponent(data.buyer) +
      "&email=" + encodeURIComponent(data.email);

    window.location.href = url;
  } else {
    alert("Falscher Zugangscode");
  }
}