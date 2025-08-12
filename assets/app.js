
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("contentFrame");
  const links = Array.from(document.querySelectorAll(".topmenu a[data-src]"));
  const defaultSrc = "start.html";

  function setActive(link) {
    links.forEach(a => a.classList.toggle("active", a === link));
  }
  function load(src, linkEl) {
    if (!src) return;
    frame.setAttribute("src", src);
    if (linkEl) setActive(linkEl);
    history.replaceState(null, "", "#"+encodeURIComponent(src));
  }

  links.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      load(a.getAttribute("data-src"), a);
    });
  });

  // Resize iframe height to fit its content (body-only scroll)
  function resizeFrame() {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      const root = doc.documentElement;
      const body = doc.body;
      const h = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight);
      const scale = window.matchMedia("(min-width: 901px)").matches ? 1.5 : 1.0;
      frame.style.height = (h / scale) + "px";
    } catch (e) {}
  }

  let ro, mo;
  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;

      // Inject base CSS for icons/images/headings
      const base = doc.createElement("style");
      base.textContent = `
        /* ICONS: stay 1em */
        img.icon, img[role="icon"] {
          height: 1em !important; width: auto !important; vertical-align: -0.125em !important;
        }
        /* Desktop: keep original size for general images */
        @media (min-width: 901px) {
          img:not(.icon):not([role="icon"]) {
            max-width: unset !important; height: auto !important;
          }
        }
        /* Mobile: responsive general images */
        @media (max-width: 900px) {
          img:not(.icon):not([role="icon"]) {
            max-width: 100% !important; height: auto !important; width: auto !important; display: block;
          }
        }
      `;
      doc.head && doc.head.appendChild(base);

      // MOBILE: remove inline width/height on general images for consistent sizing
      const docWidth = (doc.documentElement.clientWidth || doc.body.clientWidth);
      const isMobile = docWidth <= 900;
      if (isMobile) {
        doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img => {
          img.removeAttribute('width'); img.removeAttribute('height');
          if (img.style) { img.style.width = ''; img.style.height = ''; }
        });
      }

      // AUTO ICON DETECTION (for images missing .icon)
      const isInlineContext = (el) => {
        if (!el) return false;
        const p = el.closest('p, li, h1, h2, h3, h4, h5, h6');
        return !!p;
      };
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img => {
        const nw = img.naturalWidth || 0, nh = img.naturalHeight || 0;
        const cw = img.clientWidth || 0, ch = img.clientHeight || 0;
        if ((nw && nh && (nw <= 48 && nh <= 48)) || (isInlineContext(img) && (Math.max(cw, ch) <= 64))) {
          img.classList.add('icon'); img.setAttribute('role','icon');
        }
      });

      // HEADING SPACERS (H1 50 top except first; H2/H3 30)
      const addSpacerBefore = (node, px) => {
        if (!node || !node.parentNode) return;
        if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains('vurix-spacer')) return;
        const s = doc.createElement('div');
        s.className = 'vurix-spacer'; s.style.display = 'block'; s.style.height = px+'px'; s.style.minHeight = px+'px';
        node.parentNode.insertBefore(s, node);
      };
      const h1s = Array.from(doc.querySelectorAll('._1-1-Heading'));
      if (h1s.length) {
        // First H1: no gap
        h1s.slice(1).forEach(h => addSpacerBefore(h, 50));
      }
      // Middle titles
      doc.querySelectorAll('._1-2-Heading, ._1-3-Heading').forEach(n => addSpacerBefore(n, 30));

      // DESKTOP: Equalize general images per container-row (same height)
      function equalizeDesktopImages() {
        if (window.matchMedia("(min-width: 901px)").matches) {
          const containers = Array.from(doc.querySelectorAll('div, section, figure, p'))
            .filter(el => el.querySelectorAll('img:not(.icon):not([role="icon"])').length >= 2);
          containers.forEach(el => {
            const imgs = Array.from(el.querySelectorAll('img:not(.icon):not([role="icon"])'));
            // Only consider images that are visually on the same row (rough heuristic: near the same top position)
            const rows = {};
            imgs.forEach(img => {
              const top = img.getBoundingClientRect().top;
              const key = Math.round(top/10); // bucketize by 10px
              rows[key] = rows[key] || [];
              rows[key].push(img);
            });
            Object.values(rows).forEach(rowImgs => {
              if (rowImgs.length < 2) return;
              const minH = Math.min(...rowImgs.map(i => i.naturalHeight || i.clientHeight || 0));
              rowImgs.forEach(i => { i.style.height = minH + "px"; i.style.width = "auto"; });
            });
          });
        }
      }

      equalizeDesktopImages();

      // Observe size/DOM changes to keep iframe height synced
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      try {
        ro = new ResizeObserver(() => { resizeFrame(); });
        ro.observe(doc.documentElement);
      } catch(e){}
      try {
        mo = new MutationObserver(() => { resizeFrame(); });
        mo.observe(doc.documentElement, {childList:true, subtree:true});
      } catch(e){}

      // Initial resize
      resizeFrame();
    } catch (e) {
      console.warn("iframe init failed", e);
    }
  });

  // Initial route
  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a => a.getAttribute("data-src") === hash) ? hash : defaultSrc;
  const activeLink = links.find(a => a.getAttribute("data-src") === initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
