// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      // Load JS
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

  // 2) Initialize the customizer
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) {
      console.warn('Mural Customizer: container missing');
      return;
    }

    // Constrain widget width and center it
    container.style.maxWidth = '500px';
    container.style.margin   = '1rem auto';

    // Parse product JSON from the data attribute
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Mural Customizer: failed to parse product JSON', err);
      return;
    }
    console.log('Mural Customizer: product loaded', product);

    // Build UI elements
    const variantSelect = document.createElement('select');
    product.variants.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text  = v.title;
      variantSelect.appendChild(opt);
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

    // Locate Shopify's quantity input
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) {
      qtyInput.step = 'any';
      qtyInput.min  = 0;
    }

    // Image + Cropper setup
    let cropper, imgEl;
    function renderImage(variant) {
      // Remove prior cropper + image
      if (cropper) { cropper.destroy(); imgEl.remove(); }

      // Determine image src
      let src =
        (variant.image && variant.image.src) ||
        (variant.featured_image && variant.featured_image.src) ||
        (product.images && product.images[0]);
      if (!src) {
        console.error('Mural Customizer: no image for variant', variant);
        return;
      }
      if (src.startsWith('//')) {
        src = window.location.protocol + src;
      }

      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.width   = '100%';
      imgEl.style.display = 'block';
      container.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:        1,           // restrict the crop box to not exceed the canvas
          autoCropArea:    1,           // start with the full image cropped
          dragMode:        'none',      // disable dragging the image itself
          cropBoxMovable:  true,        // allow moving the crop box
          cropBoxResizable:true,        // allow resizing the crop box
          zoomable:        false,       // disable pinch-zoom
          scalable:        false        // disable double-click to scale
        });
      };
    }

    // Handle variant changes
    let currentVariant = product.variants[1];
    renderImage(currentVariant);
    variantSelect.addEventListener('change', (e) => {
      currentVariant = product.variants[e.target.value];
      renderImage(currentVariant);
      recalc();
    });

    // Price & quantity calculations
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

  // 3) Kick things off once the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    loadCropper()
      .then(initCustomizer)
      .catch(err =>
        console.error('Mural Customizer: failed loading Cropper.js', err)
      );
  });
})();
