<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wall Mural Customizer</title>
  <style>
    body {
      margin: 0;
      font-family: sans-serif;
      display: flex;
      height: 100vh;
    }
    #controls {
      width: 25%;
      padding: 20px;
      box-sizing: border-box;
      background: #f8f8f8;
    }
    #canvas-container {
      width: 75%;
      position: relative;
      background: #ddd;
    }
    canvas {
      display: block;
      max-width: 100%;
      height: 100vh;
    }
    label {
      display: block;
      margin-top: 10px;
    }
    input, select {
      width: 100%;
      padding: 5px;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div id="controls">
    <h2>Customize Your Mural</h2>
    <label for="width">Width (inches)</label>
    <input type="number" id="width" placeholder="Enter width">

    <label for="height">Height (inches)</label>
    <input type="number" id="height" placeholder="Enter height">

    <label for="material">Material</label>
    <select id="material">
      <option value="paper" data-price="3">Prepasted Paper ($3/sqft)</option>
      <option value="vinyl" data-price="5">Type II Vinyl ($5/sqft)</option>
    </select>

    <h3 id="price-display">Total: $0.00</h3>
    <button onclick="addToCart()">Add to Cart</button>
  </div>

  <div id="canvas-container">
    <canvas id="mural-canvas"></canvas>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js"></script>
  <script>
    const canvas = new fabric.Canvas('mural-canvas', { selection: false });
    let imgInstance;
    let cropBox;

    // Load image
    fabric.Image.fromURL('https://cdn.shopify.com/s/files/1/0000/0001/products/sample-image.jpg', function(img) {
      imgInstance = img;
      img.set({
        left: 0,
        top: 0,
        hasBorders: false,
        hasControls: false,
        selectable: false
      });
      img.scaleToHeight(canvas.getHeight());
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });

    // Resize + crop logic
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
        selectable: false
      });

      canvas.add(cropBox);
      canvas.bringToFront(cropBox);
      updatePrice();
    }

    function updatePrice() {
      const width = parseFloat(document.getElementById('width').value);
      const height = parseFloat(document.getElementById('height').value);
      const material = document.getElementById('material');
      const pricePerSqft = parseFloat(material.options[material.selectedIndex].dataset.price);

      if (!width || !height) return;

      const area = (width * height) / 144; // convert to square feet
      const price = area * pricePerSqft;

      document.getElementById('price-display').innerText = `Total: $${price.toFixed(2)}`;
    }

    function addToCart() {
      alert('This will send data to Shopify cart using line item properties (next step).');
    }
  </script>
</body>
</html>
