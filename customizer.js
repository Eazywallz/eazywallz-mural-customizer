// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src     = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload  = () => { console.log('Cropper.js loaded'); resolve(); };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  // 2) Initialize the customizer
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) {
      console.warn('Customizer: container missing');
      return;
    }

    container.style.maxWidth = '500px';
    container.style.margin   = '1rem auto';

    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Customizer: invalid product JSON', err);
      return;
    }
    console.log('Customizer: product loaded', product);

    // Control panel
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = 'flex';
    controlsDiv.style.flexWrap = 'wrap';
    controlsDiv.style.gap = '0.5rem';
    controlsDiv.style.marginBottom = '1rem';

    // Unit selector
    const unitSelect = document.createElement('select');
    [['inches','Inches'], ['feet','Feet'], ['cm','Centimeters']]
      .forEach(([val, txt]) => {
        const opt = document.createElement('option'); opt.value = val; opt.text = txt;
        unitSelect.appendChild(opt);
      });

    // Variant selector
    const variantSelect = document.createElement('select');
    product.variants.forEach((v, i) => {
      const opt = document.createElement('option'); opt.value = i; opt.text = v.title;
      variantSelect.appendChild(opt);
    });
    const defaultIndex = product.variants.length > 1 ? 1 : 0;
    variantSelect.selectedIndex = defaultIndex;

    // Dimension inputs
    const widthInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width', min:1 });
    const heightInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height', min:1 });

    // Flip selector (no label needed separate)
    const flipSelect = document.createElement('select');
    [['none','None'], ['horizontal','Flip Horizontal'], ['vertical','Flip Vertical'], ['both','Flip Both']]
      .forEach(([val, txt]) => { const o = document.createElement('option'); o.value = val; o.text = txt; flipSelect.appendChild(o); });

    // Black & White toggle
    const bwLabel = document.createElement('label');
    const bwCheckbox = document.createElement('input'); bwCheckbox.type = 'checkbox';
    bwLabel.append(bwCheckbox, document.createTextNode(' B&W'));

    // Append controls
    controlsDiv.append(unitSelect, variantSelect, widthInput, heightInput, flipSelect, bwLabel);
    container.appendChild(controlsDiv);

    // Price display
    const priceDisplay = document.createElement('div'); priceDisplay.innerText = 'Price: $0.00';
    container.appendChild(priceDisplay);

    // Shopify quantity
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step='any'; qtyInput.min=0; }

    let cropper, imgEl;
    let flipX=false, flipY=false;

    function renderImage(variant, idx) {
      if (cropper) { cropper.destroy(); imgEl.remove(); }
      let src = variant.image?.src ?? variant.featured_image?.src
        ?? ((Array.isArray(product.images) && product.images[idx]) ? product.images[idx] : product.images[0]);
      if (!src) { console.error('Customizer: no image', variant); return; }
      if (src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img'); imgEl.src = src;
      imgEl.style.width='100%'; imgEl.style.display='block';
      container.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:1, autoCropArea:1,
          dragMode:'none', cropBoxMovable:true, cropBoxResizable:true,
          zoomable:false, scalable:false
        });
        updateAspectRatio();
        // reset flips
        flipX=flipY=false;
        cropper.scaleX(1); cropper.scaleY(1);
        applyFlips();
        applyBW();
      };
    }

    let currentIdx = defaultIndex;
    let currentVariant = product.variants[currentIdx];
    renderImage(currentVariant, currentIdx);

    variantSelect.addEventListener('change', e => {
      currentIdx = parseInt(e.target.value,10);
      currentVariant = product.variants[currentIdx];
      renderImage(currentVariant, currentIdx);
      recalc();
    });

    function toInches(v) {
      const n=parseFloat(v); if(!(n>0))return NaN;
      switch(unitSelect.value) {
        case 'feet': return n*12;
        case 'cm': return n*0.393700787;
        default: return n;
      }
    }

    function updateAspectRatio() {
      const w = toInches(widthInput.value), h = toInches(heightInput.value);
      if(cropper && w>0 && h>0) cropper.setAspectRatio(w/h);
    }

    function applyFlips() {
      if(!cropper) return;
      const wantX = flipSelect.value==='horizontal' || flipSelect.value==='both';
      if(wantX!==flipX){ cropper.scaleX(-1); flipX=wantX; }
      const wantY = flipSelect.value==='vertical' || flipSelect.value==='both';
      if(wantY!==flipY){ cropper.scaleY(-1); flipY=wantY; }
    }
    flipSelect.addEventListener('change', applyFlips);

    function applyBW() {
      if(!cropper) return;
      imgEl.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : '';
    }
    bwCheckbox.addEventListener('change', applyBW);

    function recalc() {
      const w = toInches(widthInput.value), h = toInches(heightInput.value);
      if(!(w>0&&h>0)) return;
      updateAspectRatio();
      const areaSqIn = w*h, areaSqFt=areaSqIn/144;
      const unitPrice=currentVariant.price/100, total=unitPrice*areaSqFt;
      priceDisplay.innerText=`Price: $${total.toFixed(2)}`;
      if(qtyInput) qtyInput.value=areaSqFt.toFixed(2);
    }
    widthInput.addEventListener('input', recalc);
    heightInput.addEventListener('input', recalc);
    unitSelect.addEventListener('change', recalc);

    console.log('Customizer initialized');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadCropper().then(initCustomizer).catch(err=>console.error('Customizer: failed to load Cropper.js', err));
  });
})();
