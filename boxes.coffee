#
# states:
# PICK_BOX -> PICK_ACTION -> SPLIT
#                         -> PICK_IMG
# RESIZE
#
#
#

cw = 800
ch = 600
picsCtx = sepsCtx = uiCtx = $ui = null

lineWidth = 10
half = lineWidth / 2

VERT  = 'v'
HORIZ = 'h'

RESIZE   = 'resize'
PICK_BOX = 'pick_box'

splitBox = (box, dir, pct=0.5) ->
  box.leftPct = pct
  box.split   = dir
  box.left    = leaf: box.leaf
  box.right   = leaf: {}
  delete box.leaf
  box.left

drawLines = (tree, x=0, y=0, w=cw, h=ch) ->
  if tree.leaf
    tree.x1 = x
    tree.y1 = y
    tree.x2 = x + w - 1
    tree.y2 = y + h - 1
    boxes.push tree
    return
  if tree.split is VERT
    leftW = w * tree.leftPct
    x1 = x2 = x + leftW
    y1 = y
    y2 = y + h - 1
    separators.push { tree, x1: x1-half, y1, x2: x2+half, y2 }
    drawLines tree.left,  x,       y, leftW,   h
    drawLines tree.right, x+leftW, y, w-leftW, h
  else
    topH = h * tree.leftPct
    x1 = x
    x2 = x + w - 1
    y1 = y2 = y + topH
    separators.push { tree, x1, y1: y1-half, x2, y2: y2+half }
    drawLines tree.left,  x,  y,      w, topH
    drawLines tree.right, x,  y+topH, w, h-topH
  sepsCtx.beginPath()
  sepsCtx.moveTo(x1, y1)
  sepsCtx.lineTo(x2, y2)
  sepsCtx.stroke()


# initialize tree
tree = leaf: {}

splitBox tree,                 VERT,  0.4
splitBox tree.left,            HORIZ, 0.4
splitBox tree.right,           HORIZ, 0.7
splitBox tree.right.left,      VERT,  0.75
splitBox tree.right.left.left, HORIZ, 0.3
separators = []
boxes = []
mode = PICK_BOX

uiReset = ->
  uiCtx.clearRect(0, 0, cw, ch)
  uiCtx.lineWidth = 1
  uiCtx.strokeRect 0, 0, cw, ch
  $ui.css('cursor', 'pointer')

$ ->
  $ui = $('#canvas-ui')
  picsCtx = $('#canvas-pics').attr(width: cw, height: ch)[0].getContext('2d')
  sepsCtx = $('#canvas-seps').attr(width: cw, height: ch)[0].getContext('2d')
  uiCtx   = $ui              .attr(width: cw, height: ch)[0].getContext('2d')

  sepsCtx.clearRect(0, 0, cw, ch)
  sepsCtx.lineWidth = 10
  uiCtx.fillStyle = '#f0f0f0'

  $('#layers').css(width: cw, height: ch)

  drawLines(tree)
  uiReset()

  $('[name=mode]').change ->
    mode = $('[name=mode]:checked').val()
    uiReset()

  { left: offLeft, top: offTop } = $ui.offset()
  $ui.mousemove ({pageX, pageY}) ->
    x = pageX - offLeft
    y = pageY - offTop

    switch mode
      when PICK_BOX
        uiReset()
        for b in boxes
          if b.x1 <= x <= b.x2 and b.y1 <= y <= b.y2
            uiCtx.fillRect(b.x1+half, b.y1+half, b.x2-b.x1-lineWidth, b.y2-b.y1-lineWidth)
            return
      when RESIZE
        for s in separators
          if s.x1 <= x <= s.x2 and s.y1 <= y <= s.y2
            $ui.css('cursor',
              if s.tree.split is VERT then 'e-resize' else 's-resize')
            return
        $ui.css('cursor', 'default')
