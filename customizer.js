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
      script.onload = () => { console.log('Cropper.js loaded'); resolve(); };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  // 2) Initialize customizer
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) { console.warn('Customizer: missing container'); return; }
    container.style.maxWidth = '500px';
    container.style.margin = '1rem auto';

    // Parse product data
    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch (e) { console.error('Customizer: invalid product JSON', e); return; }
    console.log('Customizer: product loaded', product);

    // Build control panel
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.gap = '0.5rem';
    controls.style.marginBottom = '1rem';

    // Unit dropdown
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t])=>{
      const o = document.createElement('option'); o.value = v; o.text = t; unitSelect.appendChild(o);
    });

    // Variant dropdown
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o = document.createElement('option'); o.value = i; o.text = v.title; variantSelect.appendChild(o);
    });
    const defaultIndex = product.variants.length > 1 ? 1 : 0;
    variantSelect.selectedIndex = defaultIndex;

    // Dimension inputs (inches/cm)
    const widthInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width', min:1 });
    const heightInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height', min:1 });

    // Dimension inputs (feet)
    const widthFeetInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Feet', min:0 });
    const widthInchesInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Inches', min:0, max:11 });
    widthInchesInput.addEventListener('input', () => { if (parseInt(widthInchesInput.value,10) > 11) widthInchesInput.value = 11; });
    widthFeetInput.addEventListener('input', () => {
      if (widthFeetInput.value.length > 3) widthFeetInput.value = widthFeetInput.value.slice(0,3);
    });
    const heightFeetInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Feet', min:0 });
    const heightInchesInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Inches', min:0, max:11 });
    heightInchesInput.addEventListener('input', () => { if (parseInt(heightInchesInput.value,10) > 11) heightInchesInput.value = 11; });
    heightFeetInput.addEventListener('input', () => {
      if (heightFeetInput.value.length > 3) heightFeetInput.value = heightFeetInput.value.slice(0,3);
    });

    // Hide feet fields initially
    [widthFeetInput,widthInchesInput,heightFeetInput,heightInchesInput].forEach(el => el.style.display = 'none');

    // Flip dropdown
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t])=>{
      const o = document.createElement('option'); o.value = v; o.text = t; flipSelect.appendChild(o);
    });

    // B&W checkbox
    const bwCheckbox = document.createElement('input'); bwCheckbox.type = 'checkbox';
    const bwLabel = document.createElement('label'); bwLabel.append(bwCheckbox, document.createTextNode(' B&W'));

    // Panel toggle
    const panelsCheckbox = document.createElement('input'); panelsCheckbox.type = 'checkbox';
    const panelsLabel = document.createElement('label'); panelsLabel.append(panelsCheckbox, document.createTextNode(' Show panels'));

    // Append controls
    controls.append(unitSelect, variantSelect,
      widthInput, heightInput,
      widthFeetInput, widthInchesInput,
      heightFeetInput, heightInchesInput,
      flipSelect, bwLabel, panelsLabel);
    container.appendChild(controls);

    // Price display
    const priceDisplay = document.createElement('div'); priceDisplay.innerText = 'Price: $0.00';
    container.appendChild(priceDisplay);

    // Quantity field
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step = 'any'; qtyInput.min = 0; }

    // Cropper refs
    let cropper, imgEl;

    // Clear existing cropper & overlays
    function clearCropper() {
      if (cropper) cropper.destroy();
      const old = container.querySelector('.cropper-container');
      if (old) old.remove();
      clearPanels();
    }

    // Render image
    function renderImage(variant, idx) {
      clearCropper();
      const base = variant.image?.src || variant.featured_image?.src ||
        (Array.isArray(product.images) ? product.images[idx] || product.images[0] : product.images[0]);
      let src = base.startsWith('//') ? location.protocol + base : base;
      imgEl = document.createElement('img'); imgEl.src = src;
      imgEl.style.width = '100%'; imgEl.style.display = 'block';
      container.appendChild(imgEl);
      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:1, autoCropArea:1,
          dragMode:'none', cropBoxMovable:true, cropBoxResizable:true,
          zoomable:false, scalable:false
        });
        updateAspectRatio(); applyFlips(); applyBW();
        if (panelsCheckbox.checked) drawPanels();
      };
    }

    // Initial setup
    let currentIdx = defaultIndex;
    let currentVariant = product.variants[currentIdx];
    renderImage(currentVariant, currentIdx);

    // Dimension conversion helpers
    function getWidthInches() {
      if (unitSelect.value === 'feet') {
        return (parseInt(widthFeetInput.value,10) || 0) *12 + (parseInt(widthInchesInput.value,10)||0);
      } else {
        const n = parseFloat(widthInput.value) || 0;
        return unitSelect.value === 'cm' ? n*0.393700787 : n;
      }
    }
    function getHeightInches() {
      if (unitSelect.value === 'feet') {
        return (parseInt(heightFeetInput.value,10)||0)*12 + (parseInt(heightInchesInput.value,10)||0);
      } else {
        const n = parseFloat(heightInput.value) || 0;
        return unitSelect.value === 'cm' ? n*0.393700787 : n;
      }
    }

    // Aspect ratio
    function updateAspectRatio() {
      const w = getWidthInches(), h = getHeightInches();
      if (cropper && w>0 && h>0) cropper.setAspectRatio(w/h);
    }

    // Flip
    function applyFlips() {
      const wrap = container.querySelector('.cropper-container');
      if (!wrap) return;
      const sx = flipSelect.value==='horizontal'? -1:1;
      const sy = flipSelect.value==='vertical'? -1:1;
      wrap.style.transform = `scale(${sx},${sy})`;
      wrap.style.transformOrigin = 'center';
    }

    // B&W
    function applyBW() {
      const wrap = container.querySelector('.cropper-container');
      if (!wrap) return;
      wrap.style.filter = bwCheckbox.checked? 'grayscale(100%)' : '';
    }

    // Panels overlay
    function drawPanels() {
      clearPanels();
      const w = getWidthInches(); if (!(w>0)) return;
      const maxW = unitSelect.value==='cm'? 25*2.54 : 25;
      const count = Math.ceil(w/maxW);
      const viewBox = container.querySelector('.cropper-view-box');
      if (!viewBox) return;
      viewBox.style.position='relative';
      viewBox.style.overflow='visible';
      for (let i=1; i<count; i++) {
        const line = document.createElement('div');
        line.className = 'panel-line';
        Object.assign(line.style, {
          position:'absolute', top:'0', bottom:'0',
          width:'2px', background:'rgba(0,0,0,0.7)',
          left:`${(i/count*100)}%`, zIndex:'1000', pointerEvents:'none'
        });
        viewBox.appendChild(line);
      }
    }

    function clearPanels() {
      container.querySelectorAll('.panel-line').forEach(el=>el.remove());
    }

    // Recalc
    function recalc() {
      updateAspectRatio(); applyFlips(); applyBW();
      if (panelsCheckbox.checked) drawPanels();
      // price
      const w = getWidthInches(), h = getHeightInches();
      if (w>0 && h>0) {
        const area = w*h/144;
        const total = (currentVariant.price/100)*area;
        priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
        if (qtyInput) qtyInput.value = area.toFixed(2);
      }
    }

    // Listeners
    variantSelect.addEventListener('change', e=>{
      currentIdx = +e.target.value;
      currentVariant = product.variants[currentIdx];
      flipSelect.value='none'; bwCheckbox.checked=false; panelsCheckbox.checked=false;
      renderImage(currentVariant,currentIdx);
      recalc();
    });
    unitSelect.addEventListener('change', ()=>{
      const feetMode = unitSelect.value==='feet';
      [widthInput,heightInput].forEach(el=>el.style.display = feetMode?'none':'inline-block');
      [widthFeetInput,widthInchesInput,heightFeetInput,heightInchesInput]
        .forEach(el=>el.style.display = feetMode?'inline-block':'none');
      recalc();
    });
    [widthInput,heightInput,widthFeetInput,widthInchesInput,heightFeetInput,heightInchesInput]
      .forEach(el=>el.addEventListener('input', recalc));
    flipSelect.addEventListener('change', recalc);
    bwCheckbox.addEventListener('change', recalc);
    panelsCheckbox.addEventListener('change', recalc);

    console.log('Customizer initialized');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadCropper().then(initCustomizer).catch(err=>console.error(err));
  });
})();
