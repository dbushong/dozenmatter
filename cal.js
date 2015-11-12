// Generated by CoffeeScript 1.10.0
(function() {
  var bufferSize, calFullHeight, calHeight, calWidth, canvas, ctx, i, imagesLoaded, imgs, lineWidth, numThreads, paths, photoHeight, photoHeight2, photoWidth, photoWidth2, queue, queueWorker, results, scaleImage, smoothResize, workers,
    slice = [].slice;

  numThreads = navigator.hardwareConcurrency || 2;

  calWidth = 3648;

  calFullHeight = 2736;

  photoWidth = 4608;

  photoHeight = 3456;

  photoWidth2 = 4160;

  photoHeight2 = 3120;

  lineWidth = 30;

  bufferSize = 60;

  calHeight = calFullHeight - bufferSize;

  smoothResize = true;

  canvas = null;

  ctx = null;

  imgs = [];

  paths = ['05/DSC05391.JPG', '05/DSC05397.JPG', '05/DSC05402.JPG', '05/DSC05439.JPG', '05/IMG_20150501_072117555.jpg'];

  workers = (function() {
    results = [];
    for (var i = 1; 1 <= numThreads ? i <= numThreads : i >= numThreads; 1 <= numThreads ? i++ : i--){ results.push(i); }
    return results;
  }).apply(this).map(function() {
    return new Worker('resize.js');
  });

  queueWorker = function(task, cb) {
    var dh, dw, start, worker;
    dw = task.dw, dh = task.dh;
    console.log('starting work for resize', task.extra);
    worker = workers.shift();
    worker.onmessage = function(msg) {
      var buffer, img, progress, ref, ref1, x, y;
      ref = msg.data, (ref1 = ref.extra, x = ref1.x, y = ref1.y), buffer = ref.buffer, progress = ref.progress;
      if (progress != null) {

      } else {
        console.log('received scaled data for', {
          x: x,
          y: y
        }, "in " + (Date.now() - start) + "ms");
        img = new ImageData(new Uint8ClampedArray(buffer), dw, dh);
        ctx.putImageData(img, x, y);
        workers.push(worker);
        return cb();
      }
    };
    start = Date.now();
    return worker.postMessage(task, [task.srcBuffer, task.dstBuffer]);
  };

  queue = async.queue(queueWorker, numThreads);

  if (window.async == null) {
    window.async = {
      parallel: function(fns, cb) {
        var done, fn, j, len, len1, results1;
        done = 0;
        len = fns.length;
        results1 = [];
        for (j = 0, len1 = fns.length; j < len1; j++) {
          fn = fns[j];
          results1.push(fn(function() {
            if (++done === len) {
              return cb();
            }
          }));
        }
        return results1;
      }
    };
  }

  scaleImage = function() {
    var args, ctx, dh, dstBuffer, dw, dx, dy, img, ref, sh, src, srcBuffer, srcCtx, sw, sx, sy;
    ctx = arguments[0], img = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    ref = args.length > 4 ? args.splice(0, 4) : [0, 0, img.width, img.height], sx = ref[0], sy = ref[1], sw = ref[2], sh = ref[3];
    dx = args[0], dy = args[1], dw = args[2], dh = args[3];
    if (!smoothResize) {
      return ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    src = document.createElement('canvas');
    src.width = sw;
    src.height = sh;
    srcCtx = src.getContext('2d');
    srcCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    srcBuffer = srcCtx.getImageData(0, 0, sw, sh).data.buffer;
    dstBuffer = (new ImageData(dw, dh)).data.buffer;
    console.log("queueing resize for " + img.src + " -> " + dx + "," + dy);
    return queue.push({
      sw: sw,
      sh: sh,
      dw: dw,
      dh: dh,
      srcBuffer: srcBuffer,
      dstBuffer: dstBuffer,
      extra: {
        x: dx,
        y: dy
      }
    });
  };

  imagesLoaded = function() {
    var dh, dw, dx, dy, rh, rw, rx, ry, sh, sw, sx, sy;
    console.log('images loaded');
    ctx.fillRect(rx = 0, ry = calHeight, rw = calWidth, rh = bufferSize);
    scaleImage(ctx, imgs[0], sx = 1766, sy = 380, sw = 1094, sh = 3041, dx = 0, dy = 0, dw = Math.round(calHeight / sh * sw), dh = calHeight);
    ctx.fillRect(rx = dw, ry = 0, rw = lineWidth, rh = calHeight);
    scaleImage(ctx, imgs[1], dx = rx + rw, dy = 0, dw = calWidth - dx, dh = Math.round(dw / photoWidth * photoHeight));
    ctx.fillRect(rx = dx, ry = dh, rw = dw, rh = lineWidth);
    scaleImage(ctx, imgs[2], sx = 908, sy = 1046, sw = 2794, sh = 1595, dx = rx, dy = ry + rh, dw = Math.round((dh = calHeight - dy) / sh * sw), dh = dh);
    ctx.fillRect(rx = dx + dw, ry = dy, rw = lineWidth, rh = dh);
    scaleImage(ctx, imgs[3], dx = rx + rw, dy = ry, dw = Math.round((dh = calHeight - dy) / photoHeight * photoWidth), dh = dh);
    ctx.fillRect(rx = dx + dw, ry = dy, rw = lineWidth, rh = dh);
    return scaleImage(ctx, imgs[4], sx = 392, sy = 543, sw = 2284, sh = 2601, dx = rx + rw, dy = ry, dw = calWidth - dx, dh = calHeight - dy);
  };

  window.onload = function() {
    var fns;
    canvas = document.getElementById('canvas');
    canvas.width = calWidth;
    canvas.height = calFullHeight;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    fns = paths.map(function(path) {
      return function(cb) {
        var img;
        img = new Image;
        img.addEventListener('load', cb);
        img.src = "2016/" + path;
        return imgs.push(img);
      };
    });
    return async.parallel(fns, imagesLoaded);
  };

}).call(this);

//# sourceMappingURL=cal.js.map