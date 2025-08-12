
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("contentFrame");
  const links = Array.from(document.querySelectorAll(".menu a[data-src]"));
  const defaultSrc = "start.html";
  const header = document.querySelector(".header");
  const main = document.querySelector(".main");

  function syncHeaderSpace(){
    const h = header.getBoundingClientRect().height;
    main.style.paddingTop = h + "px";
  }
  window.addEventListener("resize", syncHeaderSpace);
  syncHeaderSpace();

  function setActive(link){ links.forEach(a=>a.classList.toggle("active", a===link)); }
  function load(src, linkEl){
    if(!src) return;
    frame.setAttribute("src", src);
    if(linkEl) setActive(linkEl);
    history.replaceState(null,"","#"+encodeURIComponent(src));
  }
  links.forEach(a=>a.addEventListener("click",e=>{e.preventDefault();load(a.getAttribute("data-src"),a);}));

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

  frame.addEventListener("load", () => {
    try{
      const doc = frame.contentDocument || frame.contentWindow.document;
      if(!doc) return;

      // ensure no inner scrollbars
      const style = doc.createElement("style");
      style.textContent = `
        html,body{overflow:visible !important;}
        img.icon, img[role="icon"]{height:1em !important;width:auto !important;vertical-align:-0.125em !important}
        @media (max-width:900px){
          img:not(.icon):not([role="icon"]){max-width:100% !important;height:auto !important;width:auto !important;display:block}
        }
      `;
      doc.head && doc.head.appendChild(style);

      // mobile: strip inline size on general images
      const isMobile = (doc.documentElement.clientWidth||doc.body.clientWidth) <= 900;
      if(isMobile){
        doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
          img.removeAttribute('width'); img.removeAttribute('height');
          if(img.style){ img.style.width=''; img.style.height=''; }
        });
      }

      // auto icon detect (including 참고 bubble)
      doc.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
        const name = (img.getAttribute('src')||'').toLowerCase();
        const nw = img.naturalWidth||0, nh=img.naturalHeight||0;
        const cw = img.clientWidth||0, ch=img.clientHeight||0;
        const inline = !!img.closest('p,li,dt,dd,h1,h2,h3,h4,h5,h6');
        if(name.includes('icon')||name.includes('ico')||name.includes('note')||name.includes('참고')||
           (nw&&nh&&nw<=48&&nh<=48) || (inline && Math.max(cw,ch)<=64)){
          img.classList.add('icon'); img.setAttribute('role','icon');
        }
      });

      // heading spacers
      const addSpacer=(node,px)=>{
        if(!node||!node.parentNode) return;
        if(node.previousElementSibling && node.previousElementSibling.classList.contains('vurix-spacer')) return;
        const s = doc.createElement('div'); s.className='vurix-spacer';
        s.style.cssText='display:block;height:'+px+'px;min-height:'+px+'px;margin:0;padding:0;border:0;';
        node.parentNode.insertBefore(s,node);
      };
      const h1s = Array.from(doc.querySelectorAll('._1-1-Heading'));
      if(h1s.length){ h1s.slice(1).forEach(h=>addSpacer(h,50)); }
      doc.querySelectorAll('._1-2-Heading, ._1-3-Heading').forEach(n=>addSpacer(n,30));

      // desktop: equalize images per row
      function equalize(){
        if(!window.matchMedia("(min-width: 901px)").matches) return;
        const containers = Array.from(doc.querySelectorAll('div,section,figure,p')).filter(el=>el.querySelectorAll('img:not(.icon):not([role="icon"])').length>=2);
        containers.forEach(el=>{
          // group images by approx same top (relative to container)
          const rect = el.getBoundingClientRect();
          const rows = {};
          el.querySelectorAll('img:not(.icon):not([role="icon"])').forEach(img=>{
            const t = img.getBoundingClientRect().top - rect.top;
            const key = Math.round(t/8); // tighter bucket
            (rows[key]=rows[key]||[]).push(img);
          });
          Object.values(rows).forEach(row=>{
            if(row.length<2) return;
            // use current clientHeight min to avoid natural discrepancies
            const minH = Math.min(...row.map(i=>i.clientHeight||i.naturalHeight||0));
            row.forEach(i=>{ i.style.height = minH+'px'; i.style.width='auto'; });
          });
        });
      }
      equalize();

      // Observe content to recalc
      try{
        const ro = new ResizeObserver(()=>{ equalize(); resizeFrame(); });
        ro.observe(doc.documentElement);
      }catch(e){}
      try{
        const mo = new MutationObserver(()=>{ equalize(); resizeFrame(); });
        mo.observe(doc.documentElement,{childList:true,subtree:true});
      }catch(e){}

      // also wait images
      doc.querySelectorAll('img').forEach(img=>{
        if(!img.complete){
          img.addEventListener('load', ()=>{ equalize(); resizeFrame(); });
        }
      });

      resizeFrame();
    }catch(e){ console.warn(e); }
  });

  // initial route
  const hash = decodeURIComponent((location.hash||"").replace(/^#/,""));
  const initial = links.find(a=>a.getAttribute("data-src")===hash) ? hash : defaultSrc;
  const active = links.find(a=>a.getAttribute("data-src")===initial);
  if(active) setActive(active);
  load(initial, active);
});
