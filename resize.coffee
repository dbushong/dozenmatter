### 
# MIT License
#  You may use this code as long as you retain this notice.  Use at your own risk! :)
#  https://github.com/danschumann/limby-resize
#  0.0.8
###

return if window?

self.onmessage = ({data: {sw, sh, dw, dh, srcBuffer, dstBuffer, extra}}) ->
  data   = new Uint8ClampedArray srcBuffer
  _data2 = new Uint8ClampedArray dstBuffer

  # Instead, we enforce float type for every entity in the array
  # this prevents weird faded lines when things get rounded off
  data2 = Array(_data2.length)
  data2.fill 0.0
  # We track alphas, since we need to use alphas to correct colors later on
  alphas = Array(_data2.length >> 2)
  alphas.fill 1
  # this will always be between 0 and 1
  xScale = dw / sw
  yScale = dh / sh

  for y1 in [0...sh]
    self.postMessage { extra, progress: y1/sh } unless y1 % 100
    for x1 in [0...sw]
      extraX = false
      extraY = false
      targetX = Math.floor(x1 * xScale)
      targetY = Math.floor(y1 * yScale)
      xFactor = xScale
      yFactor = yScale
      bottomFactor = 0
      rightFactor = 0
      offset = (y1 * sw + x1) * 4
      targetOffset = (targetY * dw + targetX) * 4
      # Right side goes into another pixel 
      if targetX < Math.floor((x1 + 1) * xScale)
        rightFactor = (x1 + 1) * xScale % 1
        xFactor -= rightFactor
        extraX = true
      # Bottom side goes into another pixel
      if targetY < Math.floor((y1 + 1) * yScale)
        bottomFactor = (y1 + 1) * yScale % 1
        yFactor -= bottomFactor
        extraY = true
      a = data[offset + 3] / 255
      alphaOffset = targetOffset / 4
      if extraX
        # Since we're not adding the color of invisible pixels, we multiply by a
        data2[targetOffset + 4] += data[offset]     * rightFactor * yFactor * a
        data2[targetOffset + 5] += data[offset + 1] * rightFactor * yFactor * a
        data2[targetOffset + 6] += data[offset + 2] * rightFactor * yFactor * a
        data2[targetOffset + 7] += data[offset + 3] * rightFactor * yFactor
        # if we left out the color of invisible pixels(fully or partly)
        # the entire average we end up with will no longer be out of 255
        # so we subtract the percentage from the alpha ( originally 1 )
        # so that we can reverse this effect by dividing by the amount.
        # ( if one pixel is black and invisible, and the other is white and
        # visible, the white pixel will weight itself at 50% because it does
        # not know the other pixel is invisible, so the total(color) for the
        # new pixel would be 128(gray), but it should be all white.  the alpha
        # will be the correct 128, combinging alphas, but we need to preserve
        # the color of the visible pixels)
        alphas[alphaOffset + 1] -= (1 - a) * rightFactor * yFactor
      if extraY
        data2[targetOffset + dw * 4]     +=
          data[offset]     * xFactor * bottomFactor * a
        data2[targetOffset + dw * 4 + 1] +=
          data[offset + 1] * xFactor * bottomFactor * a
        data2[targetOffset + dw * 4 + 2] +=
          data[offset + 2] * xFactor * bottomFactor * a
        data2[targetOffset + dw * 4 + 3] +=
          data[offset + 3] * xFactor * bottomFactor
        alphas[alphaOffset + dw]         -=
          (1 - a)          * xFactor * bottomFactor
      if extraX and extraY
        data2[targetOffset + dw * 4 + 4] +=
          data[offset] * rightFactor * bottomFactor * a
        data2[targetOffset + dw * 4 + 5] +=
          data[offset + 1] * rightFactor * bottomFactor * a
        data2[targetOffset + dw * 4 + 6] +=
          data[offset + 2] * rightFactor * bottomFactor * a
        data2[targetOffset + dw * 4 + 7] +=
          data[offset + 3] * rightFactor * bottomFactor
        alphas[alphaOffset + dw + 1] -= (1 - a) * rightFactor * bottomFactor
      data2[targetOffset]     += data[offset]     * xFactor * yFactor * a
      data2[targetOffset + 1] += data[offset + 1] * xFactor * yFactor * a
      data2[targetOffset + 2] += data[offset + 2] * xFactor * yFactor * a
      data2[targetOffset + 3] += data[offset + 3] * xFactor * yFactor
      alphas[alphaOffset]     -= (1 - a)          * xFactor * yFactor

  # fully distribute the color of pixels that are partially full because their
  # neighbor is transparent (i.e. undo the invisible pixels are averaged with
  # visible ones)
  for i in [0...(_data2.length >> 2)]
    if alphas[i] and alphas[i] < 1
      data2[i << 2] /= alphas[i]
      # r
      data2[(i << 2) + 1] /= alphas[i]
      # g
      data2[(i << 2) + 2] /= alphas[i]
      # b

  # re populate the actual imgData
  _data2[i] = Math.round(data2[i]) for i in [0...data2.length]

  self.postMessage { extra, buffer: dstBuffer }, [dstBuffer]
