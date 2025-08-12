
document.addEventListener("DOMContentLoaded", function() {
  const links = Array.from(document.querySelectorAll(".menu a[data-src]"));
  const frame = document.getElementById("contentFrame");
  const defaultSrc = "start.html";

  function setActive(link) { links.forEach(a => a.classList.toggle("active", a === link)); }
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

  // Inject rules + heading spacers after iframe load
  function applyRules(doc) {
    try {
      const style = doc.createElement("style");
      style.textContent = `
        /* Table width rule removed per request */
        /* Icon images scale to font size */
        img.icon, img[role="icon"] { height: 1em !important; width: auto !important; vertical-align: -0.125em !important; }
        /* Images: desktop keep original; mobile auto-resize */
        img:not(.icon):not([role="icon"]) { max-width: unset !important; height: auto !important; }
        @media (max-width: 900px) {
          img:not(.icon):not([role="icon"]) { max-width: 100% !important; height: auto !important; }
        }
        /* Headings spacing: H1=50, H2/H3=30 (first H1 no gap) */
        ._1-1-Heading, ._1-2-Heading, ._1-3-Heading { display:block !important; margin-top:0 !important; }
      `;
      doc.head && doc.head.appendChild(style);

      const addSpacer = (node, px) => {
        // don't double insert
        if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains("vurix-spacer")) return;
        const spacer = doc.createElement("div");
        spacer.className = "vurix-spacer";
        spacer.style.display = "block";
        spacer.style.height = px + "px";
        spacer.style.minHeight = px + "px";
        spacer.style.margin = "0"; spacer.style.padding = "0"; spacer.style.border = "0";
        node.parentNode && node.parentNode.insertBefore(spacer, node);
      };

      // first H1 no gap, rest H1 50px
      const h1s = Array.from(doc.querySelectorAll("._1-1-Heading"));
      h1s.forEach((n,i)=> { if (i>0) addSpacer(n,50); });
      // H2/H3 30px
      const mids = Array.from(doc.querySelectorAll("._1-2-Heading, ._1-3-Heading"));
      mids.forEach(n => addSpacer(n,30));
    } catch (err) {
      console.warn("Could not inject styles into iframe:", err);
    }
  }

  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      applyRules(doc);
    } catch (err) {
      console.warn("Could not inject styles into iframe:", err);
    }
  });

  // initial
  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a => a.getAttribute("data-src") === hash) ? hash : defaultSrc;
  const activeLink = links.find(a => a.getAttribute("data-src") === initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
