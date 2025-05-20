// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      // CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      // JS
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = () => {
        console.log('Mural Customizer: Cropper.js loaded');
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  // 2) Main init
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return console.warn('Mural Customizer: container missing');

    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (e) {
      return console.error('Failed to parse product JSON', e);
    }
    console.log('Mural Customizer: product loaded', product);

    // Build UI
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

    // Find Shopify quantity field
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step = 'any'; qtyInput.min = 0; }

    // Image + Cropper
    let cropper, imgEl;
    function renderImage(variant) {
      if (cropper) { cropper.destroy(); imgEl.remove(); }

      // fallback if variant.image is missing
      let src =
        (variant.image && variant.image.src) ||
        (variant.featured_image && variant.featured_image.src) ||
        (product.images && product.images[0]);
      if (!src) return console.error('No image for', variant);

      if (src.startsWith('//'))
        src = window.location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.maxWidth = '100%';
      container.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:    1,
          autoCropArea:1,
          movable:     true,
          zoomable:    false,
          scalable:    false,
        });
      };
    }

    // Variant change handler
    let currentVariant = product.variants[0];
    renderImage(currentVariant);
    variantSelect.addEventListener('change', e => {
      currentVariant = product.variants[e.target.value];
      renderImage(currentVariant);
      recalc();
    });

    // Price & quantity calculation
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

    console.log('Mural Customizer initialized');
  }

  // 3) Wait DOM + load Cropper → init
  document.addEventListener('DOMContentLoaded', () => {
    loadCropper()
      .then(initCustomizer)
      .catch(err =>
        console.error('Mural Customizer: failed to load Cropper.js', err)
      );
  });
})();
