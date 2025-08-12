
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("contentFrame");
  const links = Array.from(document.querySelectorAll(".topmenu a[data-src]"));
  const defaultSrc = "start.html";
  const header = document.querySelector(".header");

  function updateHeaderOffset(){
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-h", h + "px");
  }
  window.addEventListener("resize", updateHeaderOffset);
  updateHeaderOffset();

  function setActive(link){ links.forEach(a => a.classList.toggle("active", a===link)); }
  function load(src, linkEl){
    if(!src) return;
    frame.setAttribute("src", src);
    if(linkEl) setActive(linkEl);
    history.replaceState(null, "", "#"+encodeURIComponent(src));
  }
  links.forEach(a=>a.addEventListener("click",(e)=>{e.preventDefault();load(a.getAttribute("data-src"), a);}));

  function resizeFrame(){
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if(!doc) return;
      const root = doc.documentElement, body = doc.body;
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

      // base CSS for icons/images/headings
      const base = doc.createElement("style");
      base.textContent = `
        /* ICONS fixed to 1em */
        img.icon, img[role="icon"] { height:1em !important; width:auto !important; vertical-align:-0.125em !important; }
        /* Desktop: original size for general images */
        @media (min-width:901px){ img:not(.icon):not([role="icon"]) { max-width:unset !important; height:auto !important; } }
        /* Mobile: responsive general images */
        @media (max-width:900px){ img:not(.icon):not([role="icon"]) { max-width:100% !important; height:auto !important; width:auto !important; display:block; } }
      `;
      doc.head && doc.head.appendChild(base);

      // MOBILE: remove inline width/height on general images for consistent sizing
      const isMobile = (doc.documentElement.clientWidth || doc.body.clientWidth) <= 900;
      if(isMobile){
        doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
          img.removeAttribute('width'); img.removeAttribute('height');
          if(img.style){ img.style.width=''; img.style.height=''; }
        });
      }

      // AUTO ICON DETECTION (including "참고" box images)
      const isInlineContext = (el) => !!(el && el.closest('p, li, h1, h2, h3, h4, h5, h6, .note, .참고'));
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
        const nw = img.naturalWidth||0, nh = img.naturalHeight||0;
        const cw = img.clientWidth||0, ch = img.clientHeight||0;
        const filename = (img.getAttribute('src')||'').toLowerCase();
        const looksLikeIcon = filename.includes('icon') || filename.includes('ico') || filename.includes('note') || filename.includes('참고');
        if ((nw && nh && nw<=64 && nh<=64) || (isInlineContext(img) && Math.max(cw,ch)<=72) || looksLikeIcon){
          img.classList.add('icon'); img.setAttribute('role','icon');
        }
      });

      // HEADING SPACERS (H1 50 except first; H2/H3 30)
      const addSpacerBefore = (node, px) => {
        if(!node || !node.parentNode) return;
        if(node.previousElementSibling && node.previousElementSibling.classList && node.previousElementSibling.classList.contains('vurix-spacer')) return;
        const s = doc.createElement('div'); s.className='vurix-spacer';
        s.style.cssText='display:block;height:'+px+'px;min-height:'+px+'px;line-height:0;margin:0;padding:0;border:0;flex-shrink:0;';
        node.parentNode.insertBefore(s, node);
      };
      const h1s = Array.from(doc.querySelectorAll('._1-1-Heading'));
      if (h1s.length){
        // First H1: no spacer
        h1s.slice(1).forEach(h=>addSpacerBefore(h,50));
      }
      doc.querySelectorAll('._1-2-Heading, ._1-3-Heading').forEach(n=>addSpacerBefore(n,30));

      // DESKTOP: equalize images on the same visual row inside common container
      function equalizeDesktopImages(){
        if(!window.matchMedia("(min-width:901px)").matches) return;
        const containers = Array.from(doc.querySelectorAll('div, section, figure, p, .row, .cols, .images'))
          .filter(el => el.querySelectorAll('img:not(.icon):not([role="icon"])').length >= 2);
        containers.forEach(el=>{
          const imgs = Array.from(el.querySelectorAll('img:not(.icon):not([role="icon"])'));
          if(imgs.length<2) return;
          // cluster by vertical position
          const rows = {};
          imgs.forEach(img=>{
            const rect = img.getBoundingClientRect();
            const key = Math.round((rect.top)/8); // tighter bucket
            (rows[key] = rows[key] || []).push(img);
          });
          Object.values(rows).forEach(group=>{
            if(group.length<2) return;
            const minH = Math.min(...group.map(i=>i.naturalHeight||i.clientHeight||0)) || 0;
            if(minH>0){
              group.forEach(i=>{ i.style.height = minH+'px'; i.style.width='auto'; i.style.objectFit='contain'; });
            }
          });
        });
      }
      equalizeDesktopImages();

      // Observe for height sync and possible layout changes
      if(ro) try{ ro.disconnect(); }catch(e){}
      if(mo) try{ mo.disconnect(); }catch(e){}
      try{ ro = new ResizeObserver(()=>{ resizeFrame(); }); ro.observe(doc.documentElement); }catch(e){}
      try{ mo = new MutationObserver(()=>{ resizeFrame(); }); mo.observe(doc.documentElement,{childList:true,subtree:true}); }catch(e){}

      resizeFrame();
    }catch(e){ console.warn("iframe init failed", e); }
  });

  // Initial route
  const hash = decodeURIComponent((location.hash||"").replace(/^#/, ""));
  const initial = links.find(a=>a.getAttribute("data-src")===hash) ? hash : defaultSrc;
  const activeLink = links.find(a=>a.getAttribute("data-src")===initial);
  if(activeLink) setActive(activeLink);
  load(initial, activeLink);
});
