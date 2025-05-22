// public/customizer.js
;(function () {
  function loadFabric() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
      script.onload = () => { console.log('Fabric.js loaded'); resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) {
      console.warn('Customizer: container missing');
      return;
    }
    container.style.maxWidth = '500px';
    container.style.margin = '1rem auto';

    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Customizer: invalid product JSON', err);
      return;
    }

    const openBtn = document.createElement('button');
    openBtn.innerText = 'Customize Mural';
    Object.assign(openBtn.style, {
      margin: '1rem 0',
      padding: '0.5rem 1rem',
      background: '#007bff',
      color: '#fff',
      border: 'none',
      cursor: 'pointer'
    });
    container.appendChild(openBtn);

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    });
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      background: '#fff',
      borderRadius: '8px',
      width: '75vw',
      height: '75vh',
      maxWidth: '1200px',
      maxHeight: '900px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    });
    overlay.appendChild(modal);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      fontSize: '1.5rem',
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      zIndex: '10001',
      cursor: 'pointer'
    });
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');
    modal.appendChild(closeBtn);

    const canvasWrapper = document.createElement('div');
    Object.assign(canvasWrapper.style, {
      flex: '1',
      position: 'relative',
      zIndex: '1',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    });
    modal.appendChild(canvasWrapper);

    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.id = 'fabric-canvas';
    canvasWrapper.appendChild(fabricCanvas);

    const controls = document.createElement('div');
    Object.assign(controls.style, {
      padding: '1rem',
      borderTop: '1px solid #ddd',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center'
    });
    modal.appendChild(controls);

    const widthInput = Object.assign(document.createElement('input'), {
      type: 'number',
      placeholder: 'Width (in)',
      min: 1,
      style: 'width: 100px;'
    });
    const heightInput = Object.assign(document.createElement('input'), {
      type: 'number',
      placeholder: 'Height (in)',
      min: 1,
      style: 'width: 100px;'
    });
    controls.appendChild(widthInput);
    controls.appendChild(heightInput);

    const priceDisplay = document.createElement('div');
    priceDisplay.id = 'price-display';
    priceDisplay.innerText = 'Price: $0.00';
    controls.appendChild(priceDisplay);

    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']]
      .forEach(([v,t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.text = t;
        flipSelect.appendChild(o);
      });
    controls.appendChild(flipSelect);

    const bwCheckbox = Object.assign(document.createElement('input'), { type: 'checkbox' });
    const bwLabel = document.createElement('label');
    bwLabel.textContent = ' B&W';
    controls.appendChild(bwCheckbox);
    controls.appendChild(bwLabel);

    const panelsCheckbox = Object.assign(document.createElement('input'), { type: 'checkbox' });
    const panelsLabel = document.createElement('label');
    panelsLabel.textContent = ' Show Panels';
    controls.appendChild(panelsCheckbox);
    controls.appendChild(panelsLabel);

    let canvas, imgObj;
    canvas = new fabric.Canvas('fabric-canvas', {
      backgroundColor: '#fff',
      preserveObjectStacking: true
    });

    function updatePrice() {
      const w = parseFloat(widthInput.value) || 0;
      const h = parseFloat(heightInput.value) || 0;
      if (w > 0 && h > 0) {
        const sqft = Math.ceil((w * h) / 144) || 1;
        const priceCents = +product.variants[0].price;
        priceDisplay.innerText = `Price: $${((priceCents / 100) * sqft).toFixed(2)}`;
      } else {
        priceDisplay.innerText = 'Price: $0.00';
      }
    }

    function applyAspectRatioCrop() {
      const w = parseFloat(widthInput.value);
      const h = parseFloat(heightInput.value);
      if (!imgObj || !w || !h) return;

      const aspect = w / h;
      const canvasWidth = canvasWrapper.clientWidth || 1000;
      const canvasHeight = canvasWrapper.clientHeight || 700;

      let cropW = imgObj.width;
      let cropH = cropW / aspect;

      if (cropH > imgObj.height) {
        cropH = imgObj.height;
        cropW = cropH * aspect;
      }

      imgObj.set({
        cropX: (imgObj.width - cropW) / 2,
        cropY: (imgObj.height - cropH) / 2,
        width: cropW,
        height: cropH,
        scaleX: canvasWidth / cropW,
        scaleY: canvasHeight / cropH,
        left: 0,
        top: 0
      });

      canvas.renderAll();
    }

    function loadImage() {
      const variant = product.variants[0];
      let src = variant.image?.src || variant.featured_image?.src || product.images[1];
      if (src.startsWith('//')) src = window.location.protocol + src;

      console.log('Loading image from:', src);

      fabric.Image.fromURL(src, (img) => {
        canvas.clear();
        imgObj = img;
        img.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          selectable: false
        });

        const canvasWidth = canvasWrapper.clientWidth || 1000;
        const canvasHeight = canvasWrapper.clientHeight || 700;

        fabricCanvas.width = canvasWidth;
        fabricCanvas.height = canvasHeight;
        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);

        canvas.add(imgObj);
        updatePrice();
        applyAspectRatioCrop();
        if (panelsCheckbox.checked) drawPanels();
        if (bwCheckbox.checked) applyBW();
      });
    }

    function drawPanels() {
      const panelCount = 4;
      const panelWidth = canvas.width / panelCount;
      for (let i = 1; i < panelCount; i++) {
        const line = new fabric.Line([i * panelWidth, 0, i * panelWidth, canvas.height], {
          stroke: 'red',
          strokeWidth: 2,
          selectable: false,
          evented: false
        });
        canvas.add(line);
      }
    }

    function applyFlip() {
      if (!imgObj) return;
      if (flipSelect.value === 'horizontal') {
        imgObj.set('flipX', true);
        imgObj.set('flipY', false);
      } else if (flipSelect.value === 'vertical') {
        imgObj.set('flipY', true);
        imgObj.set('flipX', false);
      } else {
        imgObj.set('flipX', false);
        imgObj.set('flipY', false);
      }
      canvas.renderAll();
    }

    function applyBW() {
      if (!imgObj) return;
      if (bwCheckbox.checked) {
        imgObj.filters = [new fabric.Image.filters.Grayscale()];
        imgObj.applyFilters();
      } else {
        imgObj.filters = [];
        imgObj.applyFilters();
      }
      canvas.renderAll();
    }

    widthInput.addEventListener('input', () => {
      updatePrice();
      applyAspectRatioCrop();
    });
    heightInput.addEventListener('input', () => {
      updatePrice();
      applyAspectRatioCrop();
    });
    flipSelect.addEventListener('change', applyFlip);
    bwCheckbox.addEventListener('change', applyBW);
    panelsCheckbox.addEventListener('change', loadImage);

    openBtn.addEventListener('click', () => {
      overlay.style.display = 'flex';
      loadImage();
    });
  }

  if (document.readyState !== 'loading') {
    loadFabric().then(initCustomizer).catch(console.error);
  } else {
    document.addEventListener('DOMContentLoaded', () =>
      loadFabric().then(initCustomizer).catch(console.error)
    );
  }
})();
