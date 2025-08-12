
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("contentFrame");
  const links = Array.from(document.querySelectorAll(".topmenu a[data-src]"));
  const defaultSrc = "start.html";

  function setActive(link){ links.forEach(a=>a.classList.toggle("active", a===link)); }
  function load(src, linkEl){
    if(!src) return;
    frame.setAttribute("src", src);
    if(linkEl) setActive(linkEl);
    history.replaceState(null,"","#"+encodeURIComponent(src));
    document.querySelector(".badge").textContent = "r10 · " + src;
  }

  links.forEach(a=>a.addEventListener("click", e=>{ e.preventDefault(); load(a.getAttribute("data-src"), a); }));

  // Header height sync so content never goes under
  function syncHeaderHeight(){
    const h = document.querySelector(".header").getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-h", h+"px");
  }
  window.addEventListener("resize", syncHeaderHeight);
  syncHeaderHeight();

  // Iframe auto-height => single (body) scrollbar
  function resizeFrame(){
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if(!doc) return;
      const root = doc.documentElement, body=doc.body;
      const h = Math.max(root.scrollHeight, body.scrollHeight, root.offsetHeight, body.offsetHeight);
      const scale = window.matchMedia("(min-width: 901px)").matches ? 1.5 : 1.0;
      frame.style.height = (h/scale) + "px";
    }catch(e){}
  }
  let ro, mo;

  frame.addEventListener("load", () => {
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if(!doc) return;

      // Base CSS: icons + images + headings
      const style = doc.createElement("style");
      style.textContent = `
        /* Icons */
        img.icon, img[role="icon"] { height:1em !important; width:auto !important; vertical-align:-0.125em !important; }
        /* General images */
        @media(min-width:901px){
          img:not(.icon):not([role="icon"]) { max-width:unset !important; height:auto !important; }
        }
        @media(max-width:900px){
          img:not(.icon):not([role="icon"]) { max-width:100% !important; height:auto !important; width:auto !important; display:block; }
        }
      `;
      doc.head && doc.head.appendChild(style);

      // MOBILE: remove inline sizes for general images
      const isMobile = (doc.documentElement.clientWidth || doc.body.clientWidth) <= 900;
      if(isMobile){
        doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
          img.removeAttribute('width'); img.removeAttribute('height');
          if(img.style){ img.style.width=''; img.style.height=''; }
        });
      }

      // AUTO ICON DETECTION (includes '참고' note icon)
      const isInline = el => !!el.closest('p, li, h1, h2, h3, h4, h5, h6, .note, .참고');
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
        const nw=img.naturalWidth||0, nh=img.naturalHeight||0;
        const cw=img.clientWidth||0, ch=img.clientHeight||0;
        const src=(img.getAttribute('src')||'').toLowerCase();
        const nameMatch = /icon|ico|note|참고/.test(src);
        if(nameMatch || (nw&&nh&&(nw<=48&&nh<=48)) || (isInline(img) && Math.max(cw,ch)<=64)){
          img.classList.add('icon'); img.setAttribute('role','icon');
        }
      });

      // Heading spacers: H1 50 (except first), H2/H3 30
      const addSpacerBefore = (node, px) => {
        if(!node || !node.parentNode) return;
        if(node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains('vurix-spacer')) return;
        const s = doc.createElement('div'); s.className='vurix-spacer'; s.style.cssText=`display:block;height:${px}px;min-height:${px}px;`;
        node.parentNode.insertBefore(s, node);
      };
      const h1s = Array.from(doc.querySelectorAll('._1-1-Heading'));
      if(h1s.length){ h1s.slice(1).forEach(h=>addSpacerBefore(h,50)); }
      doc.querySelectorAll('._1-2-Heading, ._1-3-Heading').forEach(n=>addSpacerBefore(n,30));

      // DESKTOP equalize: same-row general images -> same min height
      function equalizeDesktop(){
        if(!window.matchMedia("(min-width: 901px)").matches) return;
        const containers = Array.from(doc.querySelectorAll('div, section, figure, p'))
          .filter(el => el.querySelectorAll('img:not(.icon):not([role="icon"])').length>=2);
        containers.forEach(el=>{
          const imgs = Array.from(el.querySelectorAll('img:not(.icon):not([role="icon"])'));
          const rows = {};
          imgs.forEach(img=>{
            const rect = img.getBoundingClientRect();
            const key = Math.round(rect.top/12);
            (rows[key] = rows[key] || []).push(img);
          });
          Object.values(rows).forEach(row=>{
            if(row.length<2) return;
            const minH = Math.min(...row.map(i=>i.naturalHeight||i.clientHeight||0));
            row.forEach(i=>{ i.style.height = minH+'px'; i.style.width='auto'; });
          });
        });
      }
      equalizeDesktop();

      // Observe changes
      if(ro) ro.disconnect(); if(mo) mo.disconnect();
      try{ ro = new ResizeObserver(()=>{ resizeFrame(); }); ro.observe(doc.documentElement); }catch(e){}
      try{ mo = new MutationObserver(()=>{ resizeFrame(); equalizeDesktop(); }); mo.observe(doc.documentElement,{childList:true,subtree:true}); }catch(e){}

      resizeFrame();
      syncHeaderHeight();
    }catch(e){ console.warn("iframe init failed", e); }
  });

  // Initial route
  const hash = decodeURIComponent((location.hash||"").replace(/^#/,""));
  const initial = links.find(a=>a.getAttribute("data-src")===hash)?hash:defaultSrc;
  const activeLink = links.find(a=>a.getAttribute("data-src")===initial);
  if(activeLink) setActive(activeLink);
  load(initial, activeLink);
});
