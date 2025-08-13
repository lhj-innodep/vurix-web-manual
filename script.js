
/*! Shell loader for VURIX Mobile manual (iframe + hash routing + a11y)
 *  - Loads child pages into <iframe id="contentFrame">
 *  - Keeps active state on .menu-item buttons
 *  - Updates location.hash for deep-linking
 *  - Injects base styles into child docs (table/img rules, etc.)
 *  - Optional desktop zoom for readability
 */
(function(){
  'use strict';

  var iframe    = document.getElementById('contentFrame');
  var menuList  = document.getElementById('menuList');
  var menuButtons = Array.prototype.slice.call(document.querySelectorAll('.menu-item'));
  var topMenu   = document.querySelector('.top-menu');

  var SCALE      = 1.25;   // 데스크톱 확대 배율
  var DESKTOP_BP = 901;    // 데스크톱 적용 임계폭(px)

  function setActive(btn){
    menuButtons.forEach(function(b){
      var on = (b === btn);
      b.classList.toggle('active', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (btn) { try{ btn.focus(); }catch(e){} }
  }

  function loadSrc(src, btn){
    if (!src) return;
    iframe.src = src;
    if (btn) setActive(btn);
    try {
      if (location.hash !== '#' + src) location.hash = '#' + src;
    } catch(e){}
  }

  function applyHeaderHeight(){
    try{
      var h = topMenu.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header2-computed', h + 'px');
    }catch(e){}
  }

  function isDesktop(){ return window.innerWidth >= DESKTOP_BP; }

  function applyViewportMode(){
    var desk = isDesktop();
    document.documentElement.style.overflowY = desk ? 'hidden' : 'auto';
    document.body.style.overflowY = desk ? 'hidden' : 'auto';
    applyHeaderHeight();
  }

  function ensureContentCss(doc){
    try{
      // 이미 링크가 있으면 패스
      var has = doc.querySelector('link[rel="stylesheet"][href$="content.css"]');
      if (has) return;
      // 우선 현재 경로 기준
      var link1 = doc.createElement('link');
      link1.rel = 'stylesheet';
      link1.href = 'content.css';
      doc.head.appendChild(link1);
      // 혹시 루트/상위 경로에 있을 수 있으니 백업 링크도 주입
      var link2 = doc.createElement('link');
      link2.rel = 'stylesheet';
      link2.href = '../content.css';
      doc.head.appendChild(link2);
    }catch(e){}
  }

  function injectBaseStyles(doc){
    try{
      var head = doc.head || doc.getElementsByTagName('head')[0];
      if (!head) return;

      var base = doc.createElement('style');
      base.type = 'text/css';
      base.appendChild(doc.createTextNode([
        'html, body{margin:0;padding:0;}',
        'body{display:flow-root;}',
        'body>*:first-child{margin-top:0 !important;}',
        '._1-1-Heading:first-of-type{margin-top:0 !important;padding-top:0 !important;}',

        // 아이콘 이미지는 1em로 고정
        'img[src*="0_ICON" i], img[data-src*="0_ICON" i]{height:1em !important; max-height:1em !important; width:auto !important; vertical-align:middle !important; object-fit:contain;}',
        'img[src*="0_ICON_0_NOTE_1_RF" i], img[src*="0_ICON_0_NOTE_2_ATT" i], img[src*="0_ICON_0_NOTE_3_WA" i]{height:1em !important; width:auto !important;}'
      ].join('\n')));
      head.appendChild(base);

      var mo = doc.createElement('style');
      mo.type = 'text/css';
      mo.media = 'screen and (max-width: 700px)';
      mo.appendChild(doc.createTextNode([
        'table{ width:100% !important; table-layout:auto !important; }',
        'th,td{ white-space:normal !important; overflow-wrap:anywhere !important; word-break:break-word !important; }',
        'table img:not([src*="0_ICON" i]):not([data-src*="0_ICON" i]){ max-width:100% !important; height:auto !important; }',
        'img[src*="0_ICON" i], img[data-src*="0_ICON" i]{ height:1em !important; max-height:1em !important; width:auto !important; }'
      ].join('\n')));
      head.appendChild(mo);
    }catch(e){}
  }

  function applyDesktopScale(doc){
    try{
      if (!doc) return;
      var body = doc.body;
      if (!body) return;

      var wrap = doc.getElementById('zoomRoot');
      var desk = isDesktop();

      if (desk){
        if (!wrap){
          wrap = doc.createElement('div');
          wrap.id = 'zoomRoot';
          while (body.firstChild){ wrap.appendChild(body.firstChild); }
          body.appendChild(wrap);
        }
        wrap.style.transformOrigin = '0 0';
        wrap.style.zoom = String(SCALE);
        wrap.style.transform = 'scale(' + SCALE + ')';
        wrap.style.width = 'calc(100% / ' + SCALE + ')';
        wrap.style.position = 'relative';
        body.style.width = '100%';
      }else{
        if (wrap){
          while (wrap.firstChild){ body.insertBefore(wrap.firstChild, wrap); }
          wrap.remove();
        }
        body.style.zoom = '';
        body.style.width = '';
      }
    }catch(e){}
  }

  function onIframeLoad(){
    try{
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return;
      ensureContentCss(doc);  // content.css 연결 보강
      injectBaseStyles(doc);  // 안전 가드
      applyDesktopScale(doc); // 데스크톱 확대
    }catch(e){}
  }

  function syncFromHash(){
    var hash = location.hash || '#start.html';
    var src = hash.replace(/^#/, '');
    var targetBtn = null;
    for (var i=0;i<menuButtons.length;i++){
      if (menuButtons[i].dataset.src === src){ targetBtn = menuButtons[i]; break; }
    }
    if (targetBtn){ setActive(targetBtn); }
    iframe.src = src;
  }

  // 이벤트 바인딩
  iframe.addEventListener('load', onIframeLoad);
  window.addEventListener('hashchange', syncFromHash);
  window.addEventListener('resize', function(){
    applyViewportMode();
    try{
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      applyDesktopScale(doc);
    }catch(e){}
  });

  // 메뉴 클릭/키보드
  menuButtons.forEach(function(btn){
    btn.addEventListener('click', function(){ loadSrc(btn.dataset.src, btn); });
  });
  if (menuList){
    menuList.addEventListener('keydown', function(e){
      if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var idx = menuButtons.findIndex(function(b){ return b.classList.contains('active'); });
      if (idx < 0) idx = 0;
      var next = e.key === 'ArrowRight' ? (idx+1) % menuButtons.length
                                        : (idx-1+menuButtons.length) % menuButtons.length;
      menuButtons[next].click();
    });
  }

  // 초기 진입
  document.addEventListener('DOMContentLoaded', function(){
    applyViewportMode();
    syncFromHash();
  });

  // 메뉴 높이 변화 감지 -> 헤더2 높이 갱신
  if ('ResizeObserver' in window && menuList){
    var ro = new ResizeObserver(function(){ applyHeaderHeight(); });
    ro.observe(menuList);
  }
})();
