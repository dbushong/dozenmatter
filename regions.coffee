###
0                                                                             79
+----------------------------+--------0----------------------------+-----------+
|                            |                                     |           |
|                            |                   C                 |           |
|                            |                                     |           |
|             A              +-------------------8-----------------+           |
|                            |                                     |           |
|                            |                                     7     E     |
|                            |                                     |           |
+-------------5--------------+                   D                 |           |
3                            4                                     |           1
|                            |                                     |           |
|                            |                                     |           |
|                            +-------------------------6-----------+-----------+
|             B              |                                                 |
|                            |                                                 |
|                            |                         F                       |
|                            |                                                 |
|                            |                                                 |
+----------------------------+--------2----------------------------------------+
0 - 18 vertical

Rules:

* border lines must terminate in a perpendicular line
* UI will only allow drawing such lines
* regions will be based on divided areas within

UI:
1. click starting existing border
1. click ending existing border (must be parallel
1. click position along shorter side to draw new border at

start:
valid areas: 0,0 - 79,18 (a) 

at addition of 4:
4 is in area (a)
4 splits (a) into 2 areas: 0,0 - 29,18 (b) & 30,0 - 79,18 (c)
valid areas: (b), (c)

at addition of 5:
5 is in area (b)
5 splits (b) into 2 areas: 0,0 - 29,8 (A) & 0,8 - 29,18 (B)
valid areas: (A), (B), (c)

at addition of 6:
6 is in area (c)
6 splits (c) into 2 areas: 29,0 - 79,12 (d) & 29,13 - 79,18 (F)
valid areas: (A), (B), (F), (d)

at addition of 7:
7 is in area (d)
7 splits (d) into 2 areas: 29,0 - 67,12 (e) & 68,0 - 79,12 (E)
valid areas: (A), (B), (E), (F), (e)

at addition of 8:
8 is in area (e)
8 splits (e) into 2 areas: 29,0 - 67,4 (C) & 29,5 - 67,12 (D)
valid areas: (A), (B), (C), (D), (E), (F)

borders = [
  {}, {}, {}, {} # built-in sides: 0-3
  { ends: [ 0, 2 ], pos: 29 }    # 4
  { ends: [ 3, 4 ], pos: 8 }     # 5
  { ends: [ 1, 4 ], pos: 12 }    # 6
  { ends: [ 0, 6 ], pos: 67 }    # 7
  { ends: [ 4, 7 ], pos: 4 }     # 8
]

proposal 2:
+----------------------------+-------------------------------------+-----------+
|                            |                                     |           |
|                            |                   C                 |           |
|                            |                                     |           |
|             A              +-------------------4-----------------+           |
|                            |                                     |           |
|                            |                                     3     E     |
|                            |                                     |           |
+-------------1--------------+                   D                 |           |
|                            0                                     |           |
|                            |                                     |           |
|                            |                                     |           |
|                            +-------------------------2-----------+-----------+
|             B              |                                                 |
|                            |                                                 |
|                            |                         F                       |
|                            |                                                 |
|                            |                                                 |
+----------------------------+-------------------------------------------------+

UI:
1. specify region
1. specify line orientation (horizontal vs. vertical)
1. specify % of left/top

cuts = [
  { region: 0, left: 0.4 }  # [0] -> [1,2]
  { region: 1, top: 0.45 }  #     -> [  2,3,4]
  { region: 2, top: 0.6  }  #     -> [    3,4,5,6]
  { region: 5, left: 0.75 } #     -> [    3,4,  6,7,8]
  { region: 7, top: 0.3 }   #     -> [    3,4,  6,  8,9,10]
]

###

regions = [[0,0,1,1]]

cut = (regionId, orient, pct) ->
  # pull old region
  region = regions[regionId]
  throw new Error("invalid region: #{regionId}") unless region
  [x,y,w,h] = region

  # delete region; we'll be replacing
  delete regions[regionId]
  newRegions = [[x,y,w,h], [x,y,w,h]]
  switch orient
    when 'h'
      newRegions[1][1] += newRegions[0][3] = h*pct
      newRegions[1][3] *= (1-pct)
    when 'v'
      newRegions[1][0] += newRegions[0][2] = w*pct
      newRegions[1][2] *= (1-pct)
    else
      throw new Error("invalid orient #{orient}")
  regions.push newRegions...
  console.log regions

console.log regions
cut 0, 'v', 0.4
cut 1, 'h', 0.45
cut 2, 'h', 0.6
cut 5, 'v', 0.75
cut 7, 'h', 0.3
