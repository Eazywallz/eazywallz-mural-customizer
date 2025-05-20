// public/customizer.js

;(function () {
  // 1) Grab a reference to the container
  const container = document.getElementById('mural-customizer');
  if (!container) return;

  // 2) Create UI: width, height inputs + price display
  const widthInput = document.createElement('input');
  widthInput.type = 'number';
  widthInput.placeholder = 'Width (in)';
  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.placeholder = 'Height (in)';

  const priceDisplay = document.createElement('div');
  priceDisplay.innerText = 'Price: $0.00';

  container.append(widthInput, heightInput, priceDisplay);

  // 3) TODO: Fetch Shopify variant data, initialize Cropper on the selected image

  console.log('Mural Customizer loaded');
})();

