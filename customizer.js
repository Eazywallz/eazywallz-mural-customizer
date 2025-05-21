// public/customizer.js
;(function () {
  // Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return;

    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch { console.error('Invalid product JSON'); return; }

    // Add "Open Customizer" button
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.innerText = 'Customize Mural';
    Object.assign(openBtn.style, { margin: '1rem 0', padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' });
    container.appendChild(openBtn);

    // Modal overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', display: 'none',
      alignItems: 'center', justifyContent: 'center', zIndex: 10000
    });
    document.body.appendChild(overlay);

    // Modal box
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      background: '#fff', borderRadius: '8px',
      width: '75vw', height: '75vh', maxWidth: '1200px', maxHeight: '900px',
      position: 'relative', display: 'flex', flexDirection: 'column'
    });
    overlay.appendChild(modal);

    // Close button
    const closeBtn = document.createElement('button'); closeBtn.type = 'button'; closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '10px', right: '10px',
      fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer'
    });
    modal.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => {
      console.log('Closing modal');
      overlay.style.display = 'none';
    });

    // Controls
    const controls = document.createElement('div');
    Object.assign(controls.style, {
      padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #ddd'
    });
    modal.appendChild(controls);

    // Canvas area
    const canvasArea = document.createElement('div');
    Object.assign(canvasArea.style, { flex: '1', position: 'relative', overflow: 'hidden' });
    modal.appendChild(canvasArea);

    // Footer
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    });
    modal.appendChild(footer);

    // Elements
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; unitSelect.appendChild(o);
    }); controls.appendChild(unitSelect);

    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => {
      const o = document.createElement('option'); o.value = i; o.text = v.title; variantSelect.appendChild(o);
    }); controls.appendChild(variantSelect);

    const widthInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Width', min: 1 });
    const heightInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Height', min: 1 });
    controls.append(widthInput, heightInput);

    const widthFeet = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Feet', min: 0, maxLength: 3, hidden: true });
    const widthInches = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Inches', min: 0, max: 11, maxLength: 2, hidden: true });
    const heightFeet = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Feet', min: 0, maxLength: 3, hidden: true });
    const heightInches = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Inches', min: 0, max: 11, maxLength: 2, hidden: true });
    controls.append(widthFeet, widthInches, heightFeet, heightInches);

    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; flipSelect.appendChild(o);
    }); controls.appendChild(flipSelect);

    const bwCheckbox = document.createElement('input'); bwCheckbox.type = 'checkbox';
    controls.append(document.createTextNode(' B&W '), bwCheckbox);

    const panelsCheckbox = document.createElement('input'); panelsCheckbox.type = 'checkbox';
    controls.append(document.createTextNode(' Show panels '), panelsCheckbox);

    const priceDiv = document.createElement('div'); priceDiv.innerText = 'Price: $0.00'; footer.appendChild(priceDiv);
    const addBtn = document.createElement('button'); addBtn.type = 'button'; addBtn.innerText = 'Add to Cart';
    Object.assign(addBtn.style, { padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' });
    footer.appendChild(addBtn);

    const qtyInput = document.querySelector('input[name="quantity"]'); if (qtyInput) { qtyInput.step = '1'; qtyInput.min = 1; }

    // Cropper
    let cropper, imgEl;
    function clearCanvas() { if (cropper) cropper.destroy(); canvasArea.innerHTML = ''; }
    function renderImage() {
      clearCanvas();
      const variant = product.variants[variantSelect.value];
      let src = variant.image?.src || variant.featured_image?.src || product.images[0];
      if (src.startsWith('//')) src = location.protocol + src;
      imgEl = document.createElement('img'); imgEl.src = src;
      imgEl.onload = () => {
        canvasArea.appendChild(imgEl);
        cropper = new Cropper(imgEl, {
          viewMode: 1, autoCropArea: 1,
          dragMode: 'move', cropBoxMovable: true, cropBoxResizable: false,
          zoomable: false, scalable: false
        });
        updateAll(); if (panelsCheckbox.checked) drawPanels();
      };
    }

    function toInches(v) { return unitSelect.value === 'cm' ? v * 0.393700787 : v; }
    function getWidthInches() {
      return unitSelect.value === 'feet'
        ? (+widthFeet.value || 0) * 12 + (+widthInches.value || 0)
        : toInches(+widthInput.value || 0);
    }
    function getHeightInches() {
      return unitSelect.value === 'feet'
        ? (+heightFeet.value || 0) * 12 + (+heightInches.value || 0)
        : toInches(+heightInput.value || 0);
    }

    function updateAll() {
      const w = getWidthInches(), h = getHeightInches();
      if (cropper && w > 0 && h > 0) {
        cropper.setAspectRatio(w / h);
        const sqft = Math.ceil((w * h) / 144) || 1;
        const rawPriceCents = parseFloat(product.variants[variantSelect.value].price);
        const unitPrice = rawPriceCents / 100;
        priceDiv.innerText = `Price: $${(unitPrice * sqft).toFixed(2)}`;
        if (qtyInput)
