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
      position: 'relative'
    });
    overlay.appendChild(modal);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      fontSize: '1.5rem',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer'
    });
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');
    modal.appendChild(closeBtn);

    const canvasWrapper = document.createElement('div');
    Object.assign(canvasWrapper.style, {
      flex: '1',
      position: 'relative'
    });
    modal.appendChild(canvasWrapper);

    const controls = document.createElement('div');
    Object.assign(controls.style, {
      padding: '1rem',
      borderTop: '1px solid #ddd',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center'
    });
    modal.appendChild(controls);

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
    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.id = 'fabric-canvas';
    fabricCanvas.width = canvasWrapper.clientWidth;
    fabricCanvas.height = canvasWrapper.clientHeight;
    canvasWrapper.appendChild(fabricCanvas);

    canvas = new fabric.Canvas('fabric-canvas', {
      backgroundColor: '#fff',
      preserveObjectStacking: true
    });

    function loadImage() {
      const variant = product.variants[0];
      let src = variant.image?.src || variant.featured_image?.src || product.images[1];
      if (src.startsWith('//')) src = window.location.protocol + src;

      fabric.Image.fromURL(src, (img) => {
        canvas.clear();
        imgObj = img;
        img.set({
          left: 0,
          top: 0,
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height,
          selectable: false
        });
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
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
