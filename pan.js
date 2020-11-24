'use strict';

(() => {
  const lineWidth = 50;
  const bufferSize = 120;
  const calWidth = 4200;
  const calFullHeight = 3250;
  const calHeight = calFullHeight - bufferSize;
  let selectedBox = null;
  let metrics = null;


  /* Template 1,2,3,7
  +---------+----------+
  |         |          |
  |         |    1     |
  |         +-----+----+
  |    0    |  3  |    |
  |         +--+--+    |
  |         |  |5 | 2  |
  |         | 4|6 |    |
  +---------+--+--+----+
   *   Template 4,5,6
  +----------+---------+
  |          |         |
  |    1     |         |
  +----+-----+         |
  |    |  3  |    0    |
  |    +--+--+         |
  | 2  |  |5 |         |
  |    | 4|6 |         |
  +----+--+--+---------+
   */

  /* eslint-disable key-spacing,no-multi-spaces,indent */
  const templates = [
    { cuts:
      [
        { box: 0, left:  { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, right: { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
        { box: 4, left:  { pct: 0.48   } },
      ],
      name: 'Left, 6 Boxes',
    },
    { cuts:
      [
        { box: 0, left:  { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, right: { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
        { box: 4, left:  { pct: 0.48   } },
        { box: 5, top:   { pct: 0.47   } },
      ],
      name: 'Left, 7 Boxes',
    },
    { cuts:
      [
        { box: 0, left:  { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, right: { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
      ],
      name: 'Left, 5 Boxes',
    },
    { cuts:
      [
        { box: 0, right: { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, left:  { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
        { box: 4, right: { pct: 0.48   } },
      ],
      name: 'Right, 6 Boxes',
    },
    { cuts:
      [
        { box: 0, right: { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, left:  { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
        { box: 4, right: { pct: 0.48   } },
        { box: 5, top:   { pct: 0.47   } },
      ],
      name: 'Right, 7 Boxes',
    },
    { cuts:
      [
        { box: 0, right: { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, left:  { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
      ],
      name: 'Right, 5 Boxes',
    },
    {
      cuts: [
        { box: 0, left:  { pct: 0.4818 } },
        { box: 1, top:   { pct: 0.4891 } },
        { box: 2, right: { pct: 0.4432 } },
        { box: 3, top:   { pct: 0.48   } },
      ],
      name: 'Cover (Left)',
      buffer: 'top',
    },
  ];
  /* eslint-enable */

  function cutBox(boxes, { box, bottom, top, left, right }) {
    const { x, y, w, h } = boxes[box];
    let pri = left || right;
    let box1;
    let box2;
    /* eslint-disable no-multi-spaces */
    if (pri) {
      const priW = Math.round(pri.pct ? w * pri.pct : h * pri.aspect);
      if (left) {
        box1 = { x,                       y, w: priW,                 h };
        box2 = { x: x + priW + lineWidth, y, w: w - priW - lineWidth, h };
      } else {
        box1 = { x: x + w - priW,         y, w: priW,                 h };
        box2 = { x,                       y, w: w - priW - lineWidth, h };
      }
    } else {
      pri = top || bottom;
      const priH = Math.round(pri.pct ? h * pri.pct : w / pri.aspect);
      if (top) {
        box1 = { x, y,                       w, h: priH };
        box2 = { x, y: y + priH + lineWidth, w, h: h - priH - lineWidth };
      } else {
        box1 = { x, y: h - priH,             w, h: priH };
        box2 = { x, y,                       w, h: h - priH - lineWidth };
      }
    }
    /* eslint-enable */
    boxes.splice(box, 1);
    boxes.push(box1, box2);
  }

  // convert templates from {
  //   name: string,
  //   cuts: { box: number, (top | left | right)?: { pct: number } }[],
  //   buffer?: 'top'
  // } to {
  //   name: string,
  //   boxes: { top: string, left: string, width: string, height: string }[],
  // }
  templates.forEach(({ name, cuts, buffer }, i) => {
    const y = buffer === 'top' ? bufferSize : 0;
    const boxes = [{ x: 0, y, w: calWidth, h: calHeight }];
    cuts.forEach(cut => cutBox(boxes, cut));
    templates[i] = {
      name,
      boxes: boxes.map(({ x, y: top, w, h }) => (
        { top: `${top}px`, left: `${x}px`, width: `${w}px`, height: `${h}px` }
      )),
    };
  });

  function escapeShellArg(arg) {
    const esc1 = `'${arg.replace(/'/g, "'\\''")}'`;
    const esc2 = `"${arg.replace(/([!$"\\])/g, '\\$1')}"`;
    const esc3 = arg.replace(/([^\w=+:,.\/-])/g, '\\$1');
    return [esc1, esc2, esc3].sort((a, b) => a.length - b.length)[0];
  }

  function oneLine(strs, ...vals) {
    vals.push('');
    return strs.map(s => `${s.replace(/\n[\n\s]*/g, ' ')}${vals.shift()}`)
             .join('');
  }

  function generateConvert() {
    const metricsArgs = Object.keys(metrics).map(k => {
      const f = metrics[k];
      let caption = '';
      if (f.caption) {
        const txt = f.caption.trim().replace(/\n/g, '\\n');
        caption = oneLine`
          \\(
            -background none
            -size ${Math.round(f.width * 0.85)}x225
            xc:none
            -stroke none
            -fill white
            -gravity south
            -annotate 0 ${escapeShellArg(txt)}
            -fill black
            \\(
              +clone
              -shadow 100x6+0+0
            \\)
            +swap
            \\(
              +clone
              -shadow 90x12+0+0
            \\)
            +swap
            \\(
              +clone
              -shadow 80x20+0+0
            \\)
            +swap
            -layers merge
            +repage
          \\)
          -gravity south
          -geometry +0+0
          -composite
        `;
      }
      return oneLine`\\(
         ${escapeShellArg(f.name)}
         -normalize
         -crop ${f.crop.cropW}x${f.crop.cropH}+${f.crop.cropX}+${f.crop.cropY}
         -resize ${f.width}x${f.height} ${caption}
       \\)
       -gravity northwest
       -geometry +${f.pos.left}+${f.pos.top}
       -composite
      `;
    }).join(' ');
    return oneLine`
      convert
        -size ${calWidth}x${calFullHeight}
        -font ../../fonts/MyriadPro-Bold.otf
        -pointsize 72
        xc:black
        ${metricsArgs}
        out.png
    `.trim();
  }

  function loadTemplate(i) {
    metrics = {};
    const $cal = $('#calendar').empty();
    templates[i].boxes.forEach(box => $('<div>').css(box).appendTo($cal));

    $('#calendar > div').click(function onClick(e) {
      e.preventDefault();
      if ($('body').hasClass('deleting')) {
        $(this).find('.cropFrame').remove();
        $(this).find('textarea').remove();
        const pos = $(this).position();
        delete metrics[[pos.left, pos.top]];
        $('body').removeClass('deleting');
      } else if ($(this).find('img').length === 0) {
        selectedBox = this;
        $('#file')[0].click();
      }
    });
  }

  $(() => {
    let taIdCnt = 1;
    $('#file').change(function onChange() {
      const file = this.files[0];
      if (!file) return;
      $('#file').val('');
      const reader = new FileReader;
      reader.onloadend = () => {
        const $box = $(selectedBox);
        const width = $box.width();
        const height = $box.height();
        const $img = $('<img>').attr('src', reader.result).appendTo($box);
        const pos = $box.position();
        const key = [pos.left, pos.top].join();
        $img.cropbox({
          width,
          height,
          zoom: 65e7 / width / height,
          controls: false,
          showControls: 'never',
        }).on('cropbox', (e, crop) => (
          metrics[key] = { crop, width, height, pos, name: file.name }
        ));
        $('<textarea>')
        .attr('id', 'ta'+taIdCnt++)
        .appendTo($box)
        .on('change', function onTAChange() {
          metrics[key].caption = $(this).val();
        })
        .on('keyup', function onTAKeyup() {
          $(this).height(5);
          $(this).height(document.getElementById($(this).attr('id')).scrollHeight+10);
        });
      };
      reader.readAsDataURL(file);
    });
    $('#delete').click(() => { $('body').toggleClass('deleting'); });
    $('#export').click(() => {
      const result = generateConvert();
      // eslint-disable-next-line no-alert
      prompt('Paste this to your shell', result);
      console.log(result); // eslint-disable-line no-console
    });
    templates.forEach(({ name }, i) => {
      $('<option>').val(i).text(name).appendTo('#template');
    });
    $('#template').show()
      .change(function onChange() { loadTemplate(this.selectedIndex); })
      .change();
  });
})();
