     imgEl.onload = () => {
-      canvasArea.appendChild(imgEl);
-      cropper = new Cropper(imgEl, {
-        viewMode:1,
-        autoCropArea:1,
-        dragMode:'move',
-        cropBoxMovable:false,
-        cropBoxResizable:false,
-        zoomable:false,
-        scalable:false,
-        responsive:true
-      });
-      // these won’t work – cropper.on doesn’t exist
-      ['cropmove','cropend'].forEach(evt=>
-        cropper.on(evt, ()=>{ if (panelsCheckbox.checked) drawPanels(); })
-      );
-      updateAll();
+      canvasArea.appendChild(imgEl);
+      cropper = new Cropper(imgEl, {
+        viewMode:           1,
+        autoCropArea:       1,
+        dragMode:           'move',
+        cropBoxMovable:     false,
+        cropBoxResizable:   false,
+        zoomable:           false,
+        scalable:           false,
+        responsive:         true,
+        // wire up your panel‐drawing callbacks directly:
+        cropmove: () => { if (panelsCheckbox.checked) drawPanels(); },
+        cropend:  () => { if (panelsCheckbox.checked) drawPanels(); },
+        ready() {
+          updateAll();
+          if (panelsCheckbox.checked) drawPanels();
+        }
+      });
     };
