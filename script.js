function loadPage(page) {
  fetch(page)
    .then(res => res.text())
    .then(html => {
      document.getElementById("content-area").innerHTML = html;
    });
}