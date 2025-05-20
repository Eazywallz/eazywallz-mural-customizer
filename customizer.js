// public/customizer.js
;(function () {
  // 1) Grab container + parse product JSON
  const container = document.getElementById('mural-customizer');
  if (!container) return;
  const product = JSON.parse(container.dataset.product);

  // 2) Build UI
  // Variant selector
  const variantSelect = document.createElement('select');
  product.variants.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.text = v.title;
    variantSelect.appendChild(opt);
  });

  // Dimension inputs
  const widthInput  = Object.assign(document.createElement('input'), {
    type: 'number',
    placeholder: 'Width (in)',
    min: 1,
  });
  const heightInput = Object.assign(document.createElement('input'), {
    type: 'number',
    placeholder: 'Height (in)',
    min: 1,
  });

  // Price display
  const priceDisplay = document.createElement('div');
  priceDisplay.innerText = 'Price: $0.00';

  // Append all to container
  container.append(variantSelect, widthInput, heightInput, priceDisplay);

  // 3) Find Shopify quantity input in the form
  const qtyInput = document.querySelector(
    'form[action^="/cart"] input[name="quantity"]'
  );
  if (qtyInput) {
    qtyInput.step = 'any'; // allow decimals
    qtyInput.min = 0;
  }

  // 4) Set up image + Cropper.js
  let cropper, imgEl;
  function renderImage(variant) {
    // remove old
    if (cropper) {
      cropper.destroy();
      imgEl.remove();
    }
    // new <img>
    imgEl = document.createElement('img');
    imgEl.src = variant.image.src;
    imgEl.style.maxWidth = '100%';
    imgEl.id = 'mural-image';
    container.appendChild(imgEl);

    imgEl.addEventListener('load', () => {
      cropper = new Cropper(imgEl, {
        viewMode: 1,
        autoCropArea: 1,
        movable: true,
        zoomable: false,
        scalable: false,
      });
    });
  }

  // 5) Handle variant change
  let currentVariant = product.variants[0];
  renderImage(currentVariant);
  variantSelect.addEventListener('change', (e) => {
    currentVariant = product.variants[e.target.value];
    renderImage(currentVariant);
    recalc();
  });

  // 6) Calculation logic
  function recalc() {
    const w = parseFloat(widthInput.value);
    const h = parseFloat(heightInput.value);
    if (!(w > 0 && h > 0)) return;

    // area in square inches → square feet
    const areaSqIn  = w * h;
    const areaSqFt  = areaSqIn / 144;
    const unitPrice = currentVariant.price / 100; // cents → dollars
    const total     = unitPrice * areaSqFt;

    // update display
    priceDisplay.innerText = `Price: $${total.toFixed(2)}`;

    // update cart quantity (as area in sq ft)
    if (qtyInput) qtyInput.value = areaSqFt.toFixed(2);
  }

  // trigger recalculation on dimension change
  widthInput.addEventListener('input',  recalc);
  heightInput.addEventListener('input', recalc);
})();
