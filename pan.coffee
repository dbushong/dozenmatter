lineWidth     = 50
bufferSize    = 75
calWidth      = 4200
calFullHeight = 3300
calHeight     = calFullHeight - bufferSize

###
+---------+----------+
|         |          |
|         |    1     |
|         +-----+----+
|    0    |  3  |    |
|         +--+--+    |
|         |  |  | 2  |
|         | 4|5 |    |
+---------+--+--+----+
###
boxes = []
boxes[0] = top: 0, left: 0, width: 2000, height: calHeight

boxes[1] = top: 0, left: boxes[0].width + lineWidth
boxes[1].width  = calWidth - boxes[1].left
boxes[1].height = Math.round(boxes[1].width * 0.75)

boxes[2] = top: boxes[1].height + lineWidth, width: 945
boxes[2].height = calHeight - boxes[2].top
boxes[2].left   = calWidth  - boxes[2].width

boxes[3] =
  top: boxes[2].top
  left: boxes[1].left
  width: calWidth - boxes[0].width - boxes[2].width - 2 * lineWidth
  height: 756

boxes[4] =
  top: boxes[1].height + boxes[3].height + 2 * lineWidth
  left: boxes[3].left
  width: 560
boxes[4].height = calHeight - boxes[4].top

boxes[5] =
  top: boxes[4].top
  left: boxes[4].left + boxes[4].width + lineWidth
  width: calWidth-boxes[0].width - boxes[4].width - boxes[2].width - 3*lineWidth
  height: boxes[4].height

metrics = {}

generateConvert = ->
  "convert -size #{calWidth}x#{calFullHeight} xc:black \\\n" + (
    for k,f of metrics
      "  \\( #{f.name} \
      -crop #{f.crop.cropW}x#{f.crop.cropH}+#{f.crop.cropX}+#{f.crop.cropY} \
      -resize #{f.width}x#{f.height} \\) -geometry +#{f.pos.left}+#{f.pos.top} \
      -composite \\\n"
  ).join('') + '  out.png'

$ ->
  for box in boxes
    box[k] = "#{v}px" for k,v of box
    $('<div>').css(box).appendTo('#calendar')

  $('#file').change ->
    file = this.files[0]
    return unless file
    reader = new FileReader
    reader.onloadend = ->
      $box   = $(selectedBox)
      width  = $box.width()
      console.log(width)
      height = $box.height()
      $img   = $('<img>').attr('src', reader.result).appendTo($box)
      pos    = $box.position()
      key    = [pos.top,pos.left].join()
      $box.css('cursor', 'default').off('click')
      $img.cropbox(
        width:        width
        height:       height
        zoom:         10
        controls:     false
        showControls: 'never'
      ).on 'cropbox', (e, crop) ->
        metrics[key] = { crop, width, height, pos, name: file.name }
        console.log generateConvert()
        
    reader.readAsDataURL file

  selectedBox = null
  $('#calendar > div').click (e) ->
    selectedBox = this
    e.preventDefault()
    $('#file')[0].click()
