###
  [ 0, 0, 40, 45 ],
  [ 0, 45, 40, 100 ],
  [ 40, 60, 100, 100 ],
  [ 85, 0, 100, 60 ],
  [ 40, 0, 85, 18 ],
  [ 40, 18, 85, 60 ]
###

canvas = document.getElementById('canvas')
canvas.width  = w = 800
canvas.height = h = 600
ctx = canvas.getContext('2d')

boxes = [
  [ 0, 0, 0.4, 0.45 ],
  [ 0, 0.45, 0.4, 0.55 ],
  [ 0.4, 0.6, 0.6, 0.4 ],
  [ 0.85, 0, 0.15, 0.6 ],
  [ 0.4, 0, 0.44999999999999996, 0.18 ],
  [ 0.4, 0.18, 0.44999999999999996, 0.42 ]
]


for [x,y,w,h] in boxes
  ctx.strokeRect(w * x1, h * y1, 
