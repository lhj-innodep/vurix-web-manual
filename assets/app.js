
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("contentFrame");
  const links = Array.from(document.querySelectorAll(".topmenu a[data-src]"));
  const defaultSrc = "start.html";

  function setActive(link) { links.forEach(a => a.classList.toggle("active", a === link)); }
  function load(src, linkEl) {
    if (!src) return;
    frame.setAttribute("src", src);
    if (linkEl) setActive(linkEl);
    history.replaceState(null, "", "#"+encodeURIComponent(src));
  }

  links.forEach(a => a.addEventListener("click", (e) => { e.preventDefault(); load(a.dataset.src, a); }));

  // Resize iframe height to fit content (body-only scroll)
  function resizeFrame() {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      const root = doc.documentElement, body = doc.body;
      const h = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight);
      const scale = window.matchMedia("(min-width: 901px)").matches ? 1.5 : 1.0;
      frame.style.height = (h / scale) + "px";
    } catch(e) {}
  }

  let ro, mo;
  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;

      // Base CSS
      const base = doc.createElement("style");
      base.textContent = `
        /* ICONS stay 1em */
        img.icon, img[role="icon"] { height: 1em !important; width: auto !important; vertical-align: -0.125em !important; }
        /* Desktop: keep original for general images */
        @media (min-width: 901px) {
          img:not(.icon):not([role="icon"]) { max-width: unset !important; height: auto !important; }
        }
        /* Mobile: responsive general images */
        @media (max-width: 900px) {
          img:not(.icon):not([role="icon"]) { max-width: 100% !important; height: auto !important; width: auto !important; display:block; }
        }
      `;
      doc.head && doc.head.appendChild(base);

      // MOBILE: remove width/height attributes for general images
      const docWidth = (doc.documentElement.clientWidth || doc.body.clientWidth);
      const isMobile = docWidth <= 900;
      if (isMobile) {
        doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img => {
          img.removeAttribute('width'); img.removeAttribute('height');
          if (img.style) { img.style.width=''; img.style.height=''; }
        });
      }

      // AUTO ICON DETECTION
      const isInlineContext = (el) => !!el.closest('p, li, h1, h2, h3, h4, h5, h6');
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img => {
        const nw = img.naturalWidth || 0, nh = img.naturalHeight || 0;
        const cw = img.clientWidth || 0, ch = img.clientHeight || 0;
        if ((nw && nh && (nw <= 48 && nh <= 48)) || (isInlineContext(img) && Math.max(cw, ch) <= 64)) {
          img.classList.add('icon'); img.setAttribute('role','icon');
        }
      });

      // HEADING SPACERS: H1 top 50 (except first=0), H2/H3 top 30
      const addSpacerBefore = (node, px) => {
        if (!node || !node.parentNode) return;
        if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains('vurix-spacer')) return;
        const s = doc.createElement('div');
        s.className = 'vurix-spacer'; s.style.display='block'; s.style.height=px+'px'; s.style.minHeight=px+'px';
        node.parentNode.insertBefore(s, node);
      };
      const h1s = Array.from(doc.querySelectorAll('._1-1-Heading'));
      if (h1s.length) { h1s.slice(1).forEach(h => addSpacerBefore(h, 50)); }
      doc.querySelectorAll('._1-2-Heading, ._1-3-Heading').forEach(n => addSpacerBefore(n, 30));

      // DESKTOP: Equalize images per row
      function equalizeDesktopImages() {
        if (!window.matchMedia("(min-width: 901px)").matches) return;
        const imgs = Array.from(doc.querySelectorAll('img:not(.icon):not([role="icon"])'));
        // build rows by top position
        const rows = {};
        imgs.forEach(img => {
          const rect = img.getBoundingClientRect();
          const key = Math.round(rect.top/10);
          (rows[key] ||= []).push(img);
        });
        Object.values(rows).forEach(rowImgs => {
          if (rowImgs.length < 2) return;
          const minH = Math.min(...rowImgs.map(i => i.naturalHeight || i.clientHeight || 0));
          rowImgs.forEach(i => { i.style.height = minH + 'px'; i.style.width = 'auto'; });
        });
      }
      equalizeDesktopImages();

      // Observe to keep height synced
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      try { ro = new ResizeObserver(resizeFrame); ro.observe(doc.documentElement); } catch(e){}
      try { mo = new MutationObserver(resizeFrame); mo.observe(doc.documentElement, {childList:true, subtree:true}); } catch(e){}

      resizeFrame();
    } catch(e) {
      console.warn("iframe init failed", e);
    }
  });

  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a => a.getAttribute("data-src") === hash) ? hash : defaultSrc;
  const activeLink = links.find(a => a.getAttribute("data-src") === initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
