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
templates = [
  [
    { box: 0, left:  pct:    0.4763 }
    { box: 1, top:   aspect: 4/3    }
    { box: 2, right: aspect: 3/5    }
    { box: 3, top:   aspect: 4/3    }
    { box: 4, left:  pct:    0.5    }
  ]
  [] # dummy full-screen template
]

cutBox = (boxes, {box,top,left,bottom,right}) ->
  {x, y, w, h} = boxes[box]
  if pri=(left or right)
    priW = Math.round(if pri.pct? then w * pri.pct else h * pri.aspect)
    if left
      box1 = { x,                       y, w: priW,                 h }
      box2 = { x: x + priW + lineWidth, y, w: w - priW - lineWidth, h }
    else
      box1 = { x: x + w - priW,         y, w: priW,                 h }
      box2 = { x,                       y, w: w - priW - lineWidth, h }
  else
    pri = top or bottom
    priH = Math.round(if pri.pct? then h * pri.pct else w / pri.aspect)
    if top
      box1 = { x, y,                       w, h: priH                 }
      box2 = { x, y: y + priH + lineWidth, w, h: h - priH - lineWidth }
    else
      box1 = { x, y: h - priH,             w, h: priH                 }
      box2 = { x, y,                       w, h: h - priH - lineWidth }

  boxes.splice box, 1
  boxes.push box1, box2

for cuts, i in templates
  boxes = [x: 0, y: 0, w: calWidth, h: calHeight]
  cuts.forEach (cut) -> cutBox boxes, cut
  templates[i] = boxes.map ({x,y,w,h}) ->
    top: y+'px', left: x+'px', width: w+'px', height: h+'px'

console.log templates

generateConvert = ->
  "convert -size #{calWidth}x#{calFullHeight} xc:black " + (
    for k,f of metrics
      "\\( #{f.name} \
      -crop #{f.crop.cropW}x#{f.crop.cropH}+#{f.crop.cropX}+#{f.crop.cropY} \
      -resize #{f.width}x#{f.height} \\) -geometry +#{f.pos.left}+#{f.pos.top} \
      -composite"
  ).join(' ') + ' out.png'

loadTemplate = (i) ->
  metrics = {}
  $cal = $('#calendar').empty()
  $('<div>').css(box).appendTo($cal) for box in templates[i]

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
