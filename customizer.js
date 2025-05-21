// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      // Cropper CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);
      // Custom mask styles: hide borders, make outside area match modal bg
      const css = document.createElement('style');
      css.textContent = `
        .cropper-crop-box, .cropper-view-box { border: none !important; }
        .cropper-face, .cropper-drag-box { background: #fff !important; }
      `;
      document.head.appendChild(css);
      // Cropper JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  // 2) Initialize the customizer UI
  function initCustomizer() {
    // Inject launch button
    let launchBtn = document.getElementById('open-mural-btn');
    if (!launchBtn) {
      launchBtn = document.createElement('button');
      launchBtn.id = 'open-mural-btn';
      launchBtn.textContent = 'Customize Mural';
      launchBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;padding:10px 20px;font-size:1rem;background:#111;color:#fff;border:none;border-radius:4px;cursor:pointer;';
      document.body.appendChild(launchBtn);
    }

    // Build modal overlay
    const modal = document.createElement('div');
    modal.id = 'mural-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);display:none;justify-content:center;align-items:center;z-index:9999;';
    // Close handler
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });

    // Container inside modal
    const container = document.createElement('div');
    container.id = 'mural-customizer';
    container.style.cssText = 'width:100vw;height:100vh;background:#fff;display:flex;overflow:hidden;position:relative;';
    modal.appendChild(container);
    document.body.appendChild(modal);

    // Data holder element for product JSON
    const dataHolder = document.getElementById('mural-customizer-data');
    let product;
    try {
      product = JSON.parse(dataHolder.dataset.product);
    } catch (err) {
      console.error('Invalid product JSON', err);
      return;
    }

    // Sidebar controls
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:350px;padding:20px;overflow-y:auto;background:#f9f9f9;';
    container.appendChild(sidebar);

    function makeLabel(text) {
      const lbl = document.createElement('label');
      lbl.textContent = text;
      lbl.style.cssText = 'display:block;margin:10px 0 5px;font-weight:bold;';
      return lbl;
    }

    // Dimension inputs
    sidebar.appendChild(makeLabel('Dimensions'));
    const unitSel = document.createElement('select');
    ['inches','feet','cm'].forEach(u => unitSel.add(new Option(u,u)));
    unitSel.style.cssText = 'width:100%;padding:10px;margin-bottom:10px;';
    const wIn = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width' });
    wIn.style.cssText = 'width:100%;padding:10px;margin-bottom:10px;';
    const hIn = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height' });
    hIn.style.cssText = 'width:100%;padding:10px;margin-bottom:20px;';
    sidebar.append(unitSel, wIn, hIn);

    // Variant
    sidebar.appendChild(makeLabel('Paper Type'));
    const variantSel = document.createElement('select');
    product.variants.forEach((v,i) => variantSel.add(new Option(v.title,i)));
    variantSel.style.cssText = 'width:100%;padding:10px;margin-bottom:20px;';
    sidebar.appendChild(variantSel);

    // Flip
    sidebar.appendChild(makeLabel('Flip'));
    const flipSel = document.createElement('select');
    [['None','none'],['Flip H','h'],['Flip V','v']].forEach(([t,v])=>flipSel.add(new Option(t,v)));
    flipSel.style.cssText = 'width:100%;padding:10px;margin-bottom:20px;';
    sidebar.appendChild(flipSel);

    // B&W
    const bwDiv = document.createElement('div');
    bwDiv.style.marginBottom = '20px';
    const bwChk = Object.assign(document.createElement('input'),{type:'checkbox',id:'bwChk'});
    const bwLbl = Object.assign(document.createElement('label'),{htmlFor:'bwChk',textContent:'Black & White'});
    bwDiv.append(bwChk, bwLbl);
    sidebar.appendChild(bwDiv);

    // Panels
    const panelsDiv = document.createElement('div');
    panelsDiv.style.marginBottom = '20px';
    const panelsChk = Object.assign(document.createElement('input'),{type:'checkbox',id:'panelsChk'});
    const panelsLbl = Object.assign(document.createElement('label'),{htmlFor:'panelsChk',textContent:'Show panels'});
    panelsDiv.append(panelsChk, panelsLbl);
    sidebar.appendChild(panelsDiv);

    // Price + Add
    sidebar.appendChild(makeLabel(''));
    const priceDiv = document.createElement('div');
    priceDiv.textContent = 'Price: $0.00';
    priceDiv.style.cssText = 'margin:20px 0;font-size:1.2rem;';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add to Cart';
    addBtn.style.cssText = 'width:100%;padding:15px;font-size:1.1rem;background:#111;color:#fff;border:none;cursor:pointer;';
    sidebar.append(priceDiv, addBtn);

    // Canvas area
    const canvasArea = document.createElement('div');
    canvasArea.style.cssText = 'flex:1;position:relative;background:#fff;';
    container.appendChild(canvasArea);

    let cropper, imgEl;
    function renderImage() {
      canvasArea.innerHTML = '';
      if (cropper) cropper.destroy();
      let src = product.variants[variantSel.value].image?.src || product.images[0];
      if (src.startsWith('//')) src = location.protocol + src;
      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.maxWidth = 'none';
      imgEl.style.height = '100%';
      imgEl.onload = () => {
        canvasArea.appendChild(imgEl);
        cropper = new Cropper(imgEl, {
          viewMode:1, autoCropArea:1, dragMode:'move',
          cropBoxMovable:false, cropBoxResizable:false,
          zoomable:false, scalable:false,
          background:false, guides:false, highlight:false
        });
        update();
      };
    }

    function update() {
      if (!cropper) return;
      const w = parseFloat(wIn.value), h = parseFloat(hIn.value);
      if (w>0&&h>0) cropper.setAspectRatio(w/h);
      // flips
      cropper.scaleX(flipSel.value==='h'?-1:1);
      cropper.scaleY(flipSel.value==='v'?-1:1);
      // b&w
      imgEl.style.filter = bwChk.checked? 'grayscale(100%)':'';
      // panels
      canvasArea.querySelectorAll('.panel').forEach(n=>n.remove());
      if (panelsChk.checked && w>0) {
        const cb = cropper.getCropBoxData();
        const count = Math.ceil(w/25);
        const step = cb.width/count;
        for (let i=1;i<count;i++){
          const line = document.createElement('div');
          Object.assign(line,{className:'panel'});
          Object.assign(line.style,{position:'absolute',top:cb.top+'px',left:(cb.left+step*i)+'px',height:cb.height+'px',width:'2px',background:'red',pointerEvents:'none'});
          canvasArea.appendChild(line);
        }
      }
      // price
      const sqft = Math.ceil((w*h)/144)||1;
      const price = (product.variants[variantSel.value].price/100)*sqft;
      priceDiv.textContent = `Price: $${price.toFixed(2)}`;
    }

    // Events
    [wIn,hIn,variantSel,flipSel,bwChk,panelsChk].forEach(el=>{
      el.addEventListener('input',update);
      el.addEventListener('change',update);
    });
    addBtn.addEventListener('click',()=>{
      // TODO: Ajax add to cart with properties
    });

    renderImage();

    // launch button handler
    launchBtn.addEventListener('click',()=>{ modal.style.display='flex'; });
  }

  if (document.readyState!=='loading') loadCropper().then(initCustomizer);
  else document.addEventListener('DOMContentLoaded',()=>loadCropper().then(initCustomizer));
})();
