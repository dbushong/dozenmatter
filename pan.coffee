lineWidth     = 50
bufferSize    = 75
calWidth      = 4200
calFullHeight = 3300
calHeight     = calFullHeight - bufferSize
selectedBox   = null
metrics       = null

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
templates = []

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

templates.push boxes

templates.push [top: 0, left: 0, width: calWidth, height: calHeight]

generateConvert = ->
  "convert -size #{calWidth}x#{calFullHeight} xc:black " + (
    for k,f of metrics
      "\\( #{f.name} \
      -crop #{f.crop.cropW}x#{f.crop.cropH}+#{f.crop.cropX}+#{f.crop.cropY} \
      -resize #{f.width}x#{f.height} \\) -geometry +#{f.pos.left}+#{f.pos.top} \
      -composite"
  ).join(' ') + ' out.png'

addPx = (obj) ->
  pxObj = {}
  for k, v of obj
    pxObj[k] = v
    pxObj[k] += 'px' if v and 'number' is typeof v
  pxObj

loadTemplate = (i) ->
  metrics = {}
  $cal = $('#calendar').empty()
  for box in templates[i]
    $('<div>').css(addPx box).appendTo($cal)

  $('#calendar > div').click (e) ->
    e.preventDefault()
    if $('body').hasClass 'deleting'
      $(this).find('.cropFrame').remove()
      pos = $(this).position()
      delete metrics[[pos.left,pos.top]]
      $('body').removeClass 'deleting'
    else if $(this).find('img').length is 0
      selectedBox = this
      $('#file')[0].click()

$ ->
  $('#file').change ->
    file = @files[0]
    return unless file
    reader = new FileReader
    reader.onloadend = ->
      $box   = $(selectedBox)
      width  = $box.width()
      height = $box.height()
      $img   = $('<img>').attr('src', reader.result).appendTo($box)
      pos    = $box.position()
      key    = [pos.left,pos.top].join()
      $img.cropbox(
        width:        width
        height:       height
        zoom:         10
        controls:     false
        showControls: 'never'
      ).on 'cropbox', (e, crop) ->
        metrics[key] = { crop, width, height, pos, name: file.name }
        
    reader.readAsDataURL file

  $('#delete').click -> $('body').toggleClass 'deleting'

  $('#export').click ->
    prompt 'Paste this to your shell', generateConvert()

  for template, i in templates
    $('<option>').val(i).text("Template #{i+1}").appendTo('#template')
  $('#template').show().change(-> loadTemplate @selectedIndex).change()
