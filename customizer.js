// public/customizer.js
;(function () {
  // -- load Cropper.js and CSS --
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload  = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return console.error('No #mural-customizer');

    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch {
      return console.error('Invalid product JSON');
    }

    // --- Open button ---
    let openBtn = document.getElementById('customizer-open-btn');
    if (!openBtn) {
      openBtn = document.createElement('button');
      openBtn.id = 'customizer-open-btn';
      openBtn.innerText = 'Customize Mural';
      Object.assign(openBtn.style, {
        margin: '1rem 0',
        padding: '0.5rem 1rem',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
      });
      container.prepend(openBtn);
    }

    // --- Overlay & Modal ---
    let overlay = document.getElementById('customizer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'customizer-overlay';
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
    }

    let modal = document.getElementById('customizer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customizer-modal';
      Object.assign(modal.style, {
        width: '100vw',
        height: '100vh',
        margin: '0',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      });
      overlay.appendChild(modal);
    }

    // Close
    let closeBtn = document.getElementById('customizer-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.id = 'customizer-close-btn';
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

    // Controls
    let controls = document.getElementById('customizer-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'customizer-controls';
      Object.assign(controls.style, {
        padding: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        borderBottom: '1px solid #ddd'
      });
      modal.appendChild(controls);
    }

    // Canvas wrapper
    let canvasArea = document.getElementById('customizer-canvas');
    if (!canvasArea) {
      canvasArea = document.createElement('div');
      canvasArea.id = 'customizer-canvas';
      Object.assign(canvasArea.style, {
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // force a size to fill most of modal:
        width: '90vw',
        height: '80vh',
        margin: 'auto',
        background: '#f0f0f0',
      });
      modal.appendChild(canvasArea);
    }

    // Footer (price + add)
    let footer = document.getElementById('customizer-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'customizer-footer';
      Object.assign(footer.style, {
        padding: '1rem',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between'
      });
      modal.appendChild(footer);
    }

    // --- Build controls ---
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','cm']].forEach(([v,t])=>{
      const o = document.createElement('option');
      o.value=v; o.text=t;
      unitSelect.append(o);
    });
    controls.append(unitSelect);

    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o = document.createElement('option');
      o.value=i; o.text=v.title;
      variantSelect.append(o);
    });
    controls.append(variantSelect);

    const widthInput  = Object.assign(document.createElement('input'),{type:'number',placeholder:'W',min:1});
    const heightInput = Object.assign(document.createElement('input'),{type:'number',placeholder:'H',min:1});
    controls.append(widthInput, heightInput);

    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']]
      .forEach(([v,t])=>{
        const o = document.createElement('option');
        o.value=v; o.text=t;
        flipSelect.append(o);
      });
    controls.append(flipSelect);

    const bwCheckbox = Object.assign(document.createElement('input'),{type:'checkbox'});
    const bwLabel    = document.createElement('label');
    bwLabel.innerText = 'B&W';
    controls.append(bwCheckbox, bwLabel);

    const panelsCheckbox = Object.assign(document.createElement('input'),{type:'checkbox'});
    const panelsLabel    = document.createElement('label');
    panelsLabel.innerText = 'Show panels';
    controls.append(panelsCheckbox, panelsLabel);

    const priceDiv = document.createElement('div');
    priceDiv.innerText = 'Price: $0.00';
    const addBtn   = document.createElement('button');
    addBtn.innerText = 'Add to Cart';
    Object.assign(addBtn.style, {
      padding:'0.5rem 1rem',
      background:'#007bff',
      color:'#fff',
      border:'none',
      cursor:'pointer'
    });
    footer.append(priceDiv, addBtn);

    // Shopify qty
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step='1'; qtyInput.min='1'; }

    // -- Cropper logic --
    let cropper, imgEl;
    function clearCanvas() {
      if (cropper) cropper.destroy();
      canvasArea.innerHTML = '';
    }
    function renderImage() {
      clearCanvas();
      let src = product.variants[variantSelect.value].image?.src
             || product.images[0];
      if (src.startsWith('//')) src = window.location.protocol + src;
      imgEl = document.createElement('img');
      imgEl.src = src;
      Object.assign(imgEl.style, {
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'block'
      });
      imgEl.onload = () => {
        canvasArea.appendChild(imgEl);
        cropper = new Cropper(imgEl, {
          viewMode:1,
          autoCropArea:1,
          dragMode:'move',
          cropBoxMovable:false,
          cropBoxResizable:false,
          zoomable:false,
          scalable:false,
          responsive:true
        });
        updateAll();
      };
    }

    function toInches(v) { return unitSelect.value==='cm'?v*0.3937:v; }
    function getW() { return toInches(+widthInput.value||0); }
    function getH() { return toInches(+heightInput.value||0); }

    function updateAll() {
      const w = getW(), h = getH();
      if (!cropper || w<=0 || h<=0) return;
      cropper.setAspectRatio(w/h);
      const sqft = Math.ceil((w*h)/144) || 1;
      const price = +product.variants[variantSelect.value].price/100 * sqft;
      priceDiv.innerText = `Price: $${price.toFixed(2)}`;
      if (qtyInput) qtyInput.value = sqft;
      // flip & B&W
      const wrap = canvasArea.querySelector('.cropper-canvas');
      if (wrap) {
        wrap.style.transform = flipSelect.value==='horizontal'
          ? 'scaleX(-1)' : flipSelect.value==='vertical'
            ? 'scaleY(-1)' : '';
        wrap.style.filter    = bwCheckbox.checked ? 'grayscale(100%)' : '';
      }
    }

    // Bind
    openBtn.addEventListener('click', ()=> overlay.style.display='flex');
    variantSelect.addEventListener('change', renderImage);
    [unitSelect, widthInput, heightInput, flipSelect, bwCheckbox]
      .forEach(el=>el.addEventListener('input', updateAll));
    addBtn.addEventListener('click', ()=>{
      if (!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob=>{
        const reader = new FileReader();
        reader.onloadend = ()=>{
          const props = {
            Width: `${widthInput.value} ${unitSelect.value}`,
            Height:`${heightInput.value} ${unitSelect.value}`,
            Flip:flipSelect.value,
            BW: bwCheckbox.checked?'Yes':'No'
          };
          const qty = Math.ceil((getW()*getH())/144)||1;
          fetch('/cart/add.js',{
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body:JSON.stringify({
              id:product.variants[variantSelect.value].id,
              quantity:qty,
              properties:props
            })
          })
          .then(res=>res.json())
          .then(()=> window.location='/cart')
          .catch(console.error);
        };
        reader.readAsDataURL(blob);
      });
    });

    // start
    renderImage();
  }

  // boot
  if (document.readyState!=='loading') {
    loadCropper().then(initCustomizer).catch(console.error);
  } else {
    document.addEventListener('DOMContentLoaded', ()=> {
      loadCropper().then(initCustomizer).catch(console.error);
    });
  }
})();
