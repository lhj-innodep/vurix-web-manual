
document.addEventListener("DOMContentLoaded", function () {
  const links = Array.from(document.querySelectorAll(".topmenu a[data-src]"));
  const frame = document.getElementById("contentFrame");
  const defaultSrc = "start.html";

  function setActive(link) { links.forEach(a=>a.classList.toggle("active", a===link)); }
  function load(src, linkEl) { frame.setAttribute("src", src); if(linkEl) setActive(linkEl); }

  links.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const src = a.getAttribute("data-src");
      load(src, a);
      history.replaceState(null, "", "#"+encodeURIComponent(src));
    });
  });

  function applyHeadingSpacers(doc){
    // Insert spacers: H1-type 50 (except first), H2/H3-type 30
    const addSpacer = (node, px) => {
      if (!node || !node.parentNode) return;
      if (node.previousElementSibling && node.previousElementSibling.classList.contains("vurix-spacer")) return;
      const d = doc.createElement("div");
      d.className = "vurix-spacer";
      d.style.cssText = `display:block;height:${px}px;min-height:${px}px;margin:0;padding:0;border:0;line-height:0;flex-shrink:0;`;
      node.parentNode.insertBefore(d, node);
    };
    const h1s = Array.from(doc.querySelectorAll("._1-1-Heading"));
    h1s.forEach((n,i)=> addSpacer(n, i===0 ? 0 : 50));
    Array.from(doc.querySelectorAll("._1-2-Heading, ._1-3-Heading")).forEach(n=> addSpacer(n, 30));
  }

  function makeImagesResponsiveOnMobile(doc){
    const isMobile = (doc.documentElement.clientWidth || doc.body.clientWidth) <= 900;
    if (!isMobile) return;
    // Remove width/height attributes and inline sizes on general images (not icons)
    doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img => {
      img.removeAttribute("width"); img.removeAttribute("height");
      if (img.style){ img.style.width=""; img.style.height=""; }
    });
    const style = doc.createElement("style");
    style.textContent = `
      @media (max-width:900px){
        img:not(.icon):not([role="icon"]){ max-width:100% !important; height:auto !important; width:auto !important; display:block; }
        figure, .figure, .graphics, .image-wrapper{ max-width:100% !important; }
      }`;
    doc.head.appendChild(style);
  }

  function autoDetectIcons(doc){
    // Icon CSS
    const iconStyle = doc.createElement("style");
    iconStyle.textContent = `img.icon, img[role="icon"]{ height:1em !important; width:auto !important; vertical-align:-0.125em !important; }`;
    doc.head.appendChild(iconStyle);

    const candidates = Array.from(doc.querySelectorAll('img:not(.icon):not([role="icon"])'));
    candidates.forEach(img => {
      const natW = img.naturalWidth || 0;
      const natH = img.naturalHeight || 0;
      const comp = doc.defaultView.getComputedStyle(img);
      const isInline = comp.display === "inline" || comp.display === "inline-block";
      const inText = !!img.closest("p, li, h1, h2, h3, h4, h5, h6");
      // Heuristics: small pixel size OR inline small visual
      if ((natW && natW <= 48 && natH && natH <= 48) || (isInline && inText && (img.height <= 64 || img.width <= 64))) {
        img.classList.add("icon");
        img.setAttribute("role","icon");
        img.removeAttribute("width"); img.removeAttribute("height");
        if (img.style){ img.style.width=""; img.style.height=""; }
      }
    });
  }

  function resizeIframeToContent(){
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      // Compute content height
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body ? doc.body.scrollHeight : 0
      );
      // Account for desktop scale (1.5x): we set iframe CSS height to content height
      frame.style.height = h + "px";
      // Observe changes
      if (window.ResizeObserver){
        const ro = new ResizeObserver(()=>{
          const nh = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
          frame.style.height = nh + "px";
        });
        ro.observe(doc.documentElement);
      }
      // Mutation observer as fallback (images load etc.)
      const mo = new MutationObserver(()=>{
        const nh = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
        frame.style.height = nh + "px";
      });
      mo.observe(doc.documentElement, {subtree:true, childList:true, attributes:true, characterData:true});
    }catch(e){ console.warn("resizeIframeToContent failed", e); }
  }

  frame.addEventListener("load", () => {
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      applyHeadingSpacers(doc);
      makeImagesResponsiveOnMobile(doc);
      autoDetectIcons(doc);
      resizeIframeToContent();
    }catch(e){ console.warn("iframe post-load tasks failed", e); }
  });

  // Initial load
  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const initial = links.find(a=>a.getAttribute("data-src")===hash) ? hash : defaultSrc;
  const activeLink = links.find(a=>a.getAttribute("data-src")===initial);
  if (activeLink) setActive(activeLink);
  load(initial, activeLink);
});
