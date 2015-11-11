// Generated by CoffeeScript 1.10.0

/* 
 * MIT License
 *  You may use this code as long as you retain this notice.  Use at your own risk! :)
 *  https://github.com/danschumann/limby-resize
 *  0.0.8
 */

(function() {
  if (typeof window !== "undefined" && window !== null) {
    return;
  }

  self.onmessage = function(arg) {
    var _data2, a, alphaOffset, alphas, bottomFactor, data, data2, dh, dstBuffer, dw, extra, extraX, extraY, i, j, k, l, m, offset, ref, ref1, ref2, ref3, ref4, rightFactor, sh, srcBuffer, sw, targetOffset, targetX, targetY, x1, xFactor, xScale, y1, yFactor, yScale;
    ref = arg.data, sw = ref.sw, sh = ref.sh, dw = ref.dw, dh = ref.dh, srcBuffer = ref.srcBuffer, dstBuffer = ref.dstBuffer, extra = ref.extra;
    data = new Uint8ClampedArray(srcBuffer);
    _data2 = new Uint8ClampedArray(dstBuffer);
    data2 = Array(_data2.length);
    data2.fill(0.0);
    alphas = Array(_data2.length >> 2);
    alphas.fill(1);
    xScale = dw / sw;
    yScale = dh / sh;
    for (y1 = j = 0, ref1 = sh; 0 <= ref1 ? j < ref1 : j > ref1; y1 = 0 <= ref1 ? ++j : --j) {
      if (!(y1 % 100)) {
        self.postMessage({
          extra: extra,
          progress: y1 / sh
        });
      }
      for (x1 = k = 0, ref2 = sw; 0 <= ref2 ? k < ref2 : k > ref2; x1 = 0 <= ref2 ? ++k : --k) {
        extraX = false;
        extraY = false;
        targetX = Math.floor(x1 * xScale);
        targetY = Math.floor(y1 * yScale);
        xFactor = xScale;
        yFactor = yScale;
        bottomFactor = 0;
        rightFactor = 0;
        offset = (y1 * sw + x1) * 4;
        targetOffset = (targetY * dw + targetX) * 4;
        if (targetX < Math.floor((x1 + 1) * xScale)) {
          rightFactor = (x1 + 1) * xScale % 1;
          xFactor -= rightFactor;
          extraX = true;
        }
        if (targetY < Math.floor((y1 + 1) * yScale)) {
          bottomFactor = (y1 + 1) * yScale % 1;
          yFactor -= bottomFactor;
          extraY = true;
        }
        a = data[offset + 3] / 255;
        alphaOffset = targetOffset / 4;
        if (extraX) {
          data2[targetOffset + 4] += data[offset] * rightFactor * yFactor * a;
          data2[targetOffset + 5] += data[offset + 1] * rightFactor * yFactor * a;
          data2[targetOffset + 6] += data[offset + 2] * rightFactor * yFactor * a;
          data2[targetOffset + 7] += data[offset + 3] * rightFactor * yFactor;
          alphas[alphaOffset + 1] -= (1 - a) * rightFactor * yFactor;
        }
        if (extraY) {
          data2[targetOffset + dw * 4] += data[offset] * xFactor * bottomFactor * a;
          data2[targetOffset + dw * 4 + 1] += data[offset + 1] * xFactor * bottomFactor * a;
          data2[targetOffset + dw * 4 + 2] += data[offset + 2] * xFactor * bottomFactor * a;
          data2[targetOffset + dw * 4 + 3] += data[offset + 3] * xFactor * bottomFactor;
          alphas[alphaOffset + dw] -= (1 - a) * xFactor * bottomFactor;
        }
        if (extraX && extraY) {
          data2[targetOffset + dw * 4 + 4] += data[offset] * rightFactor * bottomFactor * a;
          data2[targetOffset + dw * 4 + 5] += data[offset + 1] * rightFactor * bottomFactor * a;
          data2[targetOffset + dw * 4 + 6] += data[offset + 2] * rightFactor * bottomFactor * a;
          data2[targetOffset + dw * 4 + 7] += data[offset + 3] * rightFactor * bottomFactor;
          alphas[alphaOffset + dw + 1] -= (1 - a) * rightFactor * bottomFactor;
        }
        data2[targetOffset] += data[offset] * xFactor * yFactor * a;
        data2[targetOffset + 1] += data[offset + 1] * xFactor * yFactor * a;
        data2[targetOffset + 2] += data[offset + 2] * xFactor * yFactor * a;
        data2[targetOffset + 3] += data[offset + 3] * xFactor * yFactor;
        alphas[alphaOffset] -= (1 - a) * xFactor * yFactor;
      }
    }
    for (i = l = 0, ref3 = _data2.length >> 2; 0 <= ref3 ? l < ref3 : l > ref3; i = 0 <= ref3 ? ++l : --l) {
      if (alphas[i] && alphas[i] < 1) {
        data2[i << 2] /= alphas[i];
        data2[(i << 2) + 1] /= alphas[i];
        data2[(i << 2) + 2] /= alphas[i];
      }
    }
    for (i = m = 0, ref4 = data2.length; 0 <= ref4 ? m < ref4 : m > ref4; i = 0 <= ref4 ? ++m : --m) {
      _data2[i] = Math.round(data2[i]);
    }
    return self.postMessage({
      extra: extra,
      buffer: dstBuffer
    }, [dstBuffer]);
  };

}).call(this);

//# sourceMappingURL=resize.js.map
