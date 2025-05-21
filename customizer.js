// public/customizer.js
;(function(){
  function loadCropper(){
    return new Promise((res, rej)=>{
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src     = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
      script.onload  = res;
      script.onerror = rej;
      document.head.appendChild(script);
    });
  }

  function initCustomizer(){
    const container = document.getElementById('mural-customizer');
    if(!container) return console.warn('Customizer: container missing');

    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch{ return console.error('Customizer: bad JSON'); }

    // — open button
    let openBtn = document.getElementById('customizer-open-btn');
    if(!openBtn){
      openBtn = document.createElement('button');
      openBtn.id = 'customizer-open-btn';
      openBtn.innerText = 'Customize Mural';
      Object.assign(openBtn.style,{
        margin:'1rem 0',
        padding:'0.5rem 1rem',
        background:'#007bff',
        color:'#fff',
        border:'none',
        cursor:'pointer'
      });
      container.insertBefore(openBtn,container.firstChild);
    }

    // — overlay & modal
    let overlay = document.getElementById('customizer-overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'customizer-overlay';
      Object.assign(overlay.style,{
        position:'fixed',top:0,left:0,
        width:'100vw',height:'100vh',
        background:'rgba(0,0,0,0.5)',
        display:'none',
        alignItems:'center',
        justifyContent:'center',
        zIndex:10000
      });
      document.body.appendChild(overlay);
    }

    let modal = document.getElementById('customizer-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'customizer-modal';
      Object.assign(modal.style,{
        background:'#fff',
        borderRadius:'8px',
        width:'100vw',
        height:'100vh',
        display:'flex',
        flexDirection:'column',
        position:'relative',
        overflow:'hidden'
      });
      overlay.appendChild(modal);
    }

    // — close
    let closeBtn = document.getElementById('customizer-close-btn');
    if(!closeBtn){
      closeBtn = document.createElement('button');
      closeBtn.id = 'customizer-close-btn';
      closeBtn.innerText = '✕';
      Object.assign(closeBtn.style,{
        position:'absolute',top:'10px',right:'10px',
        fontSize:'1.5rem',background:'transparent',
        border:'none',cursor:'pointer',zIndex:10
      });
      closeBtn.onclick = ()=> overlay.style.display='none';
      modal.appendChild(closeBtn);
    }

    // — controls
    let controls = document.getElementById('customizer-controls');
    if(!controls){
      controls = document.createElement('div');
      controls.id = 'customizer-controls';
      Object.assign(controls.style,{
        padding:'1rem', display:'flex', flexWrap:'wrap', gap:'10px',
        borderBottom:'1px solid #ddd', background:'#f9f9f9'
      });
      modal.appendChild(controls);
    }

    // — canvas area
    let canvasArea = document.getElementById('customizer-canvas');
    if(!canvasArea){
      canvasArea = document.createElement('div');
      canvasArea.id = 'customizer-canvas';
      Object.assign(canvasArea.style,{
        flex:'1 1 auto', minHeight:'0',
        position:'relative', overflow:'hidden',
        display:'flex', alignItems:'center', justifyContent:'center'
      });
      modal.appendChild(canvasArea);
    }

    // — footer
    let footer = document.getElementById('customizer-footer');
    if(!footer){
      footer = document.createElement('div');
      footer.id = 'customizer-footer';
      Object.assign(footer.style,{
        padding:'1rem', borderTop:'1px solid #ddd',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      });
      modal.appendChild(footer);
    }

    // — build controls UI
    const unitSelect = document.createElement('select');
    [['inches','Inches'],['feet','Feet'],['cm','Centimeters']]
      .forEach(([v,t])=>{
        const o=document.createElement('option'); o.value=v; o.text=t;
        unitSelect.appendChild(o);
      });
    controls.appendChild(unitSelect);

    const variantSelect = document.createElement('select');
    product.variants.forEach((v,i)=>{
      const o=document.createElement('option'); o.value=i; o.text=v.title;
      variantSelect.appendChild(o);
    });
    controls.appendChild(variantSelect);

    const widthInput  = Object.assign(document.createElement('input'),{type:'number',placeholder:'Width',min:1,style:'width:80px'});
    const heightInput = Object.assign(document.createElement('input'),{type:'number',placeholder:'Height',min:1,style:'width:80px'});
    controls.append(widthInput,heightInput);

    const widthFeet    = Object.assign(document.createElement('input'),{type:'number',placeholder:'ft',min:0,maxLength:3,hidden:true,style:'width:60px'});
    const widthInches  = Object.assign(document.createElement('input'),{type:'number',placeholder:'in',min:0,max:11,maxLength:2,hidden:true,style:'width:60px'});
    const heightFeet   = Object.assign(document.createElement('input'),{type:'number',placeholder:'ft',min:0,maxLength:3,hidden:true,style:'width:60px'});
    const heightInches = Object.assign(document.createElement('input'),{type:'number',placeholder:'in',min:0,max:11,maxLength:2,hidden:true,style:'width:60px'});
    controls.append(widthFeet,widthInches,heightFeet,heightInches);

    const flipSelect = document.createElement('select');
    [['none','None'],['horizontal','Flip H'],['vertical','Flip V']]
      .forEach(([v,t])=>{
        const o=document.createElement('option'); o.value=v; o.text=t;
        flipSelect.appendChild(o);
      });
    controls.appendChild(flipSelect);

    const bwCheckbox = Object.assign(document.createElement('input'),{type:'checkbox'});
    controls.append(bwCheckbox,document.createTextNode(' B&W '));

    const panelsCheckbox = Object.assign(document.createElement('input'),{type:'checkbox'});
    controls.append(panelsCheckbox,document.createTextNode(' Show panels '));

    const priceDiv = document.createElement('div');
    priceDiv.innerText = 'Price: $0.00';
    const addBtn = document.createElement('button');
    addBtn.innerText = 'Add to Cart';
    Object.assign(addBtn.style,{
      padding:'0.5rem 1rem', background:'#007bff',
      color:'#fff', border:'none', cursor:'pointer'
    });
    footer.append(priceDiv,addBtn);

    const qtyInput = document.querySelector('input[name="quantity"]');
    if(qtyInput){ qtyInput.step='1'; qtyInput.min='1'; }

    // — cropper variables
    let cropper, imgEl;

    function clearCanvas(){
      if(cropper) cropper.destroy();
      canvasArea.innerHTML = '';
    }

    // ** updated renderImage **
    function renderImage() {
      clearCanvas();
      let src = product.variants[variantSelect.value].image?.src
             || product.variants[variantSelect.value].featured_image?.src
             || product.images[0];
      if(src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img');
      imgEl.src = src;
      Object.assign(imgEl.style,{
        position:'absolute',
        top:'0', left:'0',
        width:'auto', height:'auto',
        minWidth:'100%', minHeight:'100%',
        maxWidth:'none', maxHeight:'none',
        userSelect:'none', pointerEvents:'none'
      });
      canvasArea.appendChild(imgEl);

      imgEl.onload = ()=>{
        cropper = new Cropper(imgEl,{
          viewMode:1, dragMode:'move', autoCropArea:1,
          cropBoxMovable:false, cropBoxResizable:false,
          zoomable:false, scalable:false, responsive:true,
          ready(){
            const cd = cropper.getContainerData();
            cropper.setCanvasData({ left:0, top:0, width:cd.width, height:cd.height });
            updateAll();
            if(panelsCheckbox.checked) drawPanels();
          }
        });
        cropper.on('cropmove', ()=> panelsCheckbox.checked && drawPanels());
        cropper.on('cropend' , ()=> panelsCheckbox.checked && drawPanels());
      };
    }

    function toInches(v){ return unitSelect.value==='cm'? v*0.393700787 : v; }
    function getW(){
      return unitSelect.value==='feet'
        ? ((+widthFeet.value||0)*12 + (+widthInches.value||0))
        : toInches(+widthInput.value||0);
    }
    function getH(){
      return unitSelect.value==='feet'
        ? ((+heightFeet.value||0)*12 + (+heightInches.value||0))
        : toInches(+heightInput.value||0);
    }

    function updateAll(){
      const w=getW(), h=getH();
      if(!cropper || w<=0 || h<=0) return;
      cropper.setAspectRatio(w/h);
      const sqft=Math.ceil((w*h)/144)||1;
      const cents=+product.variants[variantSelect.value].price;
      priceDiv.innerText = `Price: $${((cents/100)*sqft).toFixed(2)}`;
      if(qtyInput) qtyInput.value=sqft;
    }

    function applyFlip(){
      if(!cropper) return;
      const x = flipSelect.value==='horizontal'? -1 : 1;
      const y = flipSelect.value==='vertical'?   -1 : 1;
      cropper.scaleX(x);
      cropper.scaleY(y);
    }

    function applyBW(){
      if(!imgEl) return;
      imgEl.style.filter = bwCheckbox.checked? 'grayscale(100%)' : '';
    }

    function drawPanels(){
      if(!cropper) return;
      modal.querySelectorAll('.panel-line').forEach(l=>l.remove());
      const cb = cropper.getCropBoxData();
      const total=getW(), maxW=25;
      const count=Math.ceil(total/maxW), step=cb.width/count;
      for(let i=1;i<count;i++){
        const x=cb.left+step*i;
        const line=document.createElement('div');
        line.className='panel-line';
        Object.assign(line.style,{
          position:'absolute',
          top:   `${cb.top}px`,
          left:  `${x}px`,
          height:`${cb.height}px`,
          width:'2px',
          background:'rgba(255,0,0,0.7)',
          pointerEvents:'none'
        });
        modal.appendChild(line);
      }
    }

    // — events
    openBtn.onclick     = ()=> overlay.style.display='flex';
    closeBtn.onclick    = ()=> overlay.style.display='none';
    variantSelect.onchange = ()=>{ renderImage(); applyFlip(); applyBW(); };
    unitSelect.onchange = ()=>{
      const f = unitSelect.value==='feet';
      widthInput.hidden = heightInput.hidden = f;
      [widthFeet,widthInches,heightFeet,heightInches].forEach(i=>i.hidden=!f);
      updateAll(); panelsCheckbox.checked&&drawPanels();
    };
    [widthInput,heightInput,widthFeet,widthInches,heightFeet,heightInches]
      .forEach(i=> i.oninput = ()=>{ updateAll(); panelsCheckbox.checked&&drawPanels(); });
    flipSelect.onchange   = applyFlip;
    bwCheckbox.onchange   = applyBW;
    panelsCheckbox.onchange=()=>{
      if(panelsCheckbox.checked) drawPanels();
      else modal.querySelectorAll('.panel-line').forEach(l=>l.remove());
    };
    addBtn.onclick = ()=>{
      if(!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob=>{
        const r=new FileReader();
        r.onloadend = ()=>{
          const props={
            Width:  unitSelect.value==='feet'
                      ? `${widthFeet.value}ft ${widthInches.value}in`
                      : `${widthInput.value} ${unitSelect.value}`,
            Height: unitSelect.value==='feet'
                      ? `${heightFeet.value}ft ${heightInches.value}in`
                      : `${heightInput.value} ${unitSelect.value}`,
            Flip:   flipSelect.value,
            BW:     bwCheckbox.checked?'Yes':'No',
            Panels: panelsCheckbox.checked?'Yes':'No'
          };
          const qty=Math.ceil((getW()*getH())/144)||1;
          fetch('/cart/add.js',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
              id:product.variants[variantSelect.value].id,
              quantity:qty,
              properties:props
            })
          })
          .then(r=>r.json())
          .then(()=>window.location='/cart')
          .catch(console.error);
        };
        r.readAsDataURL(blob);
      });
    };

    // boot
    renderImage();
  }

  if(document.readyState!=='loading'){
    loadCropper().then(initCustomizer).catch(console.error);
  } else {
    document.addEventListener('DOMContentLoaded',()=>{
      loadCropper().then(initCustomizer).catch(console.error);
    });
  }
})();
