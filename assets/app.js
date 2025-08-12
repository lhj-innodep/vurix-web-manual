
document.addEventListener("DOMContentLoaded", function() {
  const links = Array.from(document.querySelectorAll(".menu a[data-src]"));
  const frame = document.getElementById("contentFrame");
  const defaultSrc = "start.html";

  function setActive(link) {
    links.forEach(a => a.classList.toggle("active", a === link));
  }
  function load(src, linkEl) {
    frame.setAttribute("src", src);
    if (linkEl) setActive(linkEl);
  }

  links.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      load(a.getAttribute("data-src"), a);
      history.replaceState(null, "", "#"+encodeURIComponent(a.getAttribute("data-src")));
    });
  });

  function enhanceIframe(doc) {
    // Inject CSS to normalize tables/images/headings
    const style = doc.createElement("style");
    style.textContent = `
      table { width: 100% !important; border-collapse: collapse !important; }
      img.icon, img[role="icon"] { height: 1em !important; width: auto !important; vertical-align: -0.125em !important; }
      img:not(.icon):not([role="icon"]) { max-width: unset !important; height: auto !important; }
      ._1-1-Heading, ._1-2-Heading, ._1-3-Heading { display:block !important; margin-top:0 !important; }
      /* no divider for _1-1-Heading */
    `;
    doc.head && doc.head.appendChild(style);

    // First _1-1-Heading no gap
    const h1s = doc.querySelectorAll("._1-1-Heading");
    if (h1s.length > 0) { h1s[0].style.marginTop = "0"; }

    // Spacer DIV (50px) before _1-2 and _1-3 to ensure exact spacing
    const addSpacer = (node) => {
      if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains("vurix-spacer")) return;
      const spacer = doc.createElement("div");
      spacer.className = "vurix-spacer";
      Object.assign(spacer.style, {
        display: "block",
        height: "50px",
        minHeight: "50px",
        lineHeight: "0",
        padding: "0", margin: "0", border: "0", flexShrink: "0"
      });
      node.parentNode && node.parentNode.insertBefore(spacer, node);
    };
    doc.querySelectorAll("._1-2-Heading, ._1-3-Heading").forEach(addSpacer);
  }

  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      enhanceIframe(doc);
    } catch (err) {
      console.warn("Could not inject styles into iframe:", err);
    }
  });

  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a => a.getAttribute("data-src") === hash) ? hash : defaultSrc;
  const activeLink = links.find(a => a.getAttribute("data-src") === initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
