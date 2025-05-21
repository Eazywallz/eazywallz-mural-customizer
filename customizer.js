// public/customizer.js
;(function () {
  // Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return;

    // parse product
    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch (e) { console.error('Invalid product JSON'); return; }

    // open button
    let openBtn = document.getElementById('customizer-open-btn');
    if (!openBtn) {
      openBtn = document.createElement('button');
      openBtn.id = 'customizer-open-btn';
      openBtn.textContent = 'Customize Mural';
      openBtn.style.cssText = 'margin:1rem 0;padding:.5rem 1rem;background:#111;color:#fff;border:none;cursor:pointer;';
      container.prepend(openBtn);
    }

    // overlay
    let overlay = document.getElementById('customizer-overlay');
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = 'customizer-overlay';
      overlay.style.cssText = '
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.5);
        display:none;align-items:center;justify-content:center;
        z-index:10000;'
      document.body.appendChild(overlay);
    }

    // modal
    let modal = document.getElementById('customizer-modal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'customizer-modal';
      modal.style.cssText = '
        background:#fff;border-radius:8px;
        width:75vw;max-width:1200px;max-height:85vh;
        display:flex;overflow:hidden;position:relative;'
      overlay.appendChild(modal);
    }

    // close icon
    let closeBtn = document.getElementById('customizer-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button'); closeBtn.id = 'customizer-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;font-size:1.5rem;background:none;border:none;cursor:pointer;';
      closeBtn.onclick = () => overlay.style.display = 'none';
      modal.appendChild(closeBtn);
    }

    // left sidebar
    let sidebar = document.getElementById('customizer-sidebar');
    if (!sidebar) {
      sidebar = document.createElement('div'); sidebar.id = 'customizer-sidebar';
      sidebar.style.cssText = '
        width:300px;padding:1rem;
        background:#f9f9f9;overflow-y:auto;
        border-right:1px solid #ddd;';
      modal.appendChild(sidebar);
    }

    // right canvas
    let canvasArea = document.getElementById('customizer-canvas');
    if (!canvasArea) {
      canvasArea = document.createElement('div'); canvasArea.id = 'customizer-canvas';
      canvasArea.style.cssText = '
        flex:1;position:relative;
        display:flex;align-items:center;justify-content:center;
        background:#eaeaea;';
      modal.appendChild(canvasArea);
    }

    // footer
    let footer = document.getElementById('customizer-footer');
    if (!footer) {
      footer = document.createElement('div'); footer.id = 'customizer-footer';
      footer.style.cssText = '
        padding:1rem;border-top:1px solid #ddd;
        display:flex;justify-content:space-between;';
      modal.appendChild(footer);
    }

    // build controls in sidebar
    sidebar.innerHTML = '';
    function makeLabel(text) { const l = document.createElement('label'); l.textContent = text; l.style.fontWeight='bold';return l; }
    sidebar.append(makeLabel('Wall dimensions'), document.createElement('br'));
    const unitSel = document.createElement('select'); ['inches','feet','cm'].forEach(u=>unitSel.add(new Option(u,u))); unitSel.style.width='100%';
    sidebar.append(unitSel);
    sidebar.append(document.createElement('br'));
    const wIn = Object.assign(document.createElement('input'),{type:'number',placeholder:'Width',style:'width:100%;margin:.5rem 0;'});
    const hIn = Object.assign(document.createElement('input'),{type:'number',placeholder:'Height',style:'width:100%;margin:.5rem 0;'});
    sidebar.append(wIn, hIn);
    sidebar.append(makeLabel('Paper type'), document.createElement('div'));
    const variantSel = document.createElement('select'); product.variants.forEach((v,i)=>variantSel.add(new Option(v.title,i))); variantSel.style.width='100%';
    sidebar.append(variantSel);
    sidebar.append(makeLabel('Options'), document.createElement('div'));
    const flipSel = document.createElement('select'); ['none','h','v'].forEach(f=>flipSel.add(new Option('Flip '+f,f))); flipSel.style.marginRight='1rem';
    const bwChk = Object.assign(document.createElement('input'),{type:'checkbox'});
    sidebar.append(flipSel, bwChk, document.createTextNode('Black & White'));
    sidebar.append(document.createElement('hr'));
    const panelsChk = Object.assign(document.createElement('input'),{type:'checkbox'});
    sidebar.append(panelsChk, document.createTextNode('Show panels'));

    // price and add
    footer.innerHTML = '';
    const priceDiv = document.createElement('div'); priceDiv.textContent = 'Price: $0.00';
    const addBtn = document.createElement('button'); addBtn.textContent='Add to Cart';
    addBtn.style.cssText='padding:.5rem 1rem;background:#111;color:#fff;border:none;cursor:pointer;';
    footer.append(priceDiv, addBtn);

    // logic
    let cropper,img;
    function clear() { if(cropper)cropper.destroy(); canvasArea.innerHTML=''; }
    function render() {
      clear(); let src=product.variants[variantSel.value].image?.src||product.images[0];
      if(src.startsWith('//'))src=location.protocol+src;
      img=document.createElement('img'); img.src=src; img.style.maxWidth='100%'; img.style.maxHeight='100%';
      img.onload=()=>{
        canvasArea.append(img);
        cropper=new Cropper(img,{viewMode:1,autoCropArea:1,dragMode:'move',cropBoxMovable:false,cropBoxResizable:false,zoomable:false,scalable:false});
        if(panelsChk.checked)drawPanels();
      };
    }
    function drawPanels(){
      canvasArea.querySelectorAll('.panel').forEach(n=>n.remove());
      const cb=cropper.getCropBoxData(),total=+wIn.value, count=Math.ceil(total/25),step=cb.width/count;
      for(let i=1;i<count;i++){const d=document.createElement('div');d.className='panel';d.style.cssText=`position:absolute;top:${cb.top}px;left:${cb.left+step*i}px;height:${cb.height}px;width:2px;background:red;pointer-events:none;`;canvasArea.append(d);}    }
    function update(){
      if(!cropper) return; const w=+wIn.value,h=+hIn.value;if(w&&h)cropper.setAspectRatio(w/h);
      const sqft=Math.ceil((w*h)/144)||1;
      const price=(product.variants[variantSel.value].price/100)*sqft;
      priceDiv.textContent=`Price: $${price.toFixed(2)}`;
    }
    [wIn,hIn,variantSel].forEach(el=>el.oninput=()=>{render();update();});
    panelsChk.onchange=()=>{ if(panelsChk.checked)drawPanels(); else canvasArea.querySelectorAll('.panel').forEach(n=>n.remove()); };
    openBtn.onclick=()=>overlay.style.display='flex';
    addBtn.onclick=()=>alert('To cart'); // stub

    render(); update();
  }

  document.readyState!=='loading'
    ? loadCropper().then(initCustomizer)
    : document.addEventListener('DOMContentLoaded',()=>loadCropper().then(initCustomizer));
})();
