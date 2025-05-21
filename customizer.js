// public/customizer.js
;(function () {
  // 1) Dynamically load Cropper.js & its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 2) Initialize the customizer
  function initCustomizer() {
    const originalContainer = document.getElementById('mural-customizer');
    if (!originalContainer) {
      console.warn('Customizer: missing container');
      return;
    }

    // Parse product JSON
    let product;
    try {
      product = JSON.parse(originalContainer.dataset.product);
    } catch (err) {
      console.error('Customizer: invalid product JSON', err);
      return;
    }

    // Create modal overlay
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

    // Modal content
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      position: 'relative',
      background: '#fff',
      padding: '1rem',
      borderRadius: '8px',
      width: '75vw',
      height: '75vh',
      maxWidth: '1200px',
      maxHeight: '900px',
      overflow: 'hidden',
      boxSizing: 'border-box'
    });
    overlay.appendChild(modalContent);

    // Move original container into modal
    modalContent.appendChild(originalContainer);
    Object.assign(originalContainer.style, { width: '100%', height: '100%', overflow: 'auto', boxSizing: 'border-box' });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '0.5rem',
      right: '0.5rem',
      background: 'transparent',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer'
    });
    modalContent.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');

        // Listen on external trigger (Shopify button/link)
    const trigger = document.getElementById('open-customizer-btn');
    if (!trigger) {
      console.warn('Customizer: trigger element #open-customizer-btn not found — opening modal by default');
      overlay.style.display = 'flex';
    } else {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        overlay.style.display = 'flex';
      });
    }
    }

    function getWidthInches() {
      if (unitSelect.value === 'feet') return (+widthFeet.value||0)*12 + (+widthInches.value||0);
      const v = +widthInput.value||0; return unitSelect.value==='cm'? v*0.393700787 : v;
    }
    function getHeightInches() {
      if (unitSelect.value === 'feet') return (+heightFeet.value||0)*12 + (+heightInches.value||0);
      const v = +heightInput.value||0; return unitSelect.value==='cm'? v*
