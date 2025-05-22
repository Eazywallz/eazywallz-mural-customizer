const canvas = new fabric.Canvas('mural-canvas', { selection: false });
let imgInstance;
let cropBox;

// Attempt to infer product handle from URL
const pathParts = window.location.pathname.split('/');
const handle = pathParts.includes('products') ? pathParts[pathParts.indexOf('products') + 1] : null;

if (handle) {
  fetch(`/products/${handle}.js`)
    .then(res => res.json())
    .then(product => {
  const imageUrl = product.images?.[1] || product.images?.[0] || product.featured_image;
  loadProductImage(imageUrl);
  populateVariants(product.variants);
});
}

function loadProductImage(url) {
  fabric.Image.fromURL(url, function(img) {
    imgInstance = img;
    img.set({
      left: 0,
      top: 0,
      hasBorders: false,
      hasControls: false,
      selectable: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true
    });

    img.scaleToHeight(canvas.getHeight());
    canvas.add(img);
    canvas.sendToBack(img);
  });
}

function populateVariants(variants) {
  const materialSelect = document.getElementById('material');
  materialSelect.innerHTML = '';
  variants.forEach(variant => {
    const sqftPrice = (variant.price / 100).toFixed(2);
    const opt = document.createElement('option');
    opt.value = variant.id;
    opt.dataset.price = sqftPrice;
    opt.textContent = `${variant.title} ($${sqftPrice}/sqft)`;
    materialSelect.appendChild(opt);
  });
  updatePrice();
}

document.getElementById('width').addEventListener('input', updateCrop);
document.getElementById('height').addEventListener('input', updateCrop);
document.getElementById('material').addEventListener('change', updatePrice);

function updateCrop() {
  const width = parseFloat(document.getElementById('width').value);
  const height = parseFloat(document.getElementById('height').value);

  if (!width || !height) return;

  const ratio = width / height;
  const canvasW = canvas.getWidth();
  const canvasH = canvas.getHeight();

  let cropW, cropH;
  if (canvasW / canvasH > ratio) {
    cropH = canvasH;
    cropW = cropH * ratio;
  } else {
    cropW = canvasW;
    cropH = cropW / ratio;
  }

  if (cropBox) canvas.remove(cropBox);

  cropBox = new fabric.Rect({
    width: cropW,
    height: cropH,
    left: (canvasW - cropW) / 2,
    top: (canvasH - cropH) / 2,
    fill: 'rgba(255, 255, 255, 0.3)',
    stroke: 'black',
    strokeWidth: 1,
    selectable: false,
    evented: false
  });

  canvas.add(cropBox);
  canvas.bringToFront(cropBox);
  updatePrice();
}

function updatePrice() {
  const width = parseFloat(document.getElementById('width').value);
  const height = parseFloat(document.getElementById('height').value);
  const material = document.getElementById('material');
  const pricePerSqft = parseFloat(material.options[material.selectedIndex]?.dataset.price || 0);

  if (!width || !height) return;

  const area = (width * height) / 144;
  const price = area * pricePerSqft;

  document.getElementById('price-display').innerText = `Total: $${price.toFixed(2)}`;
}

function addToCart() {
  alert('This will send data to Shopify cart using line item properties (next step).');
}
