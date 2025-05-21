if (window.Shopify && Shopify.designMode) {
  console.log('Customizer: skipping in theme editor');
  return;
}
// public/customizer.js
;(function(){
  // 1) Load Cropper.js + CSS
  function loadCropper(){
    return new Promise((res, rej)=>{
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src     = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload  = ()=> res();
      script.onerror = err=> rej(err);
      document.head.appendChild(script);
    });
  }

  // 2) Build the customizer UI into the page
  function initCustomizer(){
    const container = document.getElementById('mural-customizer');
    if(!container){
      console.error('Customizer: missing #mural-customizer');
      return;
    }

    // parse product JSON
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch(e){
      console.error('Customizer: invalid JSON', e);
      return;
    }

    // clear & recreate
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    // CONTROLS panel
    const ctrls = document.createElement('div');
    ctrls.className = 'customizer-controls';
    ctrls.style.flex = '0 0 auto';
    ctrls.style.overflowY = 'auto';
    ctrls.style.padding = '20px';
    ctrls.style.background = '#f9f9f9';
    ctrls.style.minWidth = '300px';

    // helper to wrap label+field
    const wrap = (labelText, field)=>{
      const w = document.createElement('div');
      w.style.marginBottom = '12px';
      const lbl = document.createElement('label');
      lbl.innerText = labelText;
      lbl.style.display = 'block';
      lbl.style.marginBottom = '4px';
      w.appendChild(lbl);
      w.appendChild(field);
      return w;
    };

    // variant
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o = document.createElement('option');
      o.value = i; o.text = v.title;
      variantSelect.appendChild(o);
    });
    ctrls.appendChild(wrap('Variant', variantSelect));

    // unit
    const unitSelect = document.createElement('select');
    ['inches','feet','cm'].forEach(u=>{
      const o = document.createElement('option');
      o.value = u; o.text = u;
      unitSelect.appendChild(o);
    });
    ctrls.appendChild(wrap('Unit', unitSelect));

    // width/height inputs
    const widthInput = document.createElement('input');
    widthInput.type = 'number'; widthInput.min = '1';
    widthInput.placeholder = 'Width';
    ctrls.appendChild(wrap('Width', widthInput));

    const heightInput = document.createElement('input');
    heightInput.type = 'number'; heightInput.min = '1';
    heightInput.placeholder = 'Height';
    ctrls.appendChild(wrap('Height', heightInput));

    // flip
    const flipSelect = document.createElement('select');
    ['none','horizontal','vertical'].forEach(f=>{
      const o=document.createElement('option'); o.value=f; o.text=f;
      flipSelect.appendChild(o);
    });
    ctrls.appendChild(wrap('Flip', flipSelect));

    // B&W
    const bwCheckbox = document.createElement('input');
    bwCheckbox.type = 'checkbox';
    ctrls.appendChild(wrap('Black & White', bwCheckbox));

    // panels
    const panelCheckbox = document.createElement('input');
    panelCheckbox.type = 'checkbox';
    ctrls.appendChild(wrap('Show panels', panelCheckbox));

    // price display
    const priceDisplay = document.createElement('div');
    priceDisplay.innerText = 'Price: $0.00';
    priceDisplay.style.margin = '12px 0';
    ctrls.appendChild(priceDisplay);

    // add to cart
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.innerText = 'Add to Cart';
    addBtn.style.padding = '12px 20px';
    addBtn.style.fontSize = '16px';
    ctrls.appendChild(addBtn);

    // CANVAS area
    const canvasArea = document.createElement('div');
    canvasArea.className = 'canvas-area';
    canvasArea.style.flex = '1 1 auto';
    canvasArea.style.position = 'relative';
    canvasArea.style.background = '#fff';
    canvasArea.style.display = 'flex';
    canvasArea.style.alignItems = 'center';
    canvasArea.style.justifyContent = 'center';
    canvasArea.style.overflow = 'hidden';

    container.appendChild(ctrls);
    container.appendChild(canvasArea);

    // Shopify qty
    const qtyInput = document.querySelector('input[name="quantity"]');
    if(qtyInput){
      qtyInput.type='hidden';
      qtyInput.min = '1';
      qtyInput.step= '1';
    }

    let cropper, imgEl, currentVariant = product.variants[0];

    function renderImage(variant){
      currentVariant = variant;
      // teardown
      if(cropper) cropper.destroy();
      canvasArea.innerHTML = '';

      // src lookup
      let src = variant.image?.src || variant.featured_image?.src || product.images[0];
      if(!src) return console.error('No image for variant');
      if(src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.maxWidth = '100%';
      imgEl.style.maxHeight= '100%';
      canvasArea.appendChild(imgEl);

      imgEl.onload = ()=> {
        cropper = new Cropper(imgEl, {
          viewMode: 1,
          dragMode: 'move',
          scalable: false,
          zoomable: false,
          cropBoxMovable: false,
          cropBoxResizable: false
        });
        // fix crop box to full container
        const cd = cropper.getContainerData();
        cropper.setCropBoxData({ left:0, top:0, width:cd.width, height:cd.height });

        recalc();
      };
    }

    function recalc(){
      if(!cropper) return;
      const w = parseFloat(widthInput.value)||0;
      const h = parseFloat(heightInput.value)||0;
      if(!w||!h) return;
      // convert to inches
      const unit = unitSelect.value;
      const factor = unit==='cm'? (1/2.54) : unit==='feet'? 12 : 1;
      const wIn = w*factor, hIn = h*factor;
      // aspect
      cropper.setAspectRatio(wIn/hIn);
      // price
      const ft2 = (wIn*hIn)/144;
      const price = Math.ceil(ft2)*(currentVariant.price/100);
      priceDisplay.innerText = `Price: $${price.toFixed(2)}`;
      if(qtyInput) qtyInput.value = Math.ceil(ft2);

      panelCheckbox.checked ? drawPanels() : clearPanels();
    }

    function applyFlip(){
      if(!cropper) return;
      const v = flipSelect.value;
      cropper.scaleX(v==='horizontal'?-1:1);
      cropper.scaleY(v==='vertical'  ?-1:1);
    }
    function applyBW(){
      if(imgEl) imgEl.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : 'none';
    }

    function clearPanels(){
      canvasArea.querySelectorAll('.panel-line').forEach(el=>el.remove());
    }
    function drawPanels(){
      clearPanels();
      const cd = cropper.getCropBoxData();
      const totalIn = (parseFloat(widthInput.value)||0)*(unitSelect.value==='cm'?1/2.54:unitSelect.value==='feet'?12:1);
      const count   = Math.ceil(totalIn/25);
      const stepPx  = cd.width/count;
      for(let i=1;i<count;i++){
        const line = document.createElement('div');
        line.className = 'panel-line';
        Object.assign(line.style,{
          position:'absolute', top:`${cd.top}px`,
          left:`${cd.left+stepPx*i}px`,
          height:`${cd.height}px`, width:'2px',
          background:'rgba(0,0,0,0.5)', pointerEvents:'none'
        });
        canvasArea.appendChild(line);
      }
    }

    function onAdd(){
      if(!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob=>{
        const r = new FileReader();
        r.onload = ()=>{
          const imgURL = r.result;
          const props = {
            Width:`${widthInput.value} ${unitSelect.value}`,
            Height:`${heightInput.value} ${unitSelect.value}`,
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
          fetch('/cart/add.js',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(payload)
          })
          .then(()=> window.location.href='/cart')
          .catch(e=> console.error('Cart add error',e));
        };
        r.readAsDataURL(blob);
      });
    }

    // wire
    variantSelect.addEventListener('change', e=> renderImage(product.variants[e.target.value]));
    [unitSelect, widthInput, heightInput].forEach(el=>
      el.addEventListener('input', recalc)
    );
    flipSelect  .addEventListener('change', applyFlip);
    bwCheckbox  .addEventListener('change', applyBW);
    panelCheckbox.addEventListener('change', ()=>panelCheckbox.checked?drawPanels():clearPanels());
    addBtn.addEventListener('click', onAdd);

    // initial
    renderImage(currentVariant);
  }

  // 3) Modal wiring
  function setupModal(){
    const overlay   = document.getElementById('customizer-overlay');
    const openBtn   = document.getElementById('open-customizer-btn');
    const closeBtn  = document.getElementById('close-customizer-btn');
    const container = document.getElementById('mural-customizer');
    const modalArea = (overlay && overlay.querySelector('.modal-content')) || overlay;

    if(!overlay||!openBtn||!closeBtn||!modalArea||!container){
      console.warn('Customizer modal elements missing');
      return;
    }

    openBtn.addEventListener('click', e=>{
      e.preventDefault();
      if(container.parentNode!==modalArea){
        modalArea.appendChild(container);
      }
      overlay.style.display = 'flex';
    });
    closeBtn.addEventListener('click', ()=> overlay.style.display='none');
  }

  // 4) Bootstrap
  document.addEventListener('DOMContentLoaded', ()=>{
    loadCropper()
      .then(()=>{
        initCustomizer();
        setupModal();
      })
      .catch(err=> console.error('Customizer failed',err));
  });
})();
