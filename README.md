# dozenmatter <img src="/build/icon.png" width=24 height=24 />

This is a utility to simplify matting a bunch of photos (or other images).
It is implemented as a standalone Electron app, which you can download and
run.

## Features

- lets you load, resize, pan, crop a bunch of pictures
- generates an ImageMagick `convert` commandline to do the actual rendering
- optionally runs it for you
- supports saving/loading JSON configuration setups

## Current Limitations

- only a few layout templates available
- always on black
- if you want it to export as a PNG, you must install ImageMagick `convert`
  yourself
- the name is a pun

## Installation

1. Install ImageMagick
1. Install one of the prebuilt DozenMatter binaries under Releases, or follow
  the instructions under "Development"

## Development

```
$ git clone https://github.com/dbushong/dozenmatter
$ cd dozenmatter
$ npm i

# in one terminal:
$ npm run watch-stylus

# in another terminal:
$ cd dozenmatter
$ npm start
```

### Releasing

From `master`:

```
$ ./scripts/release minor
# (or patch or major)
```

Then wait for CI to finish running, then go to
https://github.com/dbushong/dozenmatter/releases , click on the
Draft release, name it `vX.Y.Z`, and Publish it

## Credits

- uses jquery
- uses https://github.com/acornejo/jquery-cropbox with some tweaks & fixes

## TODO

- Build a nice font picker
- Render without ImageMagick
- Some sort of progress bar while rendering
- Get rid of jQuery & use a better cropbox lib

---

## Notes for use/future features

- Look into generating OpenRaster file instead of PNG: https://github.com/zsgalusz/ora.js
