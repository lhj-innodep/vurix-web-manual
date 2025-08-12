
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("contentFrame");
  const links = Array.from(document.querySelectorAll(".topmenu a[data-src]"));
  const defaultSrc = "start.html";
  const header = document.querySelector(".header");
  const main = document.querySelector(".main");

  function syncHeaderHeight(){
    const h = header.getBoundingClientRect().height;
    main.style.setProperty("--header-h", h + "px");
  }
  window.addEventListener("resize", syncHeaderHeight);
  syncHeaderHeight();

  function setActive(link){ links.forEach(a => a.classList.toggle("active", a===link)); }
  function load(src, linkEl){
    frame.setAttribute("src", src);
    if (linkEl) setActive(linkEl);
    history.replaceState(null, "", "#"+encodeURIComponent(src));
  }
  links.forEach(a => a.addEventListener("click", e => { e.preventDefault(); load(a.getAttribute("data-src"), a);}));

  function resizeFrame(){
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      const root = doc.documentElement, body = doc.body;
      const h = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight);
      const scale = window.matchMedia("(min-width: 901px)").matches ? 1.5 : 1.0;
      frame.style.height = (h / scale) + "px";
    }catch(e){}
  }

  frame.addEventListener("load", () => {
    const doc = frame.contentDocument || frame.contentWindow.document;
    if (!doc) return;

    // Ensure inner document does not create its own scrollbars
    const reset = doc.createElement("style");
    reset.textContent = `html, body { overflow: visible !important; }`;
    doc.head && doc.head.appendChild(reset);

    // Base styles
    const base = doc.createElement("style");
    base.textContent = `
      img.icon, img[role="icon"]{ height:1em !important; width:auto !important; vertical-align:-0.125em !important; }
      @media (min-width:901px){ img:not(.icon):not([role="icon"]){ max-width:unset !important; height:auto !important; } }
      @media (max-width:900px){ img:not(.icon):not([role="icon"]){ max-width:100% !important; height:auto !important; width:auto !important; display:block; } }
    `;
    doc.head && doc.head.appendChild(base);

    // Mobile: strip inline sizes
    const isMobile = (doc.documentElement.clientWidth||doc.body.clientWidth) <= 900;
    if (isMobile){
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
        img.removeAttribute('width'); img.removeAttribute('height');
        if (img.style){ img.style.width=''; img.style.height=''; }
      });
    }

    // Auto icon detection
    const isInline = el => !!el.closest('p,li,h1,h2,h3,h4,h5,h6');
    doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
      const nw = img.naturalWidth||0, nh = img.naturalHeight||0;
      const cw = img.clientWidth||0, ch = img.clientHeight||0;
      const src = (img.getAttribute('src')||'').toLowerCase();
      if ((nw && nh && nw<=48 && nh<=48) || (isInline(img) && Math.max(cw,ch)<=64) || /icon|ico|note|참고/.test(src)){
        img.classList.add('icon'); img.setAttribute('role','icon');
      }
    });

    // Heading spacers
    const addSpacer = (node, px)=>{
      if (!node || !node.parentNode) return;
      if (node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains('vurix-spacer')) return;
      const s = doc.createElement('div'); s.className='vurix-spacer';
      s.style.cssText = `display:block;height:${px}px;min-height:${px}px;`;
      node.parentNode.insertBefore(s, node);
    };
    const h1s = Array.from(doc.querySelectorAll('._1-1-Heading'));
    if (h1s.length){ h1s.slice(1).forEach(h=>addSpacer(h,50)); }
    doc.querySelectorAll('._1-2-Heading, ._1-3-Heading').forEach(n=>addSpacer(n,30));

    // Desktop equalize images per row (improved: bucket by offsetTop and rerun after image loads)
    function equalize(){
      if (!window.matchMedia("(min-width: 901px)").matches) return;
      const imgs = Array.from(doc.querySelectorAll('img:not(.icon):not([role="icon"])'));
      // Group by parent element first (common case: images are siblings)
      const parents = new Map();
      imgs.forEach(img => {
        const p = img.parentElement;
        if (!parents.has(p)) parents.set(p, []);
        parents.get(p).push(img);
      });
      parents.forEach(group => {
        if (group.length < 2) return;
        // Further bucket by vertical position using offsetTop (not affected by transforms of outer doc)
        const rows = {};
        group.forEach(img => {
          const top = img.offsetTop;
          const key = Math.round(top/8); // tighter buckets
          (rows[key] ||= []).push(img);
        });
        Object.values(rows).forEach(row => {
          if (row.length < 2) return;
          // Use minimal naturalHeight among loaded images; fallback to current clientHeight
          const heights = row.map(i => (i.naturalHeight || i.clientHeight || 0)).filter(h=>h>0);
          if (!heights.length) return;
          const minH = Math.min(*heights);
          row.forEach(i => { i.style.height = minH + "px"; i.style.width = "auto"; });
        });
      });
    }

    // Re-equalize after each image load
    doc.querySelectorAll('img').forEach(img => {
      img.addEventListener('load', () => { equalize(); resizeFrame(); }, { once:false });
    });

    // Observe document changes
    let ro, mo;
    try{ ro = new ResizeObserver(()=>{ equalize(); resizeFrame(); }); ro.observe(doc.documentElement);}catch(e){}
    try{ mo = new MutationObserver(()=>{ equalize(); resizeFrame(); }); mo.observe(doc.documentElement,{childList:true,subtree:true}); }catch(e){}

    // Initial
    equalize();
    resizeFrame();
  });

  // Initial route
  const hash = decodeURIComponent((location.hash||"").replace(/^#/, ""));
  const target = links.find(a => a.getAttribute("data-src")===hash) ? hash : defaultSrc;
  const active = links.find(a => a.getAttribute("data-src")===target);
  if (active) setActive(active);
  load(target, active);
});
