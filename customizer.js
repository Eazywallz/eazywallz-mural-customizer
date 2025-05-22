const canvas = new fabric.Canvas('mural-canvas', { selection: false });
let imgInstance;
let cropBox;

// Listen for product data from Shopify via postMessage
window.addEventListener("message", (event) => {
  const product = event.data?.product;
  if (!product) return;

  console.log("✅ Product data received:", product);

  const imageUrl = product.images?.[1] || product.images?.[0] || product.featured_image;
  loadProductImage(imageUrl);
  populateVariants(product.variants);
});

function loadProductImage(url) {
  fabric.Image.fromURL(url, function (img) {
    imgInstance = img;

    img.set({
      hasBorders: false,
      hasControls: false,
      selectable: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true
    });

    img.scaleToHeight(canvas.getHeight());

    img.left = (canvas.getWidth() - img.getScaledWidth()) / 2;
    img.top = (canvas.getHeight() - img.getScaledHeight()) / 2;

    canvas.add(img);
    canvas.sendToBack(img);
    canvas.renderAll();

    updateCrop(); // draw crop box after image loads
  });
}

function populateVariants(variants) {
  const materialSelect = document.getElementById("material");
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

document.getElementById("width").addEventListener("input", updateCrop);
document.getElementById("height").addEventListener("input", updateCrop);
document.getElementById("material").addEventListener("change", updatePrice);

function updateCrop() {
  const width = parseFloat(document.getElementById("width").value);
  const height = parseFloat(document.getElementById("height").value);
  if (!width || !height || !canvas) return;

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
  const width = parseFloat(document.getElementById("width").value);
  const height = parseFloat(document.getElementById("height").value);
  const material = document.getElementById("material");
  const pricePerSqft = parseFloat(material.options[material.selectedIndex]?.dataset.price || 0);

  if (!width || !height) return;

  const area = (width * height) / 144;
  const price = area * pricePerSqft;

  document.getElementById("price-display").innerText = `Total: $${price.toFixed(2)}`;
}

function addToCart() {
  const width = parseFloat(document.getElementById("width").value);
  const height = parseFloat(document.getElementById("height").value);
  const materialSelect = document.getElementById("material");
  const variantId = materialSelect.value;

  if (!width || !height || !variantId) {
    alert("Please enter dimensions and select a material.");
    return;
  }

  const area = (width * height) / 144;
  const quantity = Math.max(1, Math.round(area));

  const crop = cropBox?.getBoundingRect?.() || {};
  const cropData = {
    left: Math.round(crop.left || 0),
    top: Math.round(crop.top || 0),
    width: Math.round(crop.width || 0),
    height: Math.round(crop.height || 0),
  };

  const properties = {
    Width: `${width} in`,
    Height: `${height} in`,
    Area: `${area.toFixed(2)} sqft`,
    CropPosition: `X:${cropData.left}, Y:${cropData.top}, W:${cropData.width}, H:${cropData.height}`
  };

  fetch("/cart/add.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: variantId,
      quantity: quantity,
      properties: properties,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      alert("✅ Added to cart!");
      window.location.href = "/cart";
    })
    .catch((err) => {
      console.error("Add to cart failed", err);
      alert("❌ Could not add to cart.");
    });
}
