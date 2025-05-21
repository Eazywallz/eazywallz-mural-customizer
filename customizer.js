// public/customizer.js
;(function() {
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
      script.onerror = err => reject(err);
      document.head.appendChild(script);
    });
  }

  // 2) Build all controls & Cropper inside #mural-customizer
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) {
      console.error('Missing #mural-customizer on page.');
      return;
    }

    // parse product JSON
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (err) {
      console.error('Invalid product JSON', err);
      return;
    }
    console.log('Customizer: product loaded', product);

    // Clear any old UI
    container.innerHTML = '';

    // --- Build control panel ---
    const controls = document.createElement('div');
    controls.className = 'customizer-controls';

    // Variant selector
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.text = v.title;
      variantSelect.appendChild(opt);
    });
    controls.appendChild(labelled('Variant:', variantSelect));

    // Unit dropdown
    const unitSelect = document.createElement('select');
    ['inches','feet','cm'].forEach(u => {
      const o = document.createElement('option');
      o.value = u; o.text = u;
      unitSelect.appendChild(o);
    });
    controls.appendChild(labelled('Unit:', unitSelect));

    // Width & height inputs (we’ll swap ft/in dynamically)
    const widthInput  = input('number','Width',1);
    const heightInput = input('number','Height',1);
    controls.appendChild(widthInput.wrapper);
    controls.appendChild(heightInput.wrapper);

    // Flip & B&W toggles
    const flipSelect = document.createElement('select');
    ['none','horizontal','vertical'].forEach(v=> {
      const o=document.createElement('option'); o.value=v; o.text=v;
      flipSelect.appendChild(o);
    });
    controls.appendChild(labelled('Flip:', flipSelect));
    const bwCheckbox = document.createElement('input');
    bwCheckbox.type='checkbox';
    controls.appendChild(labelled('Black & White:', bwCheckbox));

    // Show panels toggle
    const panelCheckbox = document.createElement('input');
    panelCheckbox.type='checkbox';
    controls.appendChild(labelled('Show panels:', panelCheckbox));

    // Price display & Add to Cart
    const priceDisplay = document.createElement('div');
    priceDisplay.className = 'price';
    priceDisplay.innerText = 'Price: $0.00';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add to Cart';
    addBtn.type = 'button';
    controls.appendChild(priceDisplay);
    controls.appendChild(addBtn);

    container.appendChild(controls);

    // --- Canvas area ---
    const canvasArea = document.createElement('div');
    canvasArea.className = 'canvas-area';
    container.appendChild(canvasArea);

    // Shopify quantity (hidden)
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput) { qtyInput.step='1'; qtyInput.min='1'; }

    // Cropper setup
    let cropper, imgEl;
    let currentVariant = product.variants[0];

    function renderImage(variant) {
      // clear old
      if (cropper) { cropper.destroy(); }
      canvasArea.innerHTML = '';

      // pick src
      let src = variant.image?.src||variant.featured_image?.src||product.images[0];
      if (!src) return console.error('No image');
      if (src.startsWith('//')) src = window.location.protocol+src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.maxWidth = '100%';
      canvasArea.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:        1,
          dragMode:        'move',
          scalable:        false,
          zoomable:        false,
          cropBoxMovable:  false,
          cropBoxResizable:false,
        });
        // fix crop box to full
        cropper.ready(() => {
          const mw = cropper.getContainerData();
          cropper.setCropBoxData({ left:0, top:0, width:mw.width, height:mw.height });
        });
        recalc();
      };
    }

    // recalc dimensions, price, panels
    function recalc() {
      if (!cropper) return;
      let w = parseFloat(widthInput.el.value)||0;
      let h = parseFloat(heightInput.el.value)||0;
      if (!w||!h) return;
      // unit conversion
      const unit = unitSelect.value;
      const factor = unit==='cm'? (1/2.54) : unit==='feet'? 12 : 1;
      const wIn = w * factor;
      const hIn = h * factor;
      // aspect
      cropper.setAspectRatio(wIn/hIn);
      // price
      const ft2     = (wIn*hIn)/144;
      const up      = currentVariant.price / 100;
      const total   = Math.ceil(ft2) * up;
      priceDisplay.innerText = `Price: $${total.toFixed(2)}`;
      if (qtyInput) qtyInput.value = Math.ceil(ft2);
      // panels
      if (panelCheckbox.checked) drawPanels();
      else clearPanels();
    }

    // flip & B&W
    function applyFlip() {
      if (!cropper) return;
      const v = flipSelect.value;
      cropper.scaleX(v==='horizontal'?-1:1);
      cropper.scaleY(v==='vertical'  ?-1:1);
    }
    function applyBW() {
      if (imgEl) imgEl.style.filter = bwCheckbox.checked?'grayscale(100%)':'none';
    }

    // panel lines
    function clearPanels() {
      Array.from(canvasArea.querySelectorAll('.panel-line'))
           .forEach(el=>el.remove());
    }
    function drawPanels() {
      clearPanels();
      const box = canvasArea.querySelector('.cropper-crop-box');
      if (!box) return;
      const data = cropper.getCropBoxData();
      const totalIn = parseFloat(widthInput.el.value) * (unitSelect.value==='cm'?1/2.54:unitSelect.value==='feet'?12:1);
      const panelCount = Math.ceil(totalIn/25);
      const panelW     = data.width / panelCount;
      for (let i=1; i<panelCount; i++) {
        const line = document.createElement('div');
        line.className = 'panel-line';
        Object.assign(line.style,{
          position:'absolute',
          top:0, bottom:0,
          left:`${data.left + panelW*i}px`,
          width:'2px',
          background:'rgba(0,0,0,0.5)',
          pointerEvents:'none'
        });
        canvasArea.appendChild(line);
      }
    }

    // Add to cart
    function onAddToCart() {
      if (!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          const imgURL = reader.result;
          const props = {
            Width: `${widthInput.el.value} ${unitSelect.value}`,
            Height:`${heightInput.el.value} ${unitSelect.value}`,
            Flip: flipSelect.value,
            'Black & White': bwCheckbox.checked?'Yes':'No',
            Panels: panelCheckbox.checked?'Yes':'No',
            'Cropped Image URL': imgURL
          };
          const payload = {
            id: product.variants[variantSelect.value].id,
            quantity: parseInt(qtyInput.value)||1,
            properties: props
          };
          fetch('/cart/add.js', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          })
          .then(r=>r.json())
          .then(()=> window.location.href='/cart')
          .catch(e=> console.error('Add to cart failed', e));
        };
        reader.readAsDataURL(blob);
      });
    }

    // wire events
    variantSelect.addEventListener('change', _=> {
      currentVariant = product.variants[variantSelect.value];
      renderImage(currentVariant);
    });
    [unitSelect,widthInput.el,heightInput.el].forEach(el=>
      el.addEventListener('input', recalc)
    );
    flipSelect  .addEventListener('change',()=>{ applyFlip(); });
    bwCheckbox  .addEventListener('change', applyBW);
    panelCheckbox.addEventListener('change', ()=> {
      panelCheckbox.checked? drawPanels():clearPanels();
    });
    addBtn.addEventListener('click', onAddToCart);

    // initial render
    renderImage(currentVariant);

    // helper to wrap label+el
    function labelled(txt,el) {
      const w = document.createElement('div');
      w.style.marginBottom = '10px';
      const lbl = document.createElement('label');
      lbl.innerText = txt;
      lbl.style.display = 'block';
      lbl.style.marginBottom = '4px';
      w.appendChild(lbl);
      w.appendChild(el);
      return w;
    }
    // helper to make input with wrapper
    function input(type, placeholder, min=0) {
      const el  = document.createElement('input');
      el.type   = type;
      el.min    = min; 
      el.placeholder = placeholder;
      el.style.width = '100%';
      const wrapper = labelled(placeholder, el);
      return { el, wrapper };
    }
  }

  // 3) Move #mural-customizer into overlay and bind open/close
  function setupModal() {
    const overlay   = document.getElementById('customizer-overlay');
    const openBtn   = document.getElementById('open-customizer-btn');
    const closeBtn  = document.getElementById('close-customizer-btn');
    const container = document.getElementById('mural-customizer');
    const modalContent = overlay.querySelector('.modal-content');

    [overlay,openBtn,closeBtn,container,modalContent].forEach(el=>{
      if (!el) console.warn('Missing element for customizer modal:', el);
    });

    openBtn.addEventListener('click', e=>{
      e.preventDefault();
      if (container.parentNode !== modalContent) {
        modalContent.appendChild(container);
      }
      overlay.style.display = 'flex';
    });
    closeBtn.addEventListener('click', ()=> overlay.style.display = 'none');
  }

  // boot
  document.addEventListener('DOMContentLoaded', ()=> {
    loadCropper()
      .then(()=>{
        initCustomizer();
        setupModal();
      })
      .catch(err=> console.error('Customizer init error', err));
  });
})();
