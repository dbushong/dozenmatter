var numImgs = 0;

var canvas = document.getElementById("canvas");
canvas.width = document.body.clientWidth;
canvas.height = 240;
var ctx = canvas.getContext("2d");

function loadImage() {
  var input, file, fr, img;

  if (typeof window.FileReader !== 'function') {
    write("The file API isn't supported on this browser yet.");
    return;
  }

  input = document.getElementById('imgfile');
  if (!input) {
    write("Um, couldn't find the imgfile element.");
  }
  else if (!input.files) {
    write("This browser doesn't seem to support the `files` property of file inputs.");
  }
  else if (!input.files[0]) {
    write("Please select a file before clicking 'Load'");
  }
  else {
    file = input.files[0];
    fr = new FileReader();
    fr.onload = createImage;
    fr.readAsDataURL(file);
  }

  function createImage() {
    img = new Image();
    img.onload = imageLoaded;
    img.src = fr.result;
  }

  function imageLoaded() {
    console.log('imageLoaded', numImgs);
    var x = numImgs++ * 330;
    var s = 1;
    ctx.drawImage(img, x,0, 320, 240);
    setInterval(function () {
        // 4160x3120
        s *= 1.05;
        ctx.drawImage(img, 0, 0, Math.round(4160/s), Math.round(3120/s), x, 0, 320, 240);
    }, 500);
  }

  function write(msg) {
    var p = document.createElement('p');
    p.innerHTML = msg;
    document.body.appendChild(p);
  }
}

var saveButton = document.getElementById('save');
saveButton.addEventListener('click', function () {
  saveButton.href = canvas.toDataURL('image/png');
});
