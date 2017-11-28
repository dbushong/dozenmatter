# dozenmatter
This is a utility to simplify matting a bunch of photos (or other images).

Current limitations:

* only a few layout templates available
* doesn't actually save the final result (huge canvases are iffy)
* no saving
* always on black
* needs a recent browser with ES2015+ support (recent Chrome or Firefox should be fine)

Features:

* lets you load, resize, pan, crop a bunch of pictures
* generates (but does not run) an ImageMagick `convert` commandline to do the actual rendering

Usage:

* `$ git clone`
* navigate to `file:///path/to/dozenmatter/index.html`
* profit

Develop:

* `$ npm install`
* `$ npm run watch-stylus`

Credits:

* uses jquery
* uses https://github.com/acornejo/jquery-cropbox with some tweaks & fixes


---

#### Notes for use/future features

* Templates are in `pan.js`
* Gimp Text Settings:
  * Myriad Pro Bold
  * 72 pt
  * White
  * Centered
  * Draw a text box before typing
* Gimp Drop Shadow Settings:
  * 30px @ 100%
  * 60px @  90%
  * 90px @  80%
* CSS Drop Shadow: https://codepen.io/dbushong/pen/vWVKPx
* Look into generating OpenRaster file instead of PNG: https://github.com/zsgalusz/ora.js
