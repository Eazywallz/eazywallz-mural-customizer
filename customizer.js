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

    // Layout constraints
    container.style.maxWidth = '500px';
    container.style.margin   = '1rem auto';

    // Parse product JSON
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Customizer: invalid product JSON', err);
      return;
    }
    console.log('Customizer: product loaded', product);

    // Build controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.gap = '0.5rem';
    controls.style.marginBottom = '1rem';

    // Unit dropdown
    const unitSelect = document.createElement('select');
    [['inches', 'Inches'], ['feet', 'Feet'], ['cm', 'Centimeters']].forEach(([v,t])=>{
      const o=document.createElement('option'); o.value=v; o.text=t; unitSelect.appendChild(o);
    });

    // Variant dropdown
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o=document.createElement('option'); o.value=i; o.text=v.title; variantSelect.appendChild(o);
    });
    const defaultIndex = product.variants.length>1 ? 1 : 0;
    variantSelect.selectedIndex = defaultIndex;

    // Dimension inputs
    const widthInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width', min:1 });
    const heightInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height', min:1 });

    // Flip dropdown (none/horizontal/vertical)
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t])=>{
      const o=document.createElement('option'); o.value=v; o.text=t; flipSelect.appendChild(o);
    });

    // B&W checkbox
    const bwCheckbox = document.createElement('input'); bwCheckbox.type='checkbox';
    const bwLabel = document.createElement('label'); bwLabel.append(bwCheckbox, document.createTextNode(' B&W'));

    controls.append(unitSelect, variantSelect, widthInput, heightInput, flipSelect, bwLabel);
    container.appendChild(controls);

    // Price display
    const priceDisplay = document.createElement('div'); priceDisplay.innerText='Price: $0.00';
    container.appendChild(priceDisplay);

    // Shopify quantity field
    const qtyInput = document.querySelector('input[name="quantity"]');
    if(qtyInput){ qtyInput.step='any'; qtyInput.min=0; }

    let cropper, imgEl;

    // Remove previous cropper container + image
    function clearCropper() {
      if(cropper) {
        cropper.destroy();
        const wrapper = container.querySelector('.cropper-container');
        if(wrapper) wrapper.remove();
        cropper = null;
      }
      // Also remove any imgEl if still present (edge-case)
      if(imgEl && imgEl.parentNode===container) imgEl.remove();
    }

    function renderImage(variant, idx) {
      clearCropper();
      let src = variant.image?.src ?? variant.featured_image?.src
        ?? ((Array.isArray(product.images) && product.images[idx])?product.images[idx]:product.images[0]);
      if(!src){ console.error('Customizer: no image for variant',variant); return; }
      if(src.startsWith('//')) src = location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.width='100%';
      imgEl.style.display='block';
      container.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:1, autoCropArea:1,
          dragMode:'none', cropBoxMovable:true, cropBoxResizable:true,
          zoomable:false, scalable:false
        });
        updateAspectRatio();
        applyFlips();
        applyBW();
      };
    }

    let currentIdx = defaultIndex;
    let currentVariant = product.variants[currentIdx];
    renderImage(currentVariant, currentIdx);

    variantSelect.addEventListener('change', e=>{
      currentIdx = +e.target.value;
      currentVariant = product.variants[currentIdx];
      flipSelect.value = 'none';
      bwCheckbox.checked = false;
      renderImage(currentVariant, currentIdx);
      recalc();
    });

    function toInches(val) {
      const n=parseFloat(val);
      if(!(n>0)) return NaN;
      switch(unitSelect.value) {
        case 'feet': return n*12;
        case 'cm':  return n*0.393700787;
        default:    return n;
      }
    }

    function updateAspectRatio() {
      const w=toInches(widthInput.value), h=toInches(heightInput.value);
      if(cropper && w>0 && h>0) cropper.setAspectRatio(w/h);
    }

    function applyFlips() {
      const wrapper = container.querySelector('.cropper-container');
      if(!wrapper) return;
      const sx = flipSelect.value==='horizontal' ? -1 : 1;
      const sy = flipSelect.value==='vertical'   ? -1 : 1;
      wrapper.style.transform = `scale(${sx}, ${sy})`;
      wrapper.style.transformOrigin = 'center';
    }
    flipSelect.addEventListener('change', applyFlips);

    function applyBW() {
      const wrapper = container.querySelector('.cropper-container');
      if(!wrapper) return;
      wrapper.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : '';
    }
    bwCheckbox.addEventListener('change', applyBW);

    function recalc() {
      const w=toInches(widthInput.value), h=toInches(heightInput.value);
      if(!(w>0 && h>0)) return;
      updateAspectRatio();
      const areaSqIn = w*h;
      const areaSqFt = areaSqIn/144;
      const unitPrice = currentVariant.price/100;
      const total = unitPrice*areaSqFt;
      priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
      if(qtyInput) qtyInput.value = areaSqFt.toFixed(2);
    }
    widthInput.addEventListener('input', recalc);
    heightInput.addEventListener('input', recalc);
    unitSelect.addEventListener('change', recalc);

    console.log('Customizer initialized');
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCropper().then(initCustomizer).catch(err => console.error('Customizer failed', err));
  });
})();
