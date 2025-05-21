// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 2) Initialize the customizer
  function initCustomizer() {
    const originalContainer = document.getElementById('mural-customizer');
    if (!originalContainer) {
      console.warn('Customizer: missing container');
      return;
    }

    // Parse product JSON
    let product;
    try {
      product = JSON.parse(originalContainer.dataset.product);
    } catch (err) {
      console.error('Customizer: invalid product JSON', err);
      return;
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    });
    document.body.appendChild(overlay);

    // Modal content
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      position: 'relative', background: '#fff', padding: '1rem', borderRadius: '8px',
      width: '75vw', height: '75vh', maxWidth: '1200px', maxHeight: '900px', overflow: 'hidden', boxSizing: 'border-box'
    });
    overlay.appendChild(modalContent);

    // Move original container into modal
    modalContent.appendChild(originalContainer);
    Object.assign(originalContainer.style, { width: '100%', height: '100%', overflow: 'auto', boxSizing: 'border-box' });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
    });
    modalContent.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');

    // Listen on external trigger (Shopify button/link)
    const trigger = document.getElementById('open-customizer-btn');
    if (!trigger) {
      console.warn('Customizer: trigger element #open-customizer-btn not found');
    } else {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        overlay.style.display = 'flex';
      });
    }

    // BUILD UI INSIDE CONTAINER
    const container = originalContainer;
    container.innerHTML = '';

    // Controls wrapper
    const controls = document.createElement('div');
    Object.assign(controls.style, { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' });
    container.appendChild(controls);

    // Unit select
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; unitSelect.appendChild(o);
    }); controls.appendChild(unitSelect);

    // Variant select
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => { const o = document.createElement('option'); o.value = i; o.text = v.title; variantSelect.appendChild(o); });
    controls.appendChild(variantSelect);

    // Dimension inputs
    const widthInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Width', min: 1 });
    const heightInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Height', min: 1 });
    controls.append(widthInput, heightInput);

    // Feet/inches inputs
    const widthFeet = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Feet', min: 0 });
    const widthInches = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Inches', min: 0, max: 11 });
    const heightFeet = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Feet', min: 0 });
    const heightInches = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Inches', min: 0, max: 11 });
    [widthFeet,widthInches,heightFeet,heightInches].forEach(el => { el.style.display = 'none'; controls.appendChild(el); });

    // Flip
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.text=t; flipSelect.appendChild(o); });
    controls.appendChild(flipSelect);

    // B&W
    const bwCheckbox = document.createElement('input'); bwCheckbox.type = 'checkbox';
    const bwLabel = document.createElement('label'); bwLabel.append(bwCheckbox, ' B&W'); controls.appendChild(bwLabel);

    // Panels
    const panelsCheckbox = document.createElement('input'); panelsCheckbox.type = 'checkbox';
    const panelsLabel = document.createElement('label'); panelsLabel.append(panelsCheckbox, ' Show panels'); controls.appendChild(panelsLabel);

    // Price
    const priceDiv = document.createElement('div'); priceDiv.innerText = 'Price: $0.00'; container.appendChild(priceDiv);
    const qtyInput = document.querySelector('input[name="quantity"]'); if(qtyInput){ qtyInput.step='any'; qtyInput.min=0; }

    // Cropper
    let cropper, imgEl;
    function clearContainer() { if (cropper) { cropper.destroy(); } container.querySelector('.cropper-container')?.remove(); clearPanels(); }
    function renderImage() {
      clearContainer();
      const variant = product.variants[variantSelect.value];
      let src = variant.image?.src || variant.featured_image?.src || product.images[0];
      if (src.startsWith('//')) src = location.protocol + src;
      imgEl = document.createElement('img'); imgEl.src = src; imgEl.style.width = '100%'; container.appendChild(imgEl);
      imgEl.onload = () => {
        cropper = new Cropper(imgEl, { viewMode: 1, autoCropArea: 1, dragMode: 'move', cropBoxMovable: true, cropBoxResizable: false, zoomable: false, scalable: false });
        updateAll(); if (panelsCheckbox.checked) drawPanels();
      };
    }

    function getWidthInches() {
      if (unitSelect.value === 'feet') return (+widthFeet.value||0)*12 + (+widthInches.value||0);
      const v = +widthInput.value||0; return unitSelect.value==='cm'? v*0.393700787 : v;
    }
    function getHeightInches() {
      if (unitSelect.value === 'feet') return (+heightFeet.value||0)*12 + (+heightInches.value||0);
      const v = +heightInput.value||0; return unitSelect.value==='cm'? v*0.393700787 : v;
    }

    function updateAll() {
      const w = getWidthInches(), h = getHeightInches();
      if (cropper && w>0 && h>0) { cropper.setAspectRatio(w/h); const area = w*h/144; priceDiv.innerText = `Price: $${((product.variants[variantSelect.value].price/100)*area).toFixed(2)}`; if(qtyInput) qtyInput.value = area.toFixed(2); }
    }

    function applyFlip() { const wrap = container.querySelector('.cropper-container'); if(wrap) wrap.style.transform = flipSelect.value==='horizontal' ? 'scaleX(-1)' : flipSelect.value==='vertical' ? 'scaleY(-1)' : ''; }
    function applyBW() { const wrap = container.querySelector('.cropper-container'); if(wrap) wrap.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : ''; }

    function drawPanels() {
      clearPanels(); if(!cropper) return;
      const data = cropper.getCropBoxData();
      const total = getWidthInches(); const panelMax = unitSelect.value==='cm'?25*2.54:25;
      const count = Math.ceil(total/panelMax), wrap = container.querySelector('.cropper-container'); wrap.style.position='relative';
      for(let i=1;i<count;i++){ const x = data.left + (data.width/count)*i; const line = document.createElement('div'); line.className='panel-line'; Object.assign(line.style,{position:'absolute',top:`${data.top}px`,left:`${x}px`,width:'2px',height:`${data.height}px`,background:'rgba(0,0,0,0.7)',pointerEvents:'none'}); wrap.appendChild(line);}    }
    function clearPanels() { container.querySelectorAll('.panel-line').forEach(el=>el.remove()); }

    // Event wiring
    variantSelect.addEventListener('change', () => { renderImage(); applyFlip(); applyBW(); });
    unitSelect.addEventListener('change', () => {
      const isFeet = unitSelect.value==='feet';
      [widthInput,heightInput].forEach(el=>el.style.display=isFeet?'none':'inline-block');
      [widthFeet,widthInches,heightFeet,heightInches].forEach(el=>el.style.display=isFeet?'inline-block':'none');
      updateAll(); if(panelsCheckbox.checked) drawPanels();
    });
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches].forEach(el=> el.addEventListener('input', () => { updateAll(); if(panelsCheckbox.checked) drawPanels(); }));
    flipSelect.addEventListener('change', applyFlip);
    bwCheckbox.addEventListener('change', applyBW);
    panelsCheckbox.addEventListener('change', () => panelsCheckbox.checked ? drawPanels() : clearPanels());

    // Initial render
    renderImage();
    updateAll();

    console.log('Customizer initialized inside modal');
  }

  document.addEventListener('DOMContentLoaded', () => loadCropper().then(initCustomizer).catch(console.error));
})();
