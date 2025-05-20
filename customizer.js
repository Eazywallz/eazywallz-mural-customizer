// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      // CSS
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      // JS
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

    // Constrain widget width and center it
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

    //
    // Build UI controls
    //

    // Unit selector
    const unitSelect = document.createElement('select');
    [
      ['inches', 'Inches'],
      ['feet',   'Feet'],
      ['cm',     'Centimeters']
    ].forEach(([val, txt]) => {
      const o = document.createElement('option');
      o.value = val; o.text = txt;
      unitSelect.appendChild(o);
    });

    // Variant selector
    const variantSelect = document.createElement('select');
    product.variants.forEach((v, i) => {
      const o = document.createElement('option');
      o.value = i; o.text = v.title;
      variantSelect.appendChild(o);
    });
    // default to variant #1 if it exists
    const defaultIndex = product.variants.length > 1 ? 1 : 0;
    variantSelect.selectedIndex = defaultIndex;

    // Dimension inputs
    const widthInput = Object.assign(document.createElement('input'), {
      type: 'number', placeholder: 'Width',  min: 1
    });
    const heightInput = Object.assign(document.createElement('input'), {
      type: 'number', placeholder: 'Height', min: 1
    });

    // Flip selector
    const flipSelect = document.createElement('select');
    [
      ['none',       'None'],
      ['horizontal','Flip Horizontal'],
      ['vertical',  'Flip Vertical'],
      ['both',      'Flip Both']
    ].forEach(([val, txt]) => {
      const o = document.createElement('option');
      o.value = val; o.text = txt;
      flipSelect.appendChild(o);
    });
    const flipLabel = document.createElement('label');
    flipLabel.textContent = 'Flip: ';
    flipLabel.appendChild(flipSelect);

    // Black & White toggle
    const bwCheckbox = document.createElement('input');
    bwCheckbox.type = 'checkbox';
    bwCheckbox.id   = 'bw-toggle';
    const bwLabel = document.createElement('label');
    bwLabel.htmlFor = 'bw-toggle';
    bwLabel.textContent = 'Black & White';
    bwLabel.prepend(bwCheckbox);

    // Price display
    const priceDisplay = document.createElement('div');
    priceDisplay.innerText = 'Price: $0.00';

    // Append controls
    container.append(
      unitSelect,
      variantSelect,
      widthInput,
      heightInput,
      flipLabel,
      bwLabel,
      priceDisplay
    );

    // Shopify quantity field
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) {
      qtyInput.step = 'any';
      qtyInput.min  = 0;
    }

    //
    // Image + Cropper logic
    //

    let cropper, imgEl;
    let flipX = false, flipY = false;

    function renderImage(variant, variantIndex) {
      if (cropper) { cropper.destroy(); imgEl.remove(); }

      // Safe lookup: variant.image -> featured_image -> product.images[variantIndex] -> [0]
      let src =
        variant.image?.src ??
        variant.featured_image?.src ??
        (Array.isArray(product.images) && product.images[variantIndex]
          ? product.images[variantIndex]
          : product.images[0]
        );
      if (!src) {
        console.error('Customizer: no image for variant', variant);
        return;
      }
      if (src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src           = src;
      imgEl.style.width   = '100%';
      imgEl.style.display = 'block';
      container.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:         1,
          autoCropArea:     1,
          dragMode:         'none',
          cropBoxMovable:   true,
          cropBoxResizable: true,
          zoomable:         false,
          scalable:         false
        });
        // re-apply state
        updateAspectRatio();
        applyFlips();
        applyBW();
      };
    }

    // start with default variant
    let currentVariantIndex = defaultIndex;
    let currentVariant = product.variants[currentVariantIndex];
    renderImage(currentVariant, currentVariantIndex);

    // Variant change handler
    variantSelect.addEventListener('change', e => {
      currentVariantIndex = parseInt(e.target.value, 10);
      currentVariant = product.variants[currentVariantIndex];
      // reset flips & bw
      flipX = flipY = false;
      flipSelect.value = 'none';
      bwCheckbox.checked = false;
      renderImage(currentVariant, currentVariantIndex);
      recalc();
    });

    // Convert any unit to inches
    function toInches(val) {
      const v = parseFloat(val);
      if (!(v > 0)) return NaN;
      switch (unitSelect.value) {
        case 'feet': return v * 12;
        case 'cm':   return v * 0.393700787;
        default:     return v;
      }
    }

    // Update crop-box aspect ratio
    function updateAspectRatio() {
      const w = toInches(widthInput.value);
      const h = toInches(heightInput.value);
      if (cropper && w > 0 && h > 0) {
        cropper.setAspectRatio(w / h);
      }
    }

    // Flip logic
    function applyFlips() {
      if (!cropper) return;
      const wantX = flipSelect.value === 'horizontal' || flipSelect.value === 'both';
      if (wantX !== flipX) {
        cropper.scaleX(-1);
        flipX = wantX;
      }
      const wantY = flipSelect.value === 'vertical' || flipSelect.value === 'both';
      if (wantY !== flipY) {
        cropper.scaleY(-1);
        flipY = wantY;
      }
    }
    flipSelect.addEventListener('change', applyFlips);

    // Black & White logic
    function applyBW() {
      if (!imgEl) return;
      imgEl.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : '';
    }
    bwCheckbox.addEventListener('change', applyBW);

    // Price & quantity calculation
    function recalc() {
      const w = toInches(widthInput.value);
      const h = toInches(heightInput.value);
      if (!(w > 0 && h > 0)) return;

      updateAspectRatio();

      const areaSqIn  = w * h;
      const areaSqFt  = areaSqIn / 144;
      const unitPrice = currentVariant.price / 100;
      const total     = unitPrice * areaSqFt;

      priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
      if (qtyInput) qtyInput.value = areaSqFt.toFixed(2);
    }
    widthInput .addEventListener('input', recalc);
    heightInput.addEventListener('input', recalc);
    unitSelect .addEventListener('change', recalc);

    console.log('Customizer initialized');
  }

  // 3) Load Cropper.js & init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    loadCropper()
      .then(initCustomizer)
      .catch(err => console.error('Customizer: failed to load Cropper.js', err));
  });
})();






