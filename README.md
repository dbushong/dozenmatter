This is a utility to simplify matting a bunch of photos (or other images).

Current limitations:

* only one (or a few) layout templates available
* doesn't actually save the final result (huge canvases are iffy)
* no saving
* always on black

Features:

* lets you load, resize, pan, crop a bunch of pictures
* generates (but does not run) an ImageMagick `convert` commandline to do the actual rendering

Usage:

* git clone
* navigate to `file:///path/to/dozenmatter/index.html`
* profit

Develop:

* npm install
* ./node_modules/.bin/coffee -cw pan.coffee
* ./node_modules/.bin/stylus -w pan.stylus

Credits:

* uses jquery
* uses https://github.com/acornejo/jquery-cropbox with some tweaks & fixes
