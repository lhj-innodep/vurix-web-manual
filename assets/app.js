
// Menu and iframe logic
document.addEventListener("DOMContentLoaded", function() {
  const links = Array.from(document.querySelectorAll(".menu a[data-src]"));
  const frame = document.getElementById("contentFrame");
  const defaultSrc = "start.html";

  function applyHeadingSpacers(doc) {
    try {
      // Ensure strong CSS for spacers
      const style2 = doc.createElement("style");
      style2.textContent = `
        .vurix-spacer { display:block !important; height:200px !important; min-height:200px !important; line-height:0 !important; padding:0 !important; margin:0 !important; border:0 !important; }
        ._1-1-Heading, ._1-2-Heading, ._1-3-Heading { display:block !important; margin-top:0 !important; }
      `;
      doc.head && doc.head.appendChild(style2);

      const isTarget = (el) => {
        if (!el || !el.className) return false;
        const cn = (typeof el.className === "string") ? el.className : (el.className.baseVal || ""); // SVG safety
        return cn.split(/\s+/).some(c => c === "_1-2-Heading" || c === "_1-3-Heading");
      };

      const nodes = Array.from(doc.querySelectorAll('[class*="_1-2-Heading"], [class*="_1-3-Heading"]')).filter(isTarget);

      nodes.forEach(node => {
        // Skip if spacer already there
        if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains("vurix-spacer")) return;

        const spacer = doc.createElement("div");
        spacer.className = "vurix-spacer";
        // Insert before node
        if (node.parentNode) {
          node.parentNode.insertBefore(spacer, node);
        }
      });
      console.log("[VURIX] Spacers inserted:", nodes.length);
    } catch (e) {
      console.warn("[VURIX] Spacer injection failed", e);
    }
  }


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

  // On iframe load, inject CSS rules and enforce spacings
  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      const style = doc.createElement("style");
      style.textContent = `
        /* Tables expand to content width */
        table { width: 100% !important; border-collapse: collapse !important; }
        /* Icon images scale to font size */
        img.icon, img[role="icon"] { height: 1em !important; width: auto !important; vertical-align: -0.125em !important; }
        /* Keep normal images at original size (no max-width forced) */
        img:not(.icon):not([role="icon"]) { max-width: unset !important; height: auto !important; }
        /* Headings baseline */
        ._1-1-Heading, ._1-2-Heading, ._1-3-Heading { display: block !important; }
        ._1-1-Heading { margin-top: 0 !important; }
        ._1-2-Heading, ._1-3-Heading { margin-top: 0 !important; }
      `;
      doc.head && doc.head.appendChild(style);

      // --- HARD ENFORCEMENT: Insert spacer elements before headings ---
      const addSpacerBefore = (el, px) => {
        if (!el || px <= 0) return;
        // Avoid duplicate spacers
        if (el.previousElementSibling && el.previousElementSibling.hasAttribute("data-vurix-spacer")) return;
        const spacer = doc.createElement("div");
        spacer.setAttribute("data-vurix-spacer", "true");
        spacer.style.height = px + "px"; spacer.style.minHeight = px + "px"; spacer.style.display = "block"; spacer.style.flexShrink = "0";
        spacer.style.width = "100%";
        spacer.style.pointerEvents = "none";
        spacer.style.border = "0";
        spacer.style.padding = "0";
        spacer.style.margin = "0";
        spacer.style.background = "transparent";
        el.parentNode && el.parentNode.insertBefore(spacer, el);
      };

      // First top-level _1-1-Heading should not have extra gap (spec requirement)
      const h1s = Array.from(doc.querySelectorAll("._1-1-Heading"));
      if (h1s.length > 0) {
        // Ensure first one has no previous spacer
        const first = h1s[0];
        if (first.previousElementSibling && first.previousElementSibling.hasAttribute("data-vurix-spacer")) {
          first.previousElementSibling.remove();
        }
        first.style.marginTop = "0";
        first.style.paddingTop = "0";
      }

      // Apply spacers to _1-2 and _1-3
      Array.from(doc.querySelectorAll("._1-2-Heading")).forEach(el => addSpacerBefore(el, 200));
      Array.from(doc.querySelectorAll("._1-3-Heading")).forEach(el => addSpacerBefore(el, 150));

    } catch (err) {
      console.warn("Could not inject styles into iframe:", err);
    }
    applyHeadingSpacers(frame.contentDocument || frame.contentWindow.document);
  });

  // Initial load: hash or default
  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a => a.getAttribute("data-src") === hash) ? hash : defaultSrc;
  const activeLink = links.find(a => a.getAttribute("data-src") === initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
