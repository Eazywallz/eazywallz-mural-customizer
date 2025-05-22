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
      flexDirection: 'row',
      overflow: 'hidden'
    });
    overlay.appendChild(modal);

    const leftPanel = document.createElement('div');
    Object.assign(leftPanel.style, {
      width: '25%',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      borderRight: '1px solid #ddd'
    });
    modal.appendChild(leftPanel);

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

    const rightCanvasWrapper = document.createElement('div');
    Object.assign(rightCanvasWrapper.style, {
      flex: '1',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#eee',
      overflow: 'hidden'
    });
    modal.appendChild(rightCanvasWrapper);

    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.id = 'fabric-canvas';
    rightCanvasWrapper.appendChild(fabricCanvas);

    const widthInput = Object.assign(document.createElement('input'), {
      type: 'number',
      placeholder: 'Width (in)',
      min: 1
    });
    const heightInput = Object.assign(document.createElement('input'), {
      type: 'number',
      placeholder: 'Height (in)',
      min: 1
    });
    const priceDisplay = document.createElement('div');
    priceDisplay.id = 'price-display';
    priceDisplay.innerText = 'Price: $0.00';

    [widthInput, heightInput, priceDisplay].forEach(el => leftPanel.appendChild(el));

    let canvas = new fabric.Canvas('fabric-canvas', {
      backgroundColor: '#fff',
      selection: false
    });

    let imgObj;

    function updateCanvasSize() {
      const w = parseFloat(widthInput.value);
      const h = parseFloat(heightInput.value);
      if (!w || !h) return;
      const containerWidth = rightCanvasWrapper.clientWidth;
      const containerHeight = rightCanvasWrapper.clientHeight;
      const containerAspect = containerWidth / containerHeight;
      const desiredAspect = w / h;

      let canvasWidth, canvasHeight;
      if (desiredAspect > containerAspect) {
        canvasWidth = containerWidth;
        canvasHeight = canvasWidth / desiredAspect;
      } else {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * desiredAspect;
      }

      canvas.setWidth(canvasWidth);
      canvas.setHeight(canvasHeight);
      fabricCanvas.width = canvasWidth;
      fabricCanvas.height = canvasHeight;

      if (imgObj) {
        centerImage();
      }

      updatePrice();
    }

    function centerImage() {
      imgObj.set({
        left: (canvas.getWidth() - imgObj.getScaledWidth()) / 2,
        top: (canvas.getHeight() - imgObj.getScaledHeight()) / 2
      });
      canvas.renderAll();
    }

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

    function loadImage() {
      const variant = product.variants[0];
      let src = variant.image?.src || variant.featured_image?.src || product.images[1];
      if (src.startsWith('//')) src = window.location.protocol + src;

      fabric.Image.fromURL(src, (img) => {
        canvas.clear();
        imgObj = img;

        img.set({
          originX: 'left',
          originY: 'top',
          scaleX: 1,
          scaleY: 1,
          hasControls: false,
          hasBorders: false,
          selectable: true,
          lockScalingFlip: true,
          lockRotation: true
        });

        // Resize to fit
        const maxDim = Math.max(img.width, img.height);
        const scale = Math.min(canvas.getWidth() / img.width, canvas.getHeight() / img.height);
        img.set({
          scaleX: scale,
          scaleY: scale
        });

        canvas.add(img);
        centerImage();
      });
    }

    widthInput.addEventListener('input', updateCanvasSize);
    heightInput.addEventListener('input', updateCanvasSize);

    openBtn.addEventListener('click', () => {
      overlay.style.display = 'flex';
      setTimeout(() => {
        updateCanvasSize();
        loadImage();
      }, 100);
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
