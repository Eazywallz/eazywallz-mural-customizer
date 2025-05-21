// public/customizer.js
;(function() {
  // 1) Load fabric.js from CDN
  function loadFabric() {
    return new Promise((res, rej) => {
      if (window.fabric) return res();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
      s.onload = () => res();
      s.onerror = () => rej(new Error('Failed to load fabric.js'));
      document.head.appendChild(s);
    });
  }

  function initFabricCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return console.warn('Customizer: missing #mural-customizer');

    // parse Shopify product JSON
    let product;
    try { product = JSON.parse(container.dataset.product) }
    catch(e) { return console.error('Invalid product JSON', e) }

    // --- build modal skeleton ---
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Customize Mural';
    Object.assign(openBtn.style, { margin:'1rem', padding:'0.5rem 1rem' });
    container.appendChild(openBtn);

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position:'fixed',top:0,left:0,width:'100vw',height:'100vh',
      background:'rgba(0,0,0,0.6)',display:'none',
      alignItems:'center',justifyContent:'center',zIndex:10000
    });
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width:'90vw', height:'90vh', maxWidth:'1200px', maxHeight:'800px',
      background:'#fff',position:'relative',display:'flex',flexDirection:'column'
    });
    overlay.appendChild(modal);

    // close btn
    const close = document.createElement('button');
    close.textContent = '✕';
    Object.assign(close.style, {
      position:'absolute', top:'8px', right:'12px',
      background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer'
    });
    close.onclick = () => overlay.style.display = 'none';
    modal.appendChild(close);

    // controls panel
    const ctrl = document.createElement('div');
    Object.assign(ctrl.style, {
      padding:'1rem', display:'flex', gap:'0.5rem', borderBottom:'1px solid #ddd'
    });
    modal.appendChild(ctrl);

    // canvas wrapper
    const canvasWrapper = document.createElement('div');
    Object.assign(canvasWrapper.style, {
      flex:'1', position:'relative', overflow:'hidden'
    });
    modal.appendChild(canvasWrapper);

    // footer
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding:'1rem', borderTop:'1px solid #ddd', display:'flex',justifyContent:'space-between'
    });
    modal.appendChild(footer);

    // --- build controls ---
    // variant select
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o = document.createElement('option');
      o.value = i; o.textContent = v.title;
      variantSelect.appendChild(o);
    });
    ctrl.appendChild(variantSelect);

    // width & height
    const wIn = document.createElement('input');
    wIn.type = 'number'; wIn.placeholder = 'Width (in)'; wIn.min = 1; ctrl.appendChild(wIn);
    const hIn = document.createElement('input');
    hIn.type = 'number'; hIn.placeholder = 'Height (in)'; hIn.min = 1; ctrl.appendChild(hIn);

    // flip
    const flip = document.createElement('select');
    ['none','horizontal','vertical'].forEach(v=>{
      const o=document.createElement('option');
      o.value=v; o.textContent=v==='none'? 'No Flip' : v==='horizontal'? 'Flip H' : 'Flip V';
      flip.append(o);
    });
    ctrl.appendChild(flip);

    // grayscale
    const gBox = document.createElement('input');
    gBox.type='checkbox'; ctrl.appendChild(gBox);
    ctrl.appendChild(document.createTextNode('Grayscale'));

    // panels
    const pBox = document.createElement('input');
    pBox.type='checkbox'; ctrl.appendChild(pBox);
    ctrl.appendChild(document.createTextNode('Show Panels'));

    // price / add
    const price = document.createElement('div');
    price.textContent = 'Price: $0.00';
    const add = document.createElement('button');
    add.textContent = 'Add to Cart';
    Object.assign(add.style, { padding:'0.5rem 1rem', background:'#007bff', color:'#fff' });
    footer.appendChild(price);
    footer.appendChild(add);

    // 2) instantiate Fabric
    let canvas, bgImg, cropRect;
    function setupCanvas() {
      canvasWrapper.innerHTML = '';
      const c = document.createElement('canvas');
      c.width  = canvasWrapper.clientWidth;
      c.height = canvasWrapper.clientHeight;
      canvasWrapper.appendChild(c);
      canvas = new fabric.Canvas(c, { selection:false });
    }

    // load variant image
    function loadImage() {
      const variant = product.variants[variantSelect.value];
      let src = variant.image?.src || variant.featured_image?.src || product.images[1];
      if (src.startsWith('//')) src = location.protocol + src;
      return new Promise(res => {
        fabric.Image.fromURL(src, img => {
          bgImg = img.set({ selectable:false, evented:false });
          const f = Math.min(canvas.width/img.width, canvas.height/img.height);
          bgImg.scale(f);
          canvas.setBackgroundImage(bgImg, canvas.requestRenderAll.bind(canvas));
          res();
        });
      });
    }

    // draw fixed‐ratio crop rect centered
    function drawCrop() {
      if (cropRect) canvas.remove(cropRect);
      const w = parseFloat(wIn.value)||1;
      const h = parseFloat(hIn.value)||1;
      const aspect = w/h;
      const cw = canvas.width * 0.8;
      const ch = cw / aspect;
      cropRect = new fabric.Rect({
        left:(canvas.width-cw)/2, top:(canvas.height-ch)/2,
        width:cw, height:ch,
        fill:'rgba(0,0,0,0)', stroke:'#888', strokeDashArray:[4,4],
        hasControls:false, hasBorders:false, selectable:true
      });
      canvas.add(cropRect).setActiveObject(cropRect);
    }

    function updateAll() {
      if (!cropRect) return;
      // aspect & recalc price
      drawCrop();
      const area = Math.ceil((parseFloat(wIn.value)||1)*(parseFloat(hIn.value)||1)/144);
      const cents = +product.variants[variantSelect.value].price;
      price.textContent = `Price: $${((cents/100)*area).toFixed(2)}`;
    }

    function applyFlip() {
      if (!bgImg) return;
      bgImg.set('flipX', flip.value==='horizontal');
      bgImg.set('flipY', flip.value==='vertical');
      canvas.requestRenderAll();
    }

    function applyGray() {
      if (!bgImg) return;
      if (gBox.checked) {
        bgImg.filters = [ new fabric.Image.filters.Grayscale() ];
      } else {
        bgImg.filters = [];
      }
      bgImg.applyFilters();
      canvas.requestRenderAll();
    }

    function drawPanels() {
      // clear old lines
      canvas.getObjects('line').forEach(l=>canvas.remove(l));
      if (!pBox.checked || !cropRect) return;
      const cd = cropRect.getBoundingRect();
      const totalW = parseFloat(wIn.value)||1;
      const maxPer = 25;
      const cols = Math.ceil(totalW/maxPer);
      const step = cd.width/cols;
      for (let i=1; i<cols; i++) {
        const x = cd.left + step*i;
        canvas.add(new fabric.Line([x,cd.top,x,cd.top+cd.height], {
          stroke:'rgba(255,0,0,0.7)', selectable:false, evented:false
        }));
      }
      canvas.requestRenderAll();
    }

    async function boot() {
      setupCanvas();
      await loadImage();
      drawCrop();
      updateAll();
    }

    // event wiring
    openBtn.onclick = ()=> overlay.style.display='flex';
    variantSelect.onchange = ()=> boot();
    [wIn,hIn].forEach(i=>i.oninput=()=> { updateAll(); drawPanels(); });
    flip.onchange = ()=> { applyFlip(); drawPanels(); };
    gBox.onchange = applyGray;
    pBox.onchange = drawPanels;

    add.onclick = ()=> {
      // export exactly inside cropRect
      const rect = cropRect.getBoundingRect();
      const exportCanvas = new fabric.StaticCanvas(null, {
        width: rect.width, height: rect.height
      });
      // clone background and position
      const clone = fabric.util.object.clone(bgImg);
      clone.set({
        left: -rect.left,
        top:  -rect.top,
        scaleX: bgImg.scaleX,
        scaleY: bgImg.scaleY
      });
      exportCanvas.add(clone);
      const dataUrl = exportCanvas.toDataURL('png');
      // post to cart
      const qty = Math.ceil((parseFloat(wIn.value)||1)*(parseFloat(hIn.value)||1)/144);
      fetch('/cart/add.js', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          id: product.variants[variantSelect.value].id,
          quantity: qty || 1,
          properties: { cropped_image: dataUrl }
        })
      })
      .then(()=> window.location='/cart')
      .catch(console.error);
    };

    // initial boot
    boot();
  }

  // kick off
  loadFabric()
    .then(initFabricCustomizer)
    .catch(e=>console.error(e));
})();
