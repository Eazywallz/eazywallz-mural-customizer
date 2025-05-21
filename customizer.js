// public/customizer.js
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
      script.onload  = () => resolve();
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

    // Insert (or persist) the “Customize Mural” button
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

    // Overlay
    let overlay = document.getElementById('customizer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'customizer-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      });
      document.body.appendChild(overlay);
    }

    // Modal (now full-screen)
    let modal = document.getElementById('customizer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customizer-modal';
      Object.assign(modal.style, {
        background: '#fff',
        borderRadius: '0px',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      });
      overlay.appendChild(modal);
    }

    // Close button
    let closeBtn = document.getElementById('customizer-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.id = 'customizer-close-btn';
      closeBtn.type = 'button';
      closeBtn.innerText = '✕';
      Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '10px',
        right: '10px',
        fontSize: '1.5rem',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        zIndex: 10001
      });
      closeBtn.addEventListener('click', () => overlay.style.display = 'none');
      modal.appendChild(closeBtn);
    }

    // Controls bar
    let controls = document.getElementById('customizer-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'customizer-controls';
      Object.assign(controls.style, {
        padding: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        borderBottom: '1px solid #ddd',
        zIndex: 10000
      });
      modal.appendChild(controls);
    }

    // Canvas area (75% of modal)
    let canvasArea = document.getElementById('customizer-canvas');
    if (!canvasArea) {
      canvasArea = document.createElement('div');
      canvasArea.id = 'customizer-canvas';
      Object.assign(canvasArea.style, {
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '75%',
        height: '75%',
        margin: 'auto'
      });
      modal.appendChild(canvasArea);
    }

    // Footer
    let footer = document.getElementById('customizer-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'customizer-footer';
      Object.assign(footer.style, {
        padding: '1rem',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10000
      });
      modal.appendChild(footer);
    }

    // ——— Build your existing UI controls ———
    // (unitSelect, variantSelect, width/height inputs, flipSelect, bwCheckbox, panelsCheckbox…)
    // ——— [unchanged from your last working version] ———  

    // For brevity, I’m skipping re-pasting *every* control here,
    // but **canvasArea** and **modal** sizing are the only changes.

    // You can copy/paste in all your existing event bindings,
    // renderImage(), updateAll(), drawPanels(), addBtn handlers, etc.

    // ——— Event: open modal ———
    openBtn.addEventListener('click', () => overlay.style.display = 'flex');

    // ——— At the end, fire initial render ———
    // renderImage();
    // updateAll();
  }

  // 3) Load Cropper & init on DOM ready
  if (document.readyState !== 'loading') {
    loadCropper().then(initCustomizer).catch(console.error);
  } else {
    document.addEventListener('DOMContentLoaded', () =>
      loadCropper().then(initCustomizer).catch(console.error)
    );
  }
})();
