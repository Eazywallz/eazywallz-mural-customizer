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

    // parse product data
    let product;
    try {
      product = JSON.parse(container.dataset.product);
    } catch (e) {
      console.error('Invalid product JSON');
      return;
    }

    // clear any previous content
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.padding = '1rem';
    container.style.background = '#f9f9f9';

    // sidebar controls
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:320px;padding:1rem;flex-shrink:0;font-size:1rem;';
    container.appendChild(sidebar);

    function makeLabel(text) {
      const l = document.createElement('label');
      l.textContent = text;
      l.style.margin = '10px 0 5px';
      l.style.display = 'block';
      l.style.fontWeight = 'bold';
      return l;
    }

    sidebar.appendChild(makeLabel('Dimensions'));
    const unitSel = document.createElement('select');
    ['inches','feet','cm'].forEach(u => unitSel.add(new Option(u,u)));
    unitSel.style.cssText = 'width:100%;padding:10px;margin-bottom:10px;';

    const wIn = document.createElement('input');
    wIn.type = 'number'; wIn.placeholder = 'Width';
    wIn.style.cssText = 'width:100%;padding:10px;margin-bottom:10px;';

    const hIn = document.createElement('input');
    hIn.type = 'number'; hIn.placeholder = 'Height';
    hIn.style.cssText = 'width:100%;padding:10px;margin-bottom:20px;';

    sidebar.append(unitSel, wIn, hIn);

    sidebar.appendChild(makeLabel('Paper Type'));
    const variantSel = document.createElement('select');
    product.variants.forEach((v,i) => variantSel.add(new Option(v.title,i)));
    variantSel.style.cssText = 'width:100%;padding:10px;margin-bottom:20px;';
    sidebar.appendChild(variantSel);

    sidebar.appendChild(makeLabel('Options'));
    const flipSel = document.createElement('select');
    [['None','none'],['Flip H','h'],['Flip V','v']].forEach(([t,v])=>flipSel.add(new Option(t,v)));
    flipSel.style.cssText = 'width:100%;padding:10px;margin-bottom:10px;';
    const bwChk = document.createElement('input');
    bwChk.type = 'checkbox'; bwChk.style.marginRight = '5px';
    sidebar.append(bwChk, document.createTextNode('Black & White'), document.createElement('br'));

    const panelsChk = document.createElement('input');
    panelsChk.type = 'checkbox'; panelsChk.style.marginRight = '5px';
    sidebar.append(panelsChk, document.createTextNode('Show panels'));

    sidebar.appendChild(makeLabel('')); // spacer
    const priceDiv = document.createElement('div');
    priceDiv.textContent = 'Price: $0.00';
    priceDiv.style.margin = '20px 0';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add to Cart';
    addBtn.style.cssText = 'width:100%;padding:12px;background:#111;color:#fff;border:none;cursor:pointer;';
    sidebar.append(priceDiv, addBtn);

    // canvas area inline
    const canvasArea = document.createElement('div');
    canvasArea.style.cssText = 'flex:1;position:relative;display:flex;align-items:center;justify-content:center;background:#eaeaea;';
    container.appendChild(canvasArea);

    // core crop logic
    let cropper, imgEl;
    function renderImage() {
      canvasArea.innerHTML = '';
      if (cropper) cropper.destroy();
      let src = product.variants[variantSel.value].image?.src || product.images[0];
      if (src.startsWith('//')) src = location.protocol + src;
      imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.style.maxWidth = '100%'; imgEl.style.maxHeight = '100%';
      imgEl.onload = () => {
        canvasArea.append(imgEl);
        cropper = new Cropper(imgEl, {
          viewMode:1,
          autoCropArea:1,
          dragMode:'move',
          cropBoxMovable:false,
          cropBoxResizable:false,
          zoomable:false,
          scalable:false
        });
        update();
      };
    }

    function update() {
      if (!cropper) return;
      const w = +wIn.value, h = +hIn.value;
      if (w>0 && h>0) cropper.setAspectRatio(w/h);
      // flip
      const scaleX = flipSel.value==='h'?-1:1;
      const scaleY = flipSel.value==='v'?-1:1;
      cropper.scaleX(scaleX);
      cropper.scaleY(scaleY);
      // B&W
      imgEl.style.filter = bwChk.checked? 'grayscale(100%)': '';
      // panels
      canvasArea.querySelectorAll('.panel').forEach(n=>n.remove());
      if (panelsChk.checked && w>0) {
        const cb = cropper.getCropBoxData();
        const count = Math.ceil(w/25);
        const step = cb.width/count;
        for (let i=1;i<count;i++){
          const line = document.createElement('div');
          line.style.cssText = `position:absolute;top:${cb.top}px;left:${cb.left+step*i}px;height:${cb.height}px;width:2px;background:red;pointer-events:none;`;
          canvasArea.append(line);
        }
      }
      // price
      const sqft = Math.ceil((w*h)/144)||1;
      const price = (product.variants[variantSel.value].price/100)*sqft;
      priceDiv.textContent = `Price: $${price.toFixed(2)}`;
    }

    [wIn,hIn,unitSel,variantSel,flipSel,bwChk,panelsChk].forEach(el=>el.addEventListener('input',update));
    [unitSel].forEach(sel=>sel.addEventListener('change',()=>{
      // handle unit change if needed
    }));

    addBtn.addEventListener('click',()=>{
      // TODO: AJAX add to cart with line properties
      alert('Adding '+wIn.value+'x'+hIn.value+' to cart');
    });

    // initial
    renderImage();
  }

  if (document.readyState!=='loading') loadCropper().then(initCustomizer);
  else document.addEventListener('DOMContentLoaded',()=>loadCropper().then(initCustomizer));
})();
