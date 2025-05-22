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
      script.onload  = () => { console.log('Cropper.js loaded'); resolve(); };
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

    // Constrain widget width and center it
    container.style.maxWidth = '500px';
    container.style.margin   = '1rem auto';

    // Parse product JSON
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Customizer: invalid product JSON', err);
      return;
    }
    console.log('Customizer: product loaded', product);

    // --- Create or persist open button ---
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

    // --- Overlay and modal container ---
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

    let modal = document.getElementById('customizer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customizer-modal';
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
        cursor: 'pointer'
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
        borderBottom: '1px solid #ddd'
      });
      modal.appendChild(controls);
    }

    // Canvas area
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
        justifyContent: 'center'
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
        alignItems: 'center'
      });
      modal.appendChild(footer);
    }

    // --- UI elements ---
    // Units
    const unitSelect = document.createElement('select');
    unitSelect.id = 'unit-select';
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']]
      .forEach(([v,t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.text  = t;
        unitSelect.append(o);
      });
    controls.append(unitSelect);

    // Variant
    const variantSelect = document.createElement('select');
    variantSelect.id = 'variant-select';
    product.variants.forEach((v,i) => {
      const o = document.createElement('option');
      o.value = i;
      o.text  = v.title;
      variantSelect.append(o);
    });
    controls.append(variantSelect);

    // Width/Height inputs
    const widthInput  = Object.assign(document.createElement('input'),{id:'width-input',type:'number',placeholder:'Width',min:1});
    const heightInput = Object.assign(document.createElement('input'),{id:'height-input',type:'number',placeholder:'Height',min:1});
    controls.append(widthInput, heightInput);

    // Feet/inches split
    const widthFeet    = Object.assign(document.createElement('input'),{id:'width-feet',type:'number',placeholder:'Feet',min:0,maxLength:3,hidden:true});
    const widthInches  = Object.assign(document.createElement('input'),{id:'width-inches',type:'number',placeholder:'Inches',min:0,max:11,maxLength:2,hidden:true});
    const heightFeet   = Object.assign(document.createElement('input'),{id:'height-feet',type:'number',placeholder:'Feet',min:0,maxLength:3,hidden:true});
    const heightInches = Object.assign(document.createElement('input'),{id:'height-inches',type:'number',placeholder:'Inches',min:0,max:11,maxLength:2,hidden:true});
    controls.append(widthFeet, widthInches, heightFeet, heightInches);

    // Flip
    const flipSelect = document.createElement('select');
    flipSelect.id='flip-select';
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']]
      .forEach(([v,t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.text  = t;
        flipSelect.append(o);
      });
    controls.append(flipSelect);

    // Black & white
    const bwCheckbox = Object.assign(document.createElement('input'),{id:'bw-checkbox',type:'checkbox'});
    const bwLabel    = document.createTextNode(' B&W ');
    controls.append(bwCheckbox, bwLabel);

    // Panels
    const panelsCheckbox = Object.assign(document.createElement('input'),{id:'panels-checkbox',type:'checkbox'});
    const panelsLabel    = document.createTextNode(' Show panels ');
    controls.append(panelsCheckbox, panelsLabel);

    // Price display & add button
    const priceDiv = document.createElement('div');
    priceDiv.id = 'price-display';
    priceDiv.innerText = 'Price: $0.00';
    const addBtn = document.createElement('button');
    addBtn.id   = 'add-btn';
    addBtn.type = 'button';
    addBtn.innerText = 'Add to Cart';
    Object.assign(addBtn.style,{
      padding:'0.5rem 1rem',
      background:'#007bff',
      color:'#fff',
      border:'none',
      borderRadius:'4px',
      cursor:'pointer'
    });
    footer.append(priceDiv, addBtn);

    // Quantity field
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step='1'; qtyInput.min='1'; }

    // --- Cropper and logic ---
    let cropper, imgEl;
    function clearCanvas() {
      if (cropper) cropper.destroy();
      canvasArea.innerHTML = '';
    }

    function renderImage() {
      clearCanvas();
      let src = product.variants[variantSelect.value].image?.src
             || product.variants[variantSelect.value].featured_image?.src
             || product.images[1]; // use [1] as requested
      if (src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      Object.assign(imgEl.style, {minWidth:'100%', minHeight:'100%', display:'block'});

      imgEl.onload = () => {
        canvasArea.append(imgEl);

        cropper = new Cropper(imgEl, {
          viewMode:         1,
          autoCropArea:     1,
          dragMode:         'move',
          cropBoxMovable:   false,
          cropBoxResizable: false,
          zoomable:         false,
          scalable:         false,
          responsive:       true,
          ready() {
            updateAll();
            if (panelsCheckbox.checked) drawPanels();
          }
        });
      };
    }

    function toInches(v) {
      return unitSelect.value === 'cm'
        ? v * 0.393700787
        : v;
    }
    function getW() {
      return unitSelect.value === 'feet'
        ? ((+widthFeet.value||0)*12 + (+widthInches.value||0))
        : toInches(+widthInput.value||0);
    }
    function getH() {
      return unitSelect.value === 'feet'
        ? ((+heightFeet.value||0)*12 + (+heightInches.value||0))
        : toInches(+heightInput.value||0);
    }

    function updateAll(){
      const w = getW(), h = getH();
      if (cropper && w > 0 && h > 0) {
        cropper.setAspectRatio(w/h);
        const sqft = Math.ceil((w*h)/144) || 1;
        const priceCents = +product.variants[variantSelect.value].price;
        priceDiv.innerText = `Price: $${((priceCents/100)*sqft).toFixed(2)}`;
        if (qtyInput) qtyInput.value = sqft;
      }
    }

    function applyFlip() {
      if (!cropper) return;
      // use Cropper.js scale methods
      if (flipSelect.value === 'horizontal') {
        cropper.scaleX(-1);
      } else if (flipSelect.value === 'vertical') {
        cropper.scaleY(-1);
      } else {
        cropper.scaleX(1);
        cropper.scaleY(1);
      }
    }

    function applyBW(){
      const wrapper = canvasArea.querySelector('.cropper-canvas');
      if (wrapper) {
        wrapper.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : '';
      }
    }

    function drawPanels() {
      if (!cropper) return;
      // remove old lines
      const containerDiv = canvasArea.querySelector('.cropper-container');
      containerDiv.querySelectorAll('.panel-line').forEach(l => l.remove());

      const cb    = cropper.getCropBoxData();
      const total = getW();
      const maxW  = unitSelect.value === 'cm' ? 63.5 : 25;
      const count = Math.ceil(total / maxW);
      const step  = cb.width / count;

      for (let i = 1; i < count; i++) {
        const x = cb.left + step * i;
        const line = document.createElement('div');
        line.className = 'panel-line';
        Object.assign(line.style, {
          position:      'absolute',
          top:           `${cb.top}px`,
          left:          `${x}px`,
          height:        `${cb.height}px`,
          width:         '2px',
          background:    'rgba(255,0,0,0.7)',
          pointerEvents: 'none',
          zIndex:        500
        });
        containerDiv.appendChild(line);
      }
    }

    // --- Event bindings ---
    openBtn.addEventListener('click', () => overlay.style.display = 'flex');
    variantSelect.addEventListener('change', () => {
      renderImage();
      applyFlip();
      applyBW();
    });
    unitSelect.addEventListener('change', () => {
      const feet = unitSelect.value === 'feet';
      widthInput.hidden = heightInput.hidden = feet;
      [widthFeet,widthInches,heightFeet,heightInches].forEach(i => i.hidden = !feet);
      updateAll();
      if (panelsCheckbox.checked) drawPanels();
    });
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches]
      .forEach(i => i.addEventListener('input', () => {
        updateAll();
        if (panelsCheckbox.checked) drawPanels();
      }));

    flipSelect.addEventListener('change', applyFlip);
    bwCheckbox.addEventListener('change', applyBW);
    panelsCheckbox.addEventListener('change', () => {
      if (panelsCheckbox.checked) drawPanels();
      else canvasArea.querySelectorAll('.panel-line').forEach(l => l.remove());
    });

    addBtn.addEventListener('click', () => {
      if (!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const props = {
            Width:  unitSelect.value==='feet'
                      ? `${widthFeet.value}ft ${widthInches.value}in`
                      : `${widthInput.value} ${unitSelect.value}`,
            Height: unitSelect.value==='feet'
                      ? `${heightFeet.value}ft ${heightInches.value}in`
                      : `${heightInput.value} ${unitSelect.value}`,
            Flip:   flipSelect.value,
            BW:     bwCheckbox.checked ? 'Yes' : 'No',
            Panels: panelsCheckbox.checked ? 'Yes' : 'No'
          };
          const qty = Math.ceil((getW()*getH())/144) || 1;
          fetch('/cart/add.js', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              id: product.variants[variantSelect.value].id,
              quantity: qty,
              properties: props
            })
          })
          .then(r => r.json())
          .then(() => window.location = '/cart')
          .catch(console.error);
        };
        reader.readAsDataURL(blob);
      });
    });

    // Boot
    renderImage();
  }

  // 3) Load Cropper & init on DOM ready
  if (document.readyState !== 'loading') {
    loadCropper().then(initCustomizer).catch(err => console.error(err));
  } else {
    document.addEventListener('DOMContentLoaded', () =>
      loadCropper().then(initCustomizer).catch(err => console.error(err))
    );
  }
})();
