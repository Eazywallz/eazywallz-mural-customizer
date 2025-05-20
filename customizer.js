// public/customizer.js
;(function () {
  // … loadCropper() unchanged …

  function initCustomizer() {
    const container = document.getElementById('mural-customizer');
    if (!container) return;

+   // limit the widget width, center it
+   container.style.maxWidth = '500px';
+   container.style.margin = '1rem auto';

    let product;
    try { product = JSON.parse(container.dataset.product); }
    catch (e) { return console.error(e); }

    // … build UI unchanged …

    let cropper, imgEl;
    function renderImage(variant) {
      if (cropper) { cropper.destroy(); imgEl.remove(); }

      // find a valid src
      let src = (
        (variant.image && variant.image.src) ||
        (variant.featured_image && variant.featured_image.src) ||
        (product.images && product.images[0])
      );
      if (!src) return console.error('No image!');

      if (src.startsWith('//')) src = window.location.protocol + src;

      imgEl = document.createElement('img');
-     imgEl.style.maxWidth = '100%';
+     imgEl.style.width    = '100%';
+     imgEl.style.display  = 'block';
      imgEl.src = src;
      container.appendChild(imgEl);

      imgEl.onload = () => {
        cropper = new Cropper(imgEl, {
          viewMode:       1,
          autoCropArea:   1,
-         movable:        false,
-         zoomable:       false,
-         scalable:       false,
+         dragMode:       'none',         // disable dragging the image
+         cropBoxMovable: true,           // allow moving the crop box
+         cropBoxResizable: true,         // allow resizing it
+         zoomable:       false,
+         scalable:       false,
        });
      };
    }

    // … rest unchanged …
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCropper()
      .then(initCustomizer)
      .catch(err => console.error(err));
  });
})();
