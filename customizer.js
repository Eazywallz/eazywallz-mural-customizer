;(function () {
  // 1) Dynamically load Cropper.js & CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload  = () => { console.log('Cropper.js loaded'); resolve(); };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  // 2) Initialize the customizer
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return console.warn('Customizer: missing container');

    // Style constraints
    container.style.maxWidth = '500px';
    container.style.margin   = '1rem auto';

    // Parse product JSON
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (e) {
      return console.error('Customizer: invalid product JSON', e);
    }
    console.log('Customizer: product', product);

    // UI: variant select, width/height inputs, price display
    const variantSelect = document.createElement('select');
    product.variants.forEach((v, i) => {
      const o = document.createElement('option');
      o.value = i; o.text = v.title;
      variantSelect.append(o);
    });
    const widthInput = Object.assign(document.createElement('input'), {
      type: 'number', placeholder: 'Width (in)', min: 1
    });
    const heightInput = Object.assign(document.createElement('input'), {
      type: 'number', placeholder: 'Height (in)', min: 1
    });
    const priceDisplay = document.createElement('div');
    priceDisplay.innerText = 'Price: $0.00';

    container.append(variantSelect, widthInput, heightInput, priceDisplay);

    // Shopify quantity field
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step = 'any'; qtyInput.min = 0; }

    // Image + Cropper
    let cropper, imgEl;
    function renderImage(variant) {
      // Cleanup old
      if (cropper) { cropper.destroy(); imgEl.remove(); }

      // Safe lookup with optional chaining
      let src =
        variant.image?.src ??
        variant.featured_image?.src ??
        (Array.isArray(product.images) ? product.images[0] : null);

      if (!src) {
        console.error('Customizer: no image URL found for variant', variant);
        return;
      }
      if (src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src       = src;
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
          scalable:         false,
        });
      };
    }

    // Variant change handler
    let currentVariant = product.variants[1];
    renderImage(currentVariant);
    variantSelect.addEventListener('change', (e) => {
      currentVariant = product.variants[e.target.value];
      renderImage(currentVariant);
      recalc();
    });

    // Price & quantity calc
    function recalc() {
      const w = parseFloat(widthInput.value),
            h = parseFloat(heightInput.value);
      if (!(w > 0 && h > 0)) return;

      const areaSqIn  = w * h,
            areaSqFt  = areaSqIn / 144,
            unitPrice = currentVariant.price / 100,
            total     = unitPrice * areaSqFt;

      priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
      if (qtyInput) qtyInput.value = areaSqFt.toFixed(2);
    }
    widthInput .addEventListener('input', recalc);
    heightInput.addEventListener('input', recalc);

    console.log('Customizer initialized');
  }

  // 3) Load and init
  document.addEventListener('DOMContentLoaded', () => {
    loadCropper()
      .then(initCustomizer)
      .catch(err =>
        console.error('Customizer: failed loading Cropper.js', err)
      );
  });
})();
