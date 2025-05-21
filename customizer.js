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

  // Initialize the customizer
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return;

    // Parse product info
    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch { console.error('Invalid product JSON'); return; }

    // Create modal overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000 });
    document.body.appendChild(overlay);

    // Modal content
    const modal = document.createElement('div');
    Object.assign(modal.style, { background: '#fff', borderRadius: '8px', width: '75vw', height: '75vh', maxWidth: '1200px', maxHeight: '900px', overflow: 'auto', position: 'relative', padding: '1rem' });
    overlay.appendChild(modal);

    // Move container
    modal.appendChild(container);
    Object.assign(container.style, { width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto' });

    // Close button
    const closeBtn = document.createElement('button'); closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, { position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer' });
    modal.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');

    // Trigger or auto-open
    const trigger = document.getElementById('open-customizer-btn');
    if (trigger) trigger.addEventListener('click', e => { e.preventDefault(); overlay.style.display = 'flex'; });
    else overlay.style.display = 'flex';

    // Build controls
    container.innerHTML = '';
    const controls = document.createElement('div');
    Object.assign(controls.style, { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' });
    container.appendChild(controls);

    // Unit selector
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t]) => { const o=document.createElement('option'); o.value=v; o.text=t; unitSelect.appendChild(o); });
    controls.appendChild(unitSelect);

    // Variant selector
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => { const o=document.createElement('option'); o.value=i; o.text=v.title; variantSelect.appendChild(o); });
    controls.appendChild(variantSelect);

    // Dimension inputs (in/cm)
    const widthInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width', min:1 });
    const heightInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height', min:1 });
    controls.append(widthInput, heightInput);

    // Dimension inputs (feet/inches)
    const widthFeet = Object.assign(document.createElement('input'), { type:'number', placeholder:'Feet', min:0, maxLength:3 });
    const widthInches = Object.assign(document.createElement('input'), { type:'number', placeholder:'Inches', min:0, max:11, maxLength:2 });
    const heightFeet = Object.assign(document.createElement('input'), { type:'number', placeholder:'Feet', min:0, maxLength:3 });
    const heightInches = Object.assign(document.createElement('input'), { type:'number', placeholder:'Inches', min:0, max:11, maxLength:2 });
    [widthFeet, widthInches, heightFeet, heightInches].forEach(el => { el.style.display='none'; controls.appendChild(el); });

    // Flip selector
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t]) => { const o=document.createElement('option'); o.value=v; o.text=t; flipSelect.appendChild(o); });
    controls.appendChild(flipSelect);

    // B&W checkbox
    const bwCheckbox = document.createElement('input'); bwCheckbox.type='checkbox';
    const bwLabel = document.createElement('label'); bwLabel.append(bwCheckbox,' B&W'); controls.appendChild(bwLabel);

    // Panels checkbox
    const panelsCheckbox = document.createElement('input'); panelsCheckbox.type='checkbox';
    const panelsLabel = document.createElement('label'); panelsLabel.append(panelsCheckbox,' Show panels'); controls.appendChild(panelsLabel);

    // Price display & Shopify qty
    const priceDiv = document.createElement('div'); priceDiv.innerText='Price: $0.00'; container.appendChild(priceDiv);
    const qtyInput = document.querySelector('input[name="quantity"]'); if (qtyInput) { qtyInput.step='any'; qtyInput.min=0; }

    // Add to Cart button
    const addBtn = document.createElement('button'); addBtn.innerText='Add to Cart';
    Object.assign(addBtn.style, { marginTop:'1rem', padding:'0.5rem 1rem', background:'#007bff', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' });
    container.appendChild(addBtn);

    // Cropper setup
    let cropper, imgEl;
    function clearCanvas() {
      if (cropper) cropper.destroy();
      container.querySelector('.cropper-container')?.remove();
      container.querySelectorAll('.panel-line').forEach(el => el.remove());
    }
    function renderImage() {
      clearCanvas();
      const variant = product.variants[variantSelect.value];
      let src = variant.image?.src || variant.featured_image?.src || product.images[0];
      if (src.startsWith('//')) src = location.protocol + src;
      imgEl = document.createElement('img'); imgEl.src=src; imgEl.style.maxWidth='100%'; container.appendChild(imgEl);
      imgEl.onload = () => {
        cropper = new Cropper(imgEl, { viewMode:1, autoCropArea:1, dragMode:'move', cropBoxMovable:true, cropBoxResizable:false, zoomable:false, scalable:false });
        updateAll();
        if (panelsCheckbox.checked) drawPanels();
      };
    }
    function getWidthInches() {
      if (unitSelect.value==='feet') return (+widthFeet.value||0)*12 + (+widthInches.value||0);
      const v = +widthInput.value||0;
      return unitSelect.value==='cm' ? v*0.393700787 : v;
    }
    function getHeightInches() {
      if (unitSelect.value==='feet') return (+heightFeet.value||0)*12 + (+heightInches.value||0);
      const v = +heightInput.value||0;
      return unitSelect.value==='cm' ? v*0.393700787 : v;
    }
    function updateAll() {
      const w=getWidthInches(), h=getHeightInches();
      if (cropper && w>0 && h>0) {
        cropper.setAspectRatio(w/h);
        const sqft = Math.ceil((w*h)/144) || 1;
        const unitPrice = product.variants[variantSelect.value].price/100;
        priceDiv.innerText = `Price: $${(unitPrice*sqft).toFixed(2)}`;
        if (qtyInput) qtyInput.value = sqft;
      }
    }
    function applyFlip() {
      const wrap = container.querySelector('.cropper-container');
      if (wrap) wrap.style.transform = flipSelect.value==='horizontal' ? 'scaleX(-1)' : flipSelect.value==='vertical' ? 'scaleY(-1)' : '';
    }
    function applyBW() {
      const wrap = container.querySelector('.cropper-container');
      if (wrap) wrap.style.filter = bwCheckbox.checked ? 'grayscale(100%)' : '';
    }
    function drawPanels() {
      const wrap = container.querySelector('.cropper-container'); if (!cropper||!wrap) return;
      wrap.style.position='relative'; const data=cropper.getCropBoxData(); const total=getWidthInches(); const maxPanel=unitSelect.value==='cm'?25*2.54:25; const count=Math.ceil(total/maxPanel); const panelW=data.width/count;
      for (let i=1;i<count;i++) {
        const x=data.left+panelW*i;
        const line = document.createElement('div');
        Object.assign(line.style, { position:'absolute', top:`${data.top}px`, left:`${x}px`, height:`${data.height}px`, width:'2px', background:'rgba(0,0,0,0.7)', pointerEvents:'none' });
        container.appendChild(line);
      }
    }

    // Event listeners
    variantSelect.addEventListener('change',()=>{ renderImage(); applyFlip(); applyBW(); });
    unitSelect.addEventListener('change',()=>{ const isFeet=unitSelect.value==='feet'; [widthInput,heightInput].forEach(e=>e.style.display=isFeet?'none':'inline-block'); [widthFeet,widthInches,heightFeet,heightInches].forEach(e=>e.style.display=isFeet?'inline-block':'none'); updateAll(); if(panelsCheckbox.checked) drawPanels(); });
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches].forEach(e=>e.addEventListener('input',()=>{ updateAll(); if(panelsCheckbox.checked) drawPanels(); }));
    flipSelect.addEventListener('change',applyFlip);
    bwCheckbox.addEventListener('change',applyBW);
    panelsCheckbox.addEventListener('change',()=>{ panelsCheckbox.checked?drawPanels():container.querySelectorAll('.panel-line').forEach(el=>el.remove()); });

    // Add to cart
    addBtn.addEventListener('click',()=>{
      if (!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob=>{
        const reader=new FileReader();
        reader.onloadend=()=>{
          const imgUrl=reader.result;
          const sqft = Math.ceil((getWidthInches()*getHeightInches())/144) || 1;
          const props={
            Width: unitSelect.value==='feet'?`${widthFeet.value}ft ${widthInches.value}in`: unitSelect.value==='cm'?`${widthInput.value} cm`:`${widthInput.value} in`,
            Height: unitSelect.value==='feet'?`${heightFeet.value}ft ${heightInches.value}in`: unitSelect.value==='cm'?`${heightInput.value} cm`:`${heightInput.value} in`,
            Flip: flipSelect.value,
            BW: bwCheckbox.checked?'Yes':'No',
            Panels: panelsCheckbox.checked?'Yes':'No',
            'Cropped Image URL': imgUrl
          };
          fetch('/cart/add.js',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:product.variants[variantSelect.value].id, quantity:sqft, properties:props }) })
            .then(r=>r.json()).then(()=> window.location.href='/cart');
        };
        reader.readAsDataURL(blob);
      });
    });

    // Initial render
    renderImage(); updateAll();
  }

  document.addEventListener('DOMContentLoaded',()=>{ loadCropper().then(initCustomizer).catch(console.error); });
})();
