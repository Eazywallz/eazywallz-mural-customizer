;(function () {
  // 1) Load Cropper.js + CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src     = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload  = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 2) Initialize everything
  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return console.warn('Customizer: container missing');

    // — open button —
    let openBtn = document.getElementById('customizer-open-btn');
    if (!openBtn) {
      openBtn = document.createElement('button');
      openBtn.id    = 'customizer-open-btn';
      openBtn.type  = 'button';
      openBtn.innerText = 'Customize Mural';
      Object.assign(openBtn.style, {
        margin:'1rem 0', padding:'0.5rem 1rem',
        background:'#007bff', color:'#fff', border:'none', cursor:'pointer'
      });
      container.insertBefore(openBtn, container.firstChild);
    }

    // — overlay & modal —
    let overlay = document.getElementById('customizer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'customizer-overlay';
      Object.assign(overlay.style, {
        position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
        background:'rgba(0,0,0,0.5)', display:'none',
        alignItems:'center', justifyContent:'center', zIndex:10000
      });
      document.body.appendChild(overlay);
    }
    let modal = document.getElementById('customizer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customizer-modal';
      Object.assign(modal.style, {
        background:'#fff', borderRadius:'8px',
        width:'100vw', height:'100vh', maxWidth:'1200px', maxHeight:'900px',
        display:'flex', flexDirection:'column', position:'relative'
      });
      overlay.appendChild(modal);
    }

    // — close button —
    let closeBtn = document.getElementById('customizer-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.id = 'customizer-close-btn';
      closeBtn.type = 'button';
      closeBtn.innerText = '✕';
      Object.assign(closeBtn.style, {
        position:'absolute', top:'10px', right:'10px',
        fontSize:'1.5rem', background:'transparent',
        border:'none', cursor:'pointer'
      });
      closeBtn.addEventListener('click', () => overlay.style.display = 'none');
      modal.appendChild(closeBtn);
    }

    // — controls bar —
    let controls = document.getElementById('customizer-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'customizer-controls';
      Object.assign(controls.style, {
        padding:'1rem', display:'flex', flexWrap:'wrap',
        gap:'0.5rem', borderBottom:'1px solid #ddd'
      });
      modal.appendChild(controls);
    }

    // — canvas area —
    let canvasArea = document.getElementById('customizer-canvas');
    if (!canvasArea) {
      canvasArea = document.createElement('div');
      canvasArea.id = 'customizer-canvas';
      Object.assign(canvasArea.style, {
        flex:'1', position:'relative', overflow:'hidden',
        display:'flex', alignItems:'center', justifyContent:'center'
      });
      modal.appendChild(canvasArea);
    }

    // — footer —
    let footer = document.getElementById('customizer-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'customizer-footer';
      Object.assign(footer.style, {
        padding:'1rem', borderTop:'1px solid #ddd',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      });
      modal.appendChild(footer);
    }

    // parse product JSON
    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch(e){ return console.error('Invalid product JSON', e); }

    // utility to build selects/inputs
    function createSelect(id, opts) {
      const s = document.createElement('select');
      s.id = id;
      opts.forEach(([v,t]) => {
        const o = document.createElement('option');
        o.value = v; o.text = t;
        s.append(o);
      });
      return s;
    }
    function createInput(id,type,ph,min=1,max=null,hidden=false){
      const i = document.createElement('input');
      i.id = id; i.type = type; i.placeholder = ph;
      i.min = min;
      if (max !== null) i.max = max;
      i.hidden = hidden;
      return i;
    }

    // --- build controls ---
    const unitSelect = createSelect('unit-select', [
      ['inches','Inches'],['feet','Feet'],['cm','Centimeters']
    ]);
    const variantSelect = createSelect('variant-select',
      product.variants.map((v,i)=>([i,v.title]))
    );
    const widthInput   = createInput('width-input','number','Width',1,null,false);
    const heightInput  = createInput('height-input','number','Height',1,null,false);
    const widthFeet    = createInput('width-feet','number','Feet',0,null,true);
    const widthInches  = createInput('width-inches','number','Inches',0,11,true);
    const heightFeet   = createInput('height-feet','number','Feet',0,null,true);
    const heightInches = createInput('height-inches','number','Inches',0,11,true);
    const flipSelect   = createSelect('flip-select', [
      ['none','None'],['horizontal','Flip H'],['vertical','Flip V']
    ]);
    const bwCheckbox      = Object.assign(document.createElement('input'),{id:'bw-checkbox',type:'checkbox'});
    const bwLabel         = document.createTextNode(' B&W');
    const panelsCheckbox  = Object.assign(document.createElement('input'),{id:'panels-checkbox',type:'checkbox'});
    const panelsLabel     = document.createTextNode(' Show panels');

    controls.append(
      unitSelect, variantSelect,
      widthInput, heightInput,
      widthFeet, widthInches, heightFeet, heightInches,
      flipSelect,
      bwCheckbox, bwLabel,
      panelsCheckbox, panelsLabel
    );

    const priceDiv = document.createElement('div');
    priceDiv.id = 'price-display';
    priceDiv.innerText = 'Price: $0.00';

    const addBtn = document.createElement('button');
    addBtn.id   = 'add-btn';
    addBtn.type = 'button';
    addBtn.innerText = 'Add to Cart';
    Object.assign(addBtn.style,{
      padding:'0.5rem 1rem', background:'#007bff',
      color:'#fff', border:'none', borderRadius:'4px',
      cursor:'pointer'
    });
    footer.append(priceDiv, addBtn);

    // store refs
    let cropper, imgEl;

    function clearCanvas(){
      if (cropper) cropper.destroy();
      canvasArea.innerHTML = '';
    }

    function renderImage(){
      clearCanvas();
      let src = product.variants[variantSelect.value].image?.src
             || product.variants[variantSelect.value].featured_image?.src
             || product.images[1];
      if (src.startsWith('//')) src = location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      Object.assign(imgEl.style,{
        minWidth:'100%', minHeight:'100%', display:'block'
      });
      imgEl.onload = () => {
        canvasArea.append(imgEl);
        setTimeout(()=>{
          cropper = new Cropper(imgEl, {
            viewMode: 1,
            autoCropArea: 1,
            dragMode: 'move',
            cropBoxMovable: false,
            cropBoxResizable: false,
            zoomable: false,
            scalable: false,
            responsive: true,

            // initial draw
            ready() {
              updateAll();
              if (panelsCheckbox.checked) drawPanels();
            },
            // redraw on move and end
            cropmove() {
              if (panelsCheckbox.checked) drawPanels();
            },
            cropend() {
              if (panelsCheckbox.checked) drawPanels();
            }
          });
        }, 50);
      };
    }

    function toInches(v){
      return unitSelect.value==='cm'
        ? v * 0.393700787
        : v;
    }
    function getW(){
      return unitSelect.value==='feet'
        ? (+widthFeet.value||0)*12 + (+widthInches.value||0)
        : toInches(+widthInput.value||0);
    }
    function getH(){
      return unitSelect.value==='feet'
        ? (+heightFeet.value||0)*12 + (+heightInches.value||0)
        : toInches(+heightInput.value||0);
    }

    function updateAll(){
      const w = getW(), h = getH();
      if (!cropper || w<=0 || h<=0) return;
      cropper.setAspectRatio(w/h);
      const sqft   = Math.ceil((w*h)/144) || 1;
      const priceC = +product.variants[variantSelect.value].price;
      priceDiv.innerText = `Price: $${((priceC/100)*sqft).toFixed(2)}`;
    }

    function applyFlip(){
      const wrapper = canvasArea.querySelector('.cropper-canvas');
      if (wrapper){
        wrapper.style.transform =
          flipSelect.value==='horizontal'? 'scaleX(-1)' :
          flipSelect.value==='vertical'?   'scaleY(-1)' : '';
      }
    }

    function applyBW(){
      const wrapper = canvasArea.querySelector('.cropper-canvas');
      if (wrapper){
        wrapper.style.filter = bwCheckbox.checked
          ? 'grayscale(100%)'
          : '';
      }
    }

    function drawPanels(){
      canvasArea.querySelectorAll('.panel-line').forEach(n=>n.remove());
      if (!cropper) return;
      const cb    = cropper.getCropBoxData();
      const total = getW();
      const maxW  = 25;
      const count = Math.ceil(total/maxW);
      const step  = cb.width / count;
      for (let i=1;i<count;i++){
        const x = cb.left + step*i;
        const line = document.createElement('div');
        line.className = 'panel-line';
        Object.assign(line.style,{
          position:   'absolute',
          top:        `${cb.top}px`,
          left:       `${x}px`,
          height:     `${cb.height}px`,
          width:      '2px',
          background: 'rgba(255,0,0,0.6)',
          pointerEvents:'none'
        });
        canvasArea.append(line);
      }
    }

    // — events —
    openBtn.addEventListener('click', ()=>{
      overlay.style.display = 'flex';
      if (cropper) cropper.resize();
      else renderImage();
    });

    variantSelect.addEventListener('change', ()=>{
      renderImage(); applyFlip(); applyBW();
    });

    unitSelect.addEventListener('change', ()=>{
      const isFeet = unitSelect.value==='feet';
      widthInput.hidden = heightInput.hidden = isFeet;
      [widthFeet,widthInches,heightFeet,heightInches].forEach(i=>i.hidden=!isFeet);
      updateAll();
      if (panelsCheckbox.checked) drawPanels();
    });

    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches]
    .forEach(i=>i.addEventListener('input',()=>{
      updateAll();
      if (panelsCheckbox.checked) drawPanels();
    }));

    flipSelect.addEventListener('change', applyFlip);
    bwCheckbox .addEventListener('change', applyBW);
    panelsCheckbox.addEventListener('change', ()=>{
      if (panelsCheckbox.checked) drawPanels();
      else canvasArea.querySelectorAll('.panel-line').forEach(n=>n.remove());
    });

    addBtn.addEventListener('click', ()=>{
      if (!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob=>{
        const reader = new FileReader();
        reader.onloadend = ()=>{
          const props = {
            Width: unitSelect.value==='feet'
              ? `${widthFeet.value}ft ${widthInches.value}in`
              : `${widthInput.value} ${unitSelect.value}`,
            Height: unitSelect.value==='feet'
              ? `${heightFeet.value}ft ${heightInches.value}in`
              : `${heightInput.value} ${unitSelect.value}`,
            Flip:   flipSelect.value,
            BW:     bwCheckbox.checked?'Yes':'No',
            Panels: panelsCheckbox.checked?'Yes':'No'
          };
          const qty = Math.ceil((getW()*getH())/144)||1;
          fetch('/cart/add.js',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              id: product.variants[variantSelect.value].id,
              quantity: qty,
              properties: props
            })
          })
          .then(r=>r.json())
          .then(()=> location.href='/cart')
          .catch(console.error);
        };
        reader.readAsDataURL(blob);
      });
    });

    // no auto-render; wait for button
  }

  // boot on DOM ready
  if (document.readyState!=='loading') {
    loadCropper().then(initCustomizer).catch(console.error);
  } else {
    document.addEventListener('DOMContentLoaded',()=>{
      loadCropper().then(initCustomizer).catch(console.error);
    });
  }
})();
