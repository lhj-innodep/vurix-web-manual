
document.addEventListener("DOMContentLoaded", function() {
  const links = Array.from(document.querySelectorAll(".menu a[data-src]"));
  const frame = document.getElementById("contentFrame");
  const scaler = document.querySelector(".content-scaler");
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
      const src = a.getAttribute("data-src");
      load(src, a);
      history.replaceState(null, "", "#"+encodeURIComponent(src));
    });
  });

  function injectRules(doc) {
    const style = doc.createElement("style");
    style.textContent = `
      /* Icon images scale to font size */
      img.icon, img[role="icon"] { height: 1em !important; width: auto !important; vertical-align: -0.125em !important; }

      /* Desktop: keep original image sizes; Mobile: responsive images */
      @media (max-width: 900px) {
        img:not(.icon):not([role="icon"]) {
          max-width: 100% !important; height: auto !important; width: auto !important; display: block;
        }
        figure, .figure, .graphics, .image-wrapper { max-width: 100% !important; }
      }

      /* Heading spacings via margins as a base (will also add spacers below to avoid collapsing) */
      ._1-1-Heading, ._1-2-Heading, ._1-3-Heading { display:block !important; }
    `;
    doc.head && doc.head.appendChild(style);

    // Remove inline width/height for images on mobile so CSS can control
    const docWidth = (doc.documentElement.clientWidth || doc.body.clientWidth);
    const isMobile = docWidth <= 900;
    if (isMobile) {
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img => {
        img.removeAttribute('width');
        img.removeAttribute('height');
        if (img.style) { img.style.width = ''; img.style.height = ''; }
      });
    }

    // Heading spacers: 50px for _1-1 (except first = 0), 30px for _1-2 & _1-3
    const addSpacerBefore = (node, px) => {
      if (!node || !node.parentNode) return;
      if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains("vurix-spacer")) return;
      const spacer = doc.createElement("div");
      spacer.className = "vurix-spacer";
      spacer.style.cssText = "display:block;height:"+px+"px;min-height:"+px+"px;line-height:0;margin:0;padding:0;border:0;";
      node.parentNode.insertBefore(spacer, node);
    };
    const h1s = Array.from(doc.querySelectorAll("._1-1-Heading"));
    h1s.forEach((h, idx) => addSpacerBefore(h, idx === 0 ? 0 : 50));
    doc.querySelectorAll("._1-2-Heading, ._1-3-Heading").forEach(h => addSpacerBefore(h, 30));
  }

  function updateFrameSize() {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      const s = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim();
      const scale = s ? parseFloat(s) : 1.5;
      const de = doc.documentElement, b = doc.body;
      const h = Math.max(de.scrollHeight, b.scrollHeight, de.offsetHeight, b.offsetHeight);
      // Set scaler height so that scaled height equals content height => height = h / scale
      scaler.style.height = (h / scale) + "px";
    } catch (e) {}
  }

  // Resize observer inside iframe for dynamic content height
  function observeContent(doc) {
    const ro = new (frame.contentWindow.ResizeObserver || ResizeObserver)(() => updateFrameSize());
    ro.observe(doc.documentElement);
    doc.querySelectorAll('img, table, video, figure').forEach(el => {
      try { ro.observe(el); } catch(e) {}
    });
    // Mutation observer for DOM changes
    const mo = new doc.defaultView.MutationObserver(() => updateFrameSize());
    mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true });
    // Images load
    doc.querySelectorAll('img').forEach(img => img.addEventListener('load', updateFrameSize, { once:false }));
  }

  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      injectRules(doc);
      updateFrameSize();
      observeContent(doc);
    } catch (err) {
      console.warn("Could not process iframe:", err);
    }
  });

  window.addEventListener('resize', updateFrameSize);

  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a => a.getAttribute("data-src") === hash) ? hash : defaultSrc;
  const activeLink = links.find(a => a.getAttribute("data-src") === initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
