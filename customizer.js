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
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initCustomizer() {
    const originalContainer = document.getElementById('mural-customizer');
    if (!originalContainer) return console.warn('Customizer: missing container');

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'customizer-modal';
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    });
    overlay.style.display = 'flex'; // use flex layout
    document.body.appendChild(overlay);

    // Modal content container
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      background: '#fff', padding: '1rem', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', overflowY: 'auto'
    });
    overlay.appendChild(modalContent);

    // Move original container into modal content
    modalContent.appendChild(originalContainer);
    Object.assign(originalContainer.style, { maxWidth: '500px', margin: '0 auto' });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
    });
    modalContent.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');

    // Open button (trigger)
    const openBtn = document.createElement('button');
    openBtn.innerText = 'Customize Mural';
    Object.assign(openBtn.style, { margin: '1rem', padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' });
    document.body.insertBefore(openBtn, originalContainer);
    openBtn.addEventListener('click', () => overlay.style.display = 'flex');

    // Now build the rest of the customizer UI inside originalContainer
    const container = originalContainer;

    // Controls wrapper
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.gap = '0.5rem';
    controls.style.marginBottom = '1rem';
    container.appendChild(controls);

    // Unit select
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']].forEach(([v,t])=>{
      const o=document.createElement('option');o.value=v;o.text=t;unitSelect.appendChild(o);
    }); controls.appendChild(unitSelect);

    // Variant select
    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o=document.createElement('option');o.value=i;o.text=v.title;variantSelect.appendChild(o);
    });
    const defaultIdx = product.variants.length>1?1:0;
    variantSelect.selectedIndex = defaultIdx;
    controls.appendChild(variantSelect);

    // Dimension inputs (inches/cm)
    const widthInput = Object.assign(document.createElement('input'),{type:'number',placeholder:'Width',min:1});
    const heightInput = Object.assign(document.createElement('input'),{type:'number',placeholder:'Height',min:1});
    controls.append(widthInput, heightInput);

    // Dimension inputs (feet/inches)
    const widthFeet = Object.assign(document.createElement('input'),{type:'number',placeholder:'Feet',min:0});
    const widthInches = Object.assign(document.createElement('input'),{type:'number',placeholder:'Inches',min:0,max:11});
    const heightFeet = Object.assign(document.createElement('input'),{type:'number',placeholder:'Feet',min:0});
    const heightInches = Object.assign(document.createElement('input'),{type:'number',placeholder:'Inches',min:0,max:11});
    [widthFeet,widthInches,heightFeet,heightInches].forEach(el=>{el.style.display='none';controls.appendChild(el);});
    // clamp inputs
    widthInches.addEventListener('input',()=>{if(+widthInches.value>11)widthInches.value=11;});
    heightInches.addEventListener('input',()=>{if(+heightInches.value>11)heightInches.value=11;});
    widthFeet.addEventListener('input',()=>{if(widthFeet.value.length>3)widthFeet.value=widthFeet.value.slice(0,3);});
    heightFeet.addEventListener('input',()=>{if(heightFeet.value.length>3)heightFeet.value=heightFeet.value.slice(0,3);});

    // Flip select
    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']].forEach(([v,t])=>{
      const o=document.createElement('option');o.value=v;o.text=t;flipSelect.appendChild(o);
    }); controls.appendChild(flipSelect);

    // B&W checkbox
    const bwCheckbox = document.createElement('input');bwCheckbox.type='checkbox';
    const bwLabel = document.createElement('label');bwLabel.append(bwCheckbox,' B&W');controls.appendChild(bwLabel);

    // Panels toggle
    const panelsCheckbox = document.createElement('input');panelsCheckbox.type='checkbox';
    const panelsLabel = document.createElement('label');panelsLabel.append(panelsCheckbox,' Show panels');controls.appendChild(panelsLabel);

    // Price display & quantity
    const priceDiv = document.createElement('div');priceDiv.innerText='Price: $0.00';container.appendChild(priceDiv);
    const qty = document.querySelector('input[name="quantity"]');if(qty){qty.step='any';qty.min=0;}

    // Cropper
    let cropper,imgEl;
    function clearCropper(){if(cropper)cropper.destroy();const o=container.querySelector('.cropper-container');if(o)o.remove();clearPanels();}
    function renderImage(variant,idx){clearCropper();let src=variant.image?.src||variant.featured_image?.src||product.images[idx]||product.images[0];if(src.startsWith('//'))src=location.protocol+src;imgEl=document.createElement('img');imgEl.src=src;imgEl.style.width='100%';container.appendChild(imgEl);imgEl.onload=()=>{cropper=new Cropper(imgEl,{viewMode:1,autoCropArea:1,dragMode:'move',cropBoxMovable:true,cropBoxResizable:false,zoomable:false,scalable:false});if(panelsCheckbox.checked)drawPanels();};}
    let currentIdx=defaultIdx,currentVariant=product.variants[currentIdx];panelsCheckbox.addEventListener('change',()=>{panelsCheckbox.checked?drawPanels():clearPanels();});
    renderImage(currentVariant,currentIdx);

    function getWidthInches(){if(unitSelect.value==='feet')return(+(widthFeet.value)||0)*12+(+(widthInches.value)||0);const v=+(widthInput.value)||0;return unitSelect.value==='cm'?v*0.393700787:v;}
    function getHeightInches(){if(unitSelect.value==='feet')return(+(heightFeet.value)||0)*12+(+(heightInches.value)||0);const v=+(heightInput.value)||0;return unitSelect.value==='cm'?v*0.393700787:v;}

    function drawPanels(){clearPanels();if(!cropper)return;const data=cropper.getCropBoxData();const totalInches=getWidthInches();const panelMax=unitSelect.value==='cm'?25*2.54:25;const count=Math.ceil(totalInches/panelMax);const wrap=container.querySelector('.cropper-container');wrap.style.position='relative';for(let i=1;i<count;i++){const x=data.left+(data.width/count)*i;const line=document.createElement('div');line.className='panel-line';Object.assign(line.style,{position:'absolute',top:data.top+'px',left:x+'px',width:'2px',height:data.height+'px',background:'rgba(0,0,0,0.7)',zIndex:9999,pointerEvents:'none'});wrap.appendChild(line);} }
    function clearPanels(){container.querySelectorAll('.panel-line').forEach(e=>e.remove());}

    function applyFlip(){const wrap=container.querySelector('.cropper-container');const sx=flipSelect.value==='horizontal'?-1:1;const sy=flipSelect.value==='vertical'?-1:1;if(wrap)wrap.style.transform=`scale(${sx},${sy})`;}
    function applyBW(){const wrap=container.querySelector('.cropper-container');if(wrap)wrap.style.filter=bwCheckbox.checked?'grayscale(100%)':'';}

    function updateSizeAndPrice(){const w=getWidthInches(),h=getHeightInches();if(cropper&&w>0&&h>0){cropper.setAspectRatio(w/h);const area=w*h/144;const total=(currentVariant.price/100)*area;priceDiv.innerText=`Price: $${total.toFixed(2)}`;if(qty)qty.value=area.toFixed(2);}}

    variantSelect.addEventListener('change',e=>{currentIdx=+e.target.value;currentVariant=product.variants[currentIdx];renderImage(currentVariant,currentIdx);updateSizeAndPrice();});
    unitSelect.addEventListener('change',()=>{const fm=unitSelect.value==='feet';[widthInput,heightInput].forEach(e=>e.style.display=fm?'none':'inline-block');[widthFeet,widthInches,heightFeet,heightInches].forEach(e=>e.style.display=fm?'inline-block':'none');updateSizeAndPrice();if(panelsCheckbox.checked)drawPanels();});
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches].forEach(e=>e.addEventListener('input',()=>{updateSizeAndPrice();if(panelsCheckbox.checked)drawPanels();}));
    flipSelect.addEventListener('change',applyFlip);
    bwCheckbox.addEventListener('change',applyBW);

    console.log('Customizer initialized');
  }

  document.addEventListener('DOMContentLoaded',()=>loadCropper().then(initCustomizer).catch(console.error));
})();
