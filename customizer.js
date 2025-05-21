// public/customizer.js
;(function () {
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
    if (!originalContainer) return;
    let product;
    try { product = JSON.parse(originalContainer.dataset.product); }
    catch (e) { return; }

    // Modal setup omitted for brevity...
    // after setting up modal, UI, cropper, etc.

    // Add to Cart button handler
    addBtn.addEventListener('click', () => {
      if (!cropper) return;
      cropper.getCroppedCanvas().toBlob(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imgUrl = reader.result;
          // show a link to the cropped image
          let link = document.getElementById('cropped-link');
          if (!link) {
            link = document.createElement('a');
            link.id = 'cropped-link';
            link.text = 'View cropped image';
            link.target = '_blank';
            link.style.display = 'block';
            link.style.marginTop = '0.5rem';
            originalContainer.appendChild(link);
          }
          link.href = imgUrl;

          // line properties
          const props = {
            Width: unitSelect.value==='feet'
              ? `${widthFeet.value}ft ${widthInches.value}in`
              : unitSelect.value==='cm'
                ? `${widthInput.value} cm`
                : `${widthInput.value} in`,
            Height: unitSelect.value==='feet'
              ? `${heightFeet.value}ft ${heightInches.value}in`
              : unitSelect.value==='cm'
                ? `${heightInput.value} cm`
                : `${heightInput.value} in`,
            Flip: flipSelect.value,
            BW: bwCheckbox.checked?'Yes':'No',
            Panels: panelsCheckbox.checked?'Yes':'No',
            'Image URL': imgUrl
          };

          // calculate quantity = area (sq ft)
          const w = getWidthInches(), h = getHeightInches();
          const areaQty = Math.max(1, +(w*h/144).toFixed(3));

          fetch('/cart/add.js', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              id: product.variants[variantSelect.value].id,
              quantity: areaQty,
              properties: props
            })
          })
          .then(r=>r.json())
          .then(()=> window.location.href = '/cart');
        };
        reader.readAsDataURL(blob);
      });
    });

    // initial render...
    renderImage(); updateAll();
  }

  document.addEventListener('DOMContentLoaded', () => loadCropper().then(initCustomizer).catch(console.error));
})();
