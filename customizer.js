// public/customizer.js
;(function () {
  // Load Cropper.js and its CSS
  function loadCropper() {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload = () => { console.log('Cropper.js loaded'); resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return console.warn('Customizer: missing container');
    container.style.maxWidth = '500px';
    container.style.margin = '1rem auto';
    container.style.position = 'relative'; // for overlays

    // Parse product data
    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch (e) { return console.error('Customizer: invalid JSON', e); }
    console.log('Customizer: product loaded', product);

    // Build controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.gap = '0.5rem';
    controls.style.marginBottom = '1rem';

    // Units
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t])=>{
      const o=document.createElement('option');o.value=v;o.text=t;unitSelect.appendChild(o);
    });
    controls.appendChild(unitSelect);

    // Variants
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o=document.createElement('option');o.value=i;o.text=v.title;variantSelect.appendChild(o);
    });
    const defaultIdx = product.variants.length>1?1:0;
    variantSelect.selectedIndex = defaultIdx;
    controls.appendChild(variantSelect);

    // Dimension inputs
    const widthInput = Object.assign(document.createElement('input'),{type:'number',placeholder:'Width',min:1});
    const heightInput = Object.assign(document.createElement('input'),{type:'number',placeholder:'Height',min:1});
    const widthFeet = Object.assign(document.createElement('input'),{type:'number',placeholder:'Feet',min:0});
    const widthInches = Object.assign(document.createElement('input'),{type:'number',placeholder:'Inches',min:0,max:11});
    const heightFeet = Object.assign(document.createElement('input'),{type:'number',placeholder:'Feet',min:0});
    const heightInches = Object.assign(document.createElement('input'),{type:'number',placeholder:'Inches',min:0,max:11});
    // clamps
    widthInches.addEventListener('input',()=>{if(+widthInches.value>11)widthInches.value=11;});
    heightInches.addEventListener('input',()=>{if(+heightInches.value>11)heightInches.value=11;});
    widthFeet.addEventListener('input',()=>{if(widthFeet.value.length>3)widthFeet.value=widthFeet.value.slice(0,3);});
    heightFeet.addEventListener('input',()=>{if(heightFeet.value.length>3)heightFeet.value=heightFeet.value.slice(0,3);});

    [widthFeet,widthInches,heightFeet,heightInches].forEach(e=>{e.style.display='none'; controls.appendChild(e)});
    controls.append(widthInput, heightInput);

    // Flip
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t])=>{
      const o=document.createElement('option');o.value=v;o.text=t;flipSelect.appendChild(o);
    });
    controls.appendChild(flipSelect);

    // B&W
    const bw = document.createElement('input'); bw.type='checkbox';
    const bwLabel = document.createElement('label'); bwLabel.append(bw,' B&W');
    controls.appendChild(bwLabel);

    // Panels
    const panels = document.createElement('input'); panels.type='checkbox';
    const panelsLabel = document.createElement('label'); panelsLabel.append(panels,' Show panels');
    controls.appendChild(panelsLabel);

    container.appendChild(controls);

    // Price
    const priceDiv = document.createElement('div'); priceDiv.innerText = 'Price: $0.00';
    container.appendChild(priceDiv);
    const qty = document.querySelector('input[name="quantity"]');
    if(qty){qty.step='any';qty.min=0;}

    // Cropper
    let cropper, img;
    function clearCropper(){
      if(cropper)cropper.destroy();
      const old=container.querySelector('.cropper-container'); if(old)old.remove();
      clearPanels();
    }
    function render(iv,i){
      clearCropper();
      let src=iv.image?.src||iv.featured_image?.src||product.images[i]||product.images[0];
      if(src.startsWith('//'))src=location.protocol+src;
      img=document.createElement('img');img.src=src;img.style.width='100%';container.appendChild(img);
      img.onload=()=>{
        cropper=new Cropper(img,{viewMode:1,autoCropArea:1,dragMode:'move',cropBoxResizable:false,zoomable:false,scalable:false});
        if(panels.checked)drawPanels();
      };
    }
    let idx=defaultIdx, variant=product.variants[idx];
    panels.addEventListener('change',()=>panels.checked?drawPanels():clearPanels());

    // Measurements
    function toInches(){
      if(unitSelect.value==='feet')return(+widthFeet.value||0)*12+(+widthInches.value||0);
      const v=+widthInput.value||0; return unitSelect.value==='cm'?v*0.393700787:v;
    }
    function toInchesH(){
      if(unitSelect.value==='feet')return(+heightFeet.value||0)*12+(+heightInches.value||0);
      const v=+heightInput.value||0; return unitSelect.value==='cm'?v*0.393700787:v;
    }

    // Panels overlay
    function drawPanels(){
      clearPanels(); if(!cropper)return;
      const data=cropper.getCropBoxData();
      const maxW=unitSelect.value==='cm'?25*2.54:25;
      const cnt=Math.ceil(toInches()/maxW);
      const wrap=container.querySelector('.cropper-container');
      wrap.style.position='relative';
      for(let j=1;j<cnt;j++){
        const x=data.left+(data.width/cnt)*j;
        const line=document.createElement('div');
        Object.assign(line.style,{position:'absolute',top:`${data.top}px`,left:`${x}px`,width:'2px',height:`${data.height}px`,background:'rgba(0,0,0,0.7)',zIndex:'9999',pointerEvents:'none'});
        wrap.appendChild(line);
      }
    }
    function clearPanels(){container.querySelectorAll('.panel-line').forEach(e=>e.remove());}

    // Recalc price & ratio but never rerender image
    function recalc(){
      const w=toInches(),h=toInchesH();
      if(cropper&&w>0&&h>0)cropper.setAspectRatio(w/h);
      // flip
      const scX=flipSelect.value==='horizontal'?-1:1;
      const scY=flipSelect.value==='vertical'?-1:1;
      const wrap=container.querySelector('.cropper-container'); if(wrap)wrap.style.transform=`scale(${scX},${scY})`;
      // bw
      if(wrap)wrap.style.filter=bw.checked?'grayscale(100%)':'';
      // panels
      if(panels.checked)drawPanels();
      // price
      if(w>0&&h>0){
        const area=w*h/144;
        const tot=(variant.price/100)*area;
        priceDiv.innerText=`Price: $${tot.toFixed(2)}`;
        if(qty)qty.value=area.toFixed(2);
      }
    }

    // Events
    variantSelect.addEventListener('change',e=>{idx=+e.target.value;variant=product.variants[idx];render(variant,idx);});
    unitSelect.addEventListener('change',()=>{
      const f=unitSelect.value==='feet';
      [widthInput,heightInput].forEach(e=>e.style.display=f?'none':'inline-block');
      [widthFeet,widthInches,heightFeet,heightInches].forEach(e=>e.style.display=f?'inline-block':'none');
      recalc();
    });
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches].forEach(e=>e.addEventListener('input',recalc));
    flipSelect.addEventListener('change',()=>{applyFlips();});
    bw.addEventListener('change',()=>{applyBW();});

    function applyFlips(){rec alc();}
    function applyBW(){rec alc();}

    console.log('Customizer initialized');
  }

  document.addEventListener('DOMContentLoaded',()=>loadCropper().then(initCustomizer).catch(console.error));
})();
