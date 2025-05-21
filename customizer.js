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
    try { product = JSON.parse(container.dataset.product); }
    catch { console.error('Invalid product JSON'); return; }

    // Add "Open Customizer" button
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.innerText = 'Customize Mural';
    Object.assign(openBtn.style, { margin: '1rem 0', padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' });
    container.appendChild(openBtn);

    // Modal overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', display: 'none',
      alignItems: 'center', justifyContent: 'center', zIndex: 10000
    });
    document.body.appendChild(overlay);

    // Modal box
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      background: '#fff', borderRadius: '8px',
      width: '75vw', height: '75vh', maxWidth: '1200px', maxHeight: '900px',
      position: 'relative', display: 'flex', flexDirection: 'column'
    });
    overlay.appendChild(modal);

    // Close button
    const closeBtn = document.createElement('button'); closeBtn.type = 'button'; closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '10px', right: '10px',
      fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer'
    });
    modal.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');

    // Controls container
    const controls = document.createElement('div');
    Object.assign(controls.style, {
      padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #ddd'
    });
    modal.appendChild(controls);

    // Canvas area
    const canvasArea = document.createElement('div');
    Object.assign(canvasArea.style, { flex: '1', position: 'relative', overflow: 'hidden' });
    modal.appendChild(canvasArea);

    // Footer
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    });
    modal.appendChild(footer);

    // UI Elements
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; unitSelect.appendChild(o);
    }); controls.appendChild(unitSelect);

    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => {
      const o = document.createElement('option'); o.value = i; o.text = v.title; variantSelect.appendChild(o);
    }); controls.appendChild(variantSelect);

    const widthInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Width', min: 1 });
    const heightInput = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Height', min: 1 });
    controls.append(widthInput, heightInput);

    const widthFeet = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Feet', min: 0, maxLength: 3, hidden: true });
    const widthInches = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Inches', min: 0, max: 11, maxLength: 2, hidden: true });
    const heightFeet = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Feet', min: 0, maxLength: 3, hidden: true });
    const heightInches = Object.assign(document.createElement('input'), { type: 'number', placeholder: 'Inches', min: 0, max: 11, maxLength: 2, hidden: true });
    controls.append(widthFeet, widthInches, heightFeet, heightInches);

    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t]) => {
      const o = document.createElement('option'); o.value = v; o.text = t; flipSelect.appendChild(o);
    }); controls.appendChild(flipSelect);

    const bwCheckbox = document.createElement('input'); bwCheckbox.type = 'checkbox'; controls.append(document.createTextNode(' B&W '), bwCheckbox);

    const panelsCheckbox = document.createElement('input'); panelsCheckbox.type = 'checkbox'; controls.append(document.createTextNode(' Show panels '), panelsCheckbox);

    const priceDiv = document.createElement('div'); priceDiv.innerText = 'Price: $0.00'; footer.appendChild(priceDiv);
    const addBtn = document.createElement('button'); addBtn.type = 'button'; addBtn.innerText = 'Add to Cart';
    Object.assign(addBtn.style, { padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' });
    footer.appendChild(addBtn);

    const qtyInput = document.querySelector('input[name="quantity"]'); if (qtyInput) { qtyInput.step = '1'; qtyInput.min = 1; }

    // Cropper instance
    let cropper, imgEl;
    function clearCanvas() { if (cropper) cropper.destroy(); canvasArea.innerHTML = ''; }
    function renderImage() {
      clearCanvas();
      const variant = product.variants[variantSelect.value];
      let src = variant.image?.src || variant.featured_image?.src || product.images[0];
      if (src.startsWith('//')) src = location.protocol + src;
      imgEl = document.createElement('img'); imgEl.src = src;
      imgEl.onload = () => {
        canvasArea.appendChild(imgEl);
        cropper = new Cropper(imgEl, {
          viewMode: 1, autoCropArea: 1,
          dragMode: 'move', cropBoxMovable: true, cropBoxResizable: false,
          zoomable: false, scalable: false
        });
        updateAll(); if (panelsCheckbox.checked) drawPanels();
      };
    }

    function toInches(v) { return unitSelect.value === 'cm' ? v * 0.393700787 : v; }
    function getWidthInches() {
      return unitSelect.value === 'feet'
        ? (+widthFeet.value || 0) * 12 + (+widthInches.value || 0)
        : toInches(+widthInput.value || 0);
    }
    function getHeightInches() {
      return unitSelect.value === 'feet'
        ? (+heightFeet.value || 0) * 12 + (+heightInches.value || 0)
        : toInches(+heightInput.value || 0);
    }

    function updateAll() {
      const w = getWidthInches(), h = getHeightInches();
      if (cropper && w > 0 && h > 0) {
        cropper.setAspectRatio(w / h);
        const sqft = Math.ceil((w * h) / 144) || 1;
        const rawCents = parseFloat(product.variants[variantSelect.value].price);
        const unitPrice = rawCents / 100;
        priceDiv.innerText = `Price: $${(unitPrice * sqft).toFixed(2)}`;
        if (qtyInput) qtyInput.value = sqft;
      }
    }

    function applyFlip() {
      const wrap = canvasArea.querySelector('.cropper-container');
      if (wrap) wrap.style.transform = flipSelect.value==='horizontal'? 'scaleX(-1)' : flipSelect.value==='vertical'? 'scaleY(-1)' : '';
    }
    function applyBW() {
      const wrap = canvasArea.querySelector('.cropper-container');
      if (wrap) wrap.style.filter = bwCheckbox.checked? 'grayscale(100%)':'';
    }
    function drawPanels() {
      const wrap = canvasArea.querySelector('.cropper-container'); if (!cropper||!wrap) return;
      wrap.style.position='relative';
      // remove existing lines first
      wrap.querySelectorAll('.panel-line').forEach(l=>l.remove());
      const data = cropper.getCropBoxData();
      const total = getWidthInches(), maxW = 25;
      const count = Math.ceil(total/maxW), step = data.width/count;
      for (let i=1;i<count;i++){
        const x = data.left+step*i;
        const line = document.createElement('div'); line.classList.add('panel-line');
        Object.assign(line.style,{
          position:'absolute',top:`${data.top}px`,left:`${x}px`,height:`${data.height}px`,width:'2px',background:'rgba(255,0,0,0.7)',pointerEvents:'none'
        }); wrap.appendChild(line);
      }
    }

    // Event bindings
    openBtn.addEventListener('click', ()=> overlay.style.display='flex');
    variantSelect.addEventListener('change', ()=>{ renderImage(); applyFlip(); applyBW(); });
    unitSelect.addEventListener('change', ()=>{
      const feet = unitSelect.value==='feet';
      widthInput.hidden=heightInput.hidden=feet;
      widthFeet.hidden=widthInches.hidden=heightFeet.hidden=heightInches.hidden=!feet;
      updateAll(); if(panelsCheckbox.checked) drawPanels();
    });
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches]
      .forEach(el=>el.addEventListener('input',()=>{ updateAll(); if(panelsCheckbox.checked) drawPanels(); }));
    flipSelect.addEventListener('change',applyFlip);
    bwCheckbox.addEventListener('change',applyBW);
    panelsCheckbox.addEventListener('change',()=>{ if(panelsCheckbox.checked) drawPanels(); else canvasArea.querySelectorAll('.panel-line').forEach(l=>l.remove()); });
    addBtn.addEventListener('click',()=>{
      if(!cropper)return;
      cropper.getCroppedCanvas().toBlob(blob=>{
        const reader=new FileReader(); reader.onloadend=()=>{
          const props={Width:unitSelect.value==='feet'?`${widthFeet.value}ft ${widthInches.value}in`:`${widthInput.value} ${unitSelect.value}`,Height:unitSelect.value==='feet'?`${heightFeet.value}ft ${heightInches.value}in`:`${heightInput.value} ${unitSelect.value}`,Flip:flipSelect.value,BW:bwCheckbox.checked?'Yes':'No',Panels:panelsCheckbox.checked?'Yes':'No'};
          const qty=Math.ceil(getWidthInches()*getHeightInches()/144)||1;
          fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:product.variants[variantSelect.value].id,quantity:qty,properties:props})})
            .then(r=>r.json()).then(()=>window.location.href='/cart').catch(console.error);
        };
        reader.readAsDataURL(blob);
      });
    });

    // Initial draw
    renderImage(); updateAll();
  }

  // Ensure init runs even if script loads after DOMContentLoaded
  function ready(fn){ document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn); }
  ready(()=>loadCropper().then(initCustomizer).catch(console.error));
})();
