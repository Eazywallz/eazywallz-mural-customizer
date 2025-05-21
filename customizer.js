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
    try {
      product = JSON.parse(container.dataset.product);
    } catch {
      console.error('Invalid product JSON');
      return;
    }

    // Ensure "Customize Mural" button persists
    let openBtn = document.getElementById('customizer-open-btn');
    if (!openBtn) {
      openBtn = document.createElement('button');
      openBtn.id = 'customizer-open-btn';
      openBtn.type = 'button';
      openBtn.innerText = 'Customize Mural';
      Object.assign(openBtn.style, {
        margin: '1rem 0',
        padding: '0.5rem 1rem',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
      });
      container.insertBefore(openBtn, container.firstChild);
    }

    // Modal overlay
    let overlay = document.getElementById('customizer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'customizer-overlay';
      Object.assign(overlay.style, {
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      });
      document.body.appendChild(overlay);

      const style = document.createElement('style');
      style.textContent = `
#customizer-modal .cropper-container { width: 100% !important; height: 100% !important; }
#customizer-modal img { max-width: none !important; }
`;
      overlay.appendChild(style);
    }

    // Modal box
    let modal = document.getElementById('customizer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customizer-modal';
      Object.assign(modal.style, {
        background: '#fff', borderRadius: '8px',
        width: '75vw', height: '75vh',
        maxWidth: '1200px', maxHeight: '900px',
        position: 'relative', display: 'flex', flexDirection: 'column'
      });
      overlay.appendChild(modal);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button'; closeBtn.innerText = '✕';
      Object.assign(closeBtn.style, {
        position: 'absolute', top: '10px', right: '10px',
        fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer'
      });
      closeBtn.addEventListener('click', () => overlay.style.display = 'none');
      modal.appendChild(closeBtn);

      // Controls bar
      const controls = document.createElement('div');
      Object.assign(controls.style, {
        padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #ddd'
      });
      modal.appendChild(controls);

      // Canvas area
      const canvasArea = document.createElement('div');
      Object.assign(canvasArea.style, {
        flex: '1', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
      });
      modal.appendChild(canvasArea);

      // Footer
      const footer = document.createElement('div');
      Object.assign(footer.style, {
        padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      });
      modal.appendChild(footer);

      // [UI elements omitted for brevity: unitSelect, variantSelect, inputs, flip, bw, panels, priceDiv, addBtn]
      // … (same as before)

      // Cropper logic
      let cropper, imgEl;
      function clearCanvas() { if (cropper) cropper.destroy(); canvasArea.innerHTML = ''; }
      function renderImage() {
        clearCanvas();
        let src = product.variants[variantSelect.value].image?.src || product.variants[variantSelect.value].featured_image?.src || product.images[0];
        if (src.startsWith('//')) src = window.location.protocol + src;
        imgEl = document.createElement('img');
        imgEl.src = src;
        // make img fill container so crop box is fixed
        Object.assign(imgEl.style, { minWidth: '100%', minHeight: '100%', display: 'block' });
        imgEl.onload = () => {
          canvasArea.appendChild(imgEl);
          cropper = new Cropper(imgEl, {
            viewMode: 1,
            autoCropArea: 1,
            dragMode: 'move',          // move image
            cropBoxMovable: false,     // fix crop box
            cropBoxResizable: false,   // fix crop box
            zoomable: false,
            scalable: false,
            responsive: true,
            ready() {
              // expand crop box to full container
              const containerData = cropper.getContainerData();
              cropper.setCropBoxData({
                left: containerData.left,
                top: containerData.top,
                width: containerData.width,
                height: containerData.height
              });
            }
          });
          // redraw panels as image moves
          ['cropmove', 'cropend'].forEach(evt => cropper.on(evt, () => {
            if (panelsCheckbox.checked) drawPanels();
          }));
          updateAll();
          if (panelsCheckbox.checked) drawPanels();
        };
      }

      // [utility functions: toInches, getWidthInches, getHeightInches, updateAll, applyFlip, applyBW, drawPanels] as before
      // [event bindings: openBtn, variantSelect, unitSelect, inputs, flipSelect, bwCheckbox, panelsCheckbox, addBtn] as before

      // Boot
      renderImage(); updateAll();
    }
  }

  document.readyState !== 'loading'
    ? loadCropper().then(initCustomizer)
    : document.addEventListener('DOMContentLoaded', () => loadCropper().then(initCustomizer));
})();
