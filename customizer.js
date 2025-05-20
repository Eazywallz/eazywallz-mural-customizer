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

    // Build UI
    const unitSelect = document.createElement('select');
    [['inches','Inches'], ['feet','Feet'], ['cm','Centimeters']].forEach(([val, txt]) => {
      const opt = document.createElement('option'); opt.value = val; opt.text = txt; unitSelect.appendChild(opt);
    });
    
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i) => {
      const opt = document.createElement('option'); opt.value = i; opt.text = v.title; variantSelect.appendChild(opt);
    });
    const defaultIndex = product.variants.length>1?1:0;
    variantSelect.selectedIndex = defaultIndex;

    const widthInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Width', min:1 });
    const heightInput = Object.assign(document.createElement('input'), { type:'number', placeholder:'Height', min:1 });

    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip Horizontal'],['vertical','Flip Vertical'],['both','Flip Both']]
      .forEach(([val,txt])=>{const o=document.createElement('option');o.value=val;o.text=txt;flipSelect.appendChild(o);});
    const flipLabel = document.createElement('label'); flipLabel.textContent='Flip: '; flipLabel.appendChild(flipSelect);

    const bwCheckbox = document.createElement('input'); bwCheckbox.type='checkbox'; bwCheckbox.id='bw-toggle';
    const bwLabel = document.createElement('label'); bwLabel.htmlFor='bw-toggle'; bwLabel.textContent='Black & White'; bwLabel.prepend(bwCheckbox);

    const priceDisplay = document.createElement('div'); priceDisplay.innerText='Price: $0.00';

    container.append(unitSelect, variantSelect, widthInput, heightInput, flipLabel, bwLabel, priceDisplay);

    // Shopify quantity
    const qtyInput = document.querySelector('input[name="quantity"]');
    if(qtyInput){qtyInput.step='any'; qtyInput.min=0;}

    // Image + Cropper
    let cropper,imgEl; let flipX=false, flipY=false;
    function renderImage(variant, idx){
      if(cropper){cropper.destroy(); imgEl.remove();}
      let src = variant.image?.src ?? variant.featured_image?.src ??
        (Array.isArray(product.images)&&product.images[idx]?product.images[idx]:product.images[0]);
      if(!src){console.error('Customizer: no image',variant);return;}
      if(src.startsWith('//')) src=window.location.protocol+src;
      imgEl=document.createElement('img'); imgEl.src=src; imgEl.style.width='100%'; imgEl.style.display='block'; container.appendChild(imgEl);
      imgEl.onload=()=>{ cropper=new Cropper(imgEl,{viewMode:1,autoCropArea:1,dragMode:'none',cropBoxMovable:true,cropBoxResizable:true,zoomable:false,scalable:false}); updateAspectRatio(); applyFlips(); applyBW();};
    }
    let currentIndex=defaultIndex, currentVariant=product.variants[currentIndex];
    renderImage(currentVariant,currentIndex);
    variantSelect.addEventListener('change',e=>{ currentIndex=parseInt(e.target.value,10); currentVariant=product.variants[currentIndex]; flipX=flipY=false; flipSelect.value='none'; bwCheckbox.checked=false; renderImage(currentVariant,currentIndex); recalc();});

    function toInches(v){const n=parseFloat(v);if(!(n>0))return NaN;switch(unitSelect.value){case 'feet':return n*12;case 'cm':return n*0.393700787;default:return n;}}
    function updateAspectRatio(){const w=toInches(widthInput.value),h=toInches(heightInput.value); if(cropper&&w>0&&h>0)cropper.setAspectRatio(w/h);}
    function applyFlips(){ if(!cropper)return; const wantX=(flipSelect.value==='horizontal'||flipSelect.value==='both'); if(wantX!==flipX){cropper.scaleX(-1);flipX=wantX;} const wantY=(flipSelect.value==='vertical'||flipSelect.value==='both'); if(wantY!==flipY){cropper.scaleY(-1);flipY=wantY;} }
    flipSelect.addEventListener('change',applyFlips);
    function applyBW(){ if(!imgEl)return; imgEl.style.filter=bwCheckbox.checked?'grayscale(100%)':''; }
    bwCheckbox.addEventListener('change',applyBW);

    function recalc(){ const w=toInches(widthInput.value),h=toInches(heightInput.value); if(!(w>0&&h>0))return; updateAspectRatio(); const areaSqIn=w*h, areaSqFt=areaSqIn/144, unitPrice=currentVariant.price/100, total=unitPrice*areaSqFt; priceDisplay.innerText=`Price: $${total.toFixed(2)}`; if(qtyInput) qtyInput.value=areaSqFt.toFixed(2);}    
    widthInput.addEventListener('input',recalc);
    heightInput.addEventListener('input',recalc);
    unitSelect.addEventListener('change',recalc);

    console.log('Customizer initialized');
  }

  document.addEventListener('DOMContentLoaded',()=>{ loadCropper().then(initCustomizer).catch(err=>console.error('Customizer: failed to load Cropper.js',err)); });
})();
