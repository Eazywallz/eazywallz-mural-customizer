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

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'customizer-modal';
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    });
    document.body.appendChild(overlay);

    // Modal content
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      position: 'relative', background: '#fff', padding: '1rem', borderRadius: '8px',
      maxWidth: '90%', maxHeight: '90%', overflowY: 'auto'
    });
    overlay.appendChild(modalContent);

    // Move original container into modal
    modalContent.appendChild(originalContainer);
    Object.assign(originalContainer.style, { maxWidth: '500px', margin: '0 auto' });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none',
      fontSize: '1.5rem', cursor: 'pointer'
    });
    modalContent.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');

    // Programmatic trigger link
    const triggerLink = document.createElement('a');
    triggerLink.href = '#';
    triggerLink.id = 'open-customizer-link';
    triggerLink.innerText = 'Customize Mural';
    Object.assign(triggerLink.style, {
      display: 'inline-block', margin: '1rem 0', padding: '0.5rem 1rem',
      background: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer'
    });
    // Insert trigger link before original container
    originalContainer.parentNode.insertBefore(triggerLink, originalContainer);
    triggerLink.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.style.display = 'flex';
    });

    // Build UI inside originalContainer
    const container = originalContainer;
    container.innerHTML = ''; // clear existing

    // Controls
    const controls = document.createElement('div');
    controls.style.display = 'flex'; controls.style.flexWrap = 'wrap';
    controls.style.gap = '0.5rem'; controls.style.marginBottom = '1rem';
    container.appendChild(controls);

    // Unit select
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; unitSelect.appendChild(o);
    });
    controls.appendChild(unitSelect);

    // Variant select
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => {
      const o = document.createElement('option'); o.value = i; o.text = v.title; variantSelect.appendChild(o);
    });
    const defaultIdx = product.variants.length > 1 ? 1 : 0;
    variantSelect.selectedIndex = defaultIdx;
    controls.appendChild(variantSelect);

    // Dimension inputs
    const widthInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width', min:1 });
    const heightInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height', min:1 });
    controls.append(widthInput, heightInput);

    const widthFeet = Object.assign(document.createElement('input'), { type:'number', placeholder:'Feet', min:0 });
    const widthInches = Object.assign(document.createElement('input'), { type:'number', placeholder:'Inches', min:0, max:11 });
    const heightFeet = Object.assign(document.createElement('input'), { type:'number', placeholder:'Feet', min:0 });
    const heightInches = Object.assign(document.createElement('input'), { type:'number', placeholder:'Inches', min:0, max:11 });
    [widthFeet,widthInches,heightFeet,heightInches].forEach(el => { el.style.display = 'none'; controls.appendChild(el); });

    // Flip select
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; flipSelect.appendChild(o);
    });
    controls.appendChild(flipSelect);

    // B&W checkbox
    const bwCheckbox = document.createElement('input'); bwCheckbox.type = 'checkbox';
    const bwLabel = document.createElement('label'); bwLabel.append(bwCheckbox, ' B&W'); controls.appendChild(bwLabel);

    // Panels toggle
    const panelsCheckbox = document.createElement('input'); panelsCheckbox.type = 'checkbox';
    const panelsLabel = document.createElement('label'); panelsLabel.append(panelsCheckbox, ' Show panels'); controls.appendChild(panelsLabel);

    // Price display
    const priceDiv = document.createElement('div'); priceDiv.innerText = 'Price: $0.00'; container.appendChild(priceDiv);
    const qty = document.querySelector('input[name="quantity"]'); if(qty){ qty.step='any'; qty.min=0; }

    // Cropper setup remains unchanged from working version
    // ...

    console.log('Customizer initialized inside modal');
  }

  document.addEventListener('DOMContentLoaded', () => loadCropper().then(initCustomizer).catch(console.error));
})();
