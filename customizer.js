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

    // Build UI
    const variantSelect = document.createElement('select');
    product.variants.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text  = v.title;
      variantSelect.appendChild(opt);
    });

    // Default to variant index 1 if it exists
    const defaultIndex = product.variants.length > 1 ? 1 : 0;
    variantSelect.selectedIndex = defaultIndex;

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
    if (qtyInput) {
      qtyInput.step = 'any';
      qtyInput.min  = 0;
    }

    // Image + Cropper
    let cropper, imgEl;
    function renderImage(variant) {
      if (cropper) { cropper.destroy(); imgEl.remove(); }

      // Safe lookup: variant.image → featured_image → product.images[1] → [0]
      let src =
        variant.image?.src ??
        variant.featured_image?.src ??
        (Array.isArray(product.images) && product.images.length > 1
          ? product.images[1]
          : product.images[0]);

      if (!src) {
        console.error('Customizer: no image for variant', variant);
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
        // Apply current aspect ratio if dimensions are set
        updateAspectRatio();
      };
    }

    // Variant change
    let currentVariant = product.variants[defaultIndex];
    renderImage(currentVariant);
    variantSelect.addEventListener('change', (e) => {
      currentVariant = product.variants[e.target.value];
      renderImage(currentVariant);
      recalc();
    });

    // Update crop-box aspect ratio based on inputs
    function updateAspectRatio() {
      const w = parseFloat(widthInput.value);
      const h = parseFloat(heightInput.value);
      if (cropper && w > 0 && h > 0) {
        cropper.setAspectRatio(w / h);
      }
    }

    // Price & quantity calculation
    function recalc() {
      const w = parseFloat(widthInput.value);
      const h = parseFloat(heightInput.value);
      if (!(w > 0 && h > 0)) return;

      // Update aspect ratio first
      updateAspectRatio();

      // Compute area & price
      const areaSqIn  = w * h;
      const areaSqFt  = areaSqIn / 144;
      const unitPrice = currentVariant.price / 100;
      const total     = unitPrice * areaSqFt;

      priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
      if (qtyInput) qtyInput.value = areaSqFt.toFixed(2);
    }
    widthInput .addEventListener('input', recalc);
    heightInput.addEventListener('input', recalc);

    console.log('Customizer initialized');
  }

  // 3) Load Cropper & init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    loadCropper()
      .then(initCustomizer)
      .catch(err => console.error('Customizer: failed to load Cropper.js', err));
  });
})();
