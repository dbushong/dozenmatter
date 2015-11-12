$(window).load ->
  $('.box').each ->
    $box = $(this)
    $img = $box.find('img')
    boxWidth  = $box.width()
    boxHeight = $box.height()
    imgWidth  = $img.width()
    imgHeight = $img.height()

    $img.drag ((e, {offsetX, offsetY}) ->
      offsetX = Math.min 0, offsetX
      offsetY = Math.min 0, offsetY
      offsetX = Math.max offsetX, boxWidth  - $img.width()
      offsetY = Math.max offsetY, boxHeight - $img.height()
      $(this).css(top: offsetY, left: offsetX)
    ), relative: true

    $img.on 'mousewheel', (e) ->
      step = 1.1
      step = 1 / step if e.originalEvent.wheelDelta < 0
      $img.width  $img.width()  * step
