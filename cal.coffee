# calendar page: 3648x2736
# src jpeg:      4608x3456

cores         = navigator.hardwareConcurrency or 2
calWidth      = 3648
calFullHeight = 2736
photoWidth    = 4608
photoHeight   = 3456
photoWidth2   = 4160
photoHeight2  = 3120
lineWidth     = 30
bufferSize    = 60
calHeight     = calFullHeight - bufferSize
smoothResize  = true

canvas = null
ctx    = null
imgs   = []
paths  = ['05/DSC05391.JPG', '05/DSC05397.JPG', '05/DSC05402.JPG'
          '05/DSC05439.JPG', '05/IMG_20150501_072117555.jpg']

workers = [1..cores].map ->
  w = new Worker 'resize.js'
  w.onmessage = (msg) ->
    {extra:{x,y,w,h}, buffer, progress} = msg.data
    if progress?
      console.log {progress}
      #prog = (pct) -> ctx.fillRect(dx, dy, dw, dh*pct)
    else
      console.log 'received scaled data for', {x,y,w,h}
      img = new ImageData(new Uint8ClampedArray(buffer), w, h)
      ctx.putImageData img, x, y
  w

async =
  parallel: (fns, cb) ->
    done = 0
    len  = fns.length
    for fn in fns
      fn -> cb() if ++done is len

scaleImage = (ctx, img, args...) ->
  [sx, sy, sw, sh] = if args.length > 4
    args.splice 0, 4
  else
    [0, 0, img.width, img.height]
  [dx, dy, dw, dh] = args
  return ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) unless smoothResize

  console.log "resizing #{img.src}"
  start = Date.now()

  src = document.createElement 'canvas'
  src.width  = sw
  src.height = sh
  # crop & create canvas out of img
  srcCtx = src.getContext('2d')
  srcCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  srcBuffer = srcCtx.getImageData(0, 0, sw, sh).data.buffer
  dstBuffer = (new ImageData(dw, dh)).data.buffer
                      
  workers[nextWorker].postMessage {
    w1:          sw
    h1:          sh
    w2:          dw
    h2:          dh
    dataBuffer:  srcBuffer
    data2Buffer: dstBuffer
    extra:       { x: dx, y: dy, w: dw, h: dh }
  }, [srcBuffer, dstBuffer]
  nextWorker = (nextWorker+1) % cores

imagesLoaded = ->
  console.log 'images loaded'

  ctx.fillRect(rx=0, ry=calHeight, rw=calWidth, rh=bufferSize)

  scaleImage(ctx, imgs[0],
    sx=1766, sy=380,
    sw=1094, sh=3041,
    dx=0,    dy=0,
    dw=Math.round(calHeight/sh*sw), dh=calHeight
  )

  ctx.fillRect(rx=dw, ry=0, rw=lineWidth, rh=calHeight)

  scaleImage(ctx, imgs[1],
    dx=rx+rw,       dy=0,
    dw=calWidth-dx, dh=Math.round(dw/photoWidth*photoHeight)
  )

  ctx.fillRect(rx=dx, ry=dh, rw=dw, rh=lineWidth)

  scaleImage(ctx, imgs[2],
    sx=908,  sy=1046,
    sw=2794, sh=1595,
    dx=rx,   dy=ry+rh,
    dw=Math.round((dh=calHeight-dy)/sh*sw), dh=dh
  )

  ctx.fillRect(rx=dx+dw, ry=dy, rw=lineWidth, rh=dh)

  scaleImage(ctx, imgs[3],
    dx=rx+rw, dy=ry,
    dw=Math.round((dh=calHeight-dy)/photoHeight*photoWidth), dh=dh
  )

  ctx.fillRect(rx=dx+dw, ry=dy, rw=lineWidth, rh=dh)

  scaleImage(ctx, imgs[4],
    sx=392,         sy=543,
    sw=2284,        sh=2601,
    dx=rx+rw,       dy=ry,
    dw=calWidth-dx, dh=calHeight-dy
  )


window.onload = ->
  canvas = document.getElementById 'canvas'
  canvas.width  = calWidth
  canvas.height = calFullHeight
  ctx = canvas.getContext '2d'
  ctx.fillStyle = 'black'

  # load images in parallel
  fns = paths.map (path) -> (cb) ->
    img = new Image
    img.addEventListener 'load', cb
    img.src = "2016/#{path}"
    imgs.push img
  async.parallel fns, imagesLoaded
