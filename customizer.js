// public/customizer.js
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('mural-customizer');
    if (!container) {
      console.warn('Mural Customizer: container not found');
      return;
    }

    // 1) Parse your product JSON
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Mural Customizer: failed to parse product JSON', err);
      return;
    }
    console.log('Mural Customizer: product loaded', product);

    // 2) Build the basic UI
    const variantSelect = document.createElement('select');
    product.variants.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text = v.title;
      variantSelect.appendChild(opt);
    });
    const widthInput  = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Width (in)',  min: 1 });
    const heightInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Height (in)', min: 1 });
    const priceDisplay = document.createElement('div');
    priceDisplay.innerText = 'Price: $0.00';
    container.append(variantSelect, widthInput, heightInput, priceDisplay);

    // 3) Find the Shopify quantity input
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) {
      qtyInput.step = 'any';
      qtyInput.min  = 0;
    }

    // 4) Image + Cropper.js
    let cropper, imgEl;
    function renderImage(variant) {
      // teardown old
      if (cropper) {
        cropper.destroy();
        imgEl.remove();
      }

      // figure out a valid src
      let src =
        (variant.image && variant.image.src) ||
        (variant.featured_image && variant.featured_image.src) ||
        (product.images  && product.images[0]);
      if (!src) {
        console.error('Mural Customizer: no image found for variant', variant);
        return;
      }
      // prefix protocol for URLs that start //
      if (src.startsWith('//')) {
        src = window.location.protocol + src;
      }

      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.maxWidth = '100%';
      container.appendChild(imgEl);

      imgEl.addEventListener('load', () => {
        cropper = new Cropper(imgEl, {
          viewMode:    1,
          autoCropArea:1,
          movable:     true,
          zoomable:    false,
          scalable:    false,
        });
      });
    }

    // 5) Wire up variant selection
    let currentVariant = product.variants[0];
    renderImage(currentVariant);
    variantSelect.addEventListener('change', e => {
      currentVariant = product.variants[e.target.value];
      renderImage(currentVariant);
      recalc();
    });

    // 6) Recalculate price & quantity
    function recalc() {
      const w = parseFloat(widthInput.value);
      const h = parseFloat(heightInput.value);
      if (!(w > 0 && h > 0)) return;

      const areaSqIn  = w * h;
      const areaSqFt  = areaSqIn / 144;
      const unitPrice = currentVariant.price / 100;
      const total     = unitPrice * areaSqFt;

      priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
      if (qtyInput) qtyInput.value = areaSqFt.toFixed(2);
    }
    widthInput.addEventListener('input',  recalc);
    heightInput.addEventListener('input', recalc);

    console.log('Mural Customizer initialized');
  });
})();
