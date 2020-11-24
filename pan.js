'use strict';

const { writeFileSync, readFileSync } = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const { ipcRenderer, clipboard } = require('electron');

const templates = require('./templates');

/* eslint-disable no-console */

(() => {
  const lineWidth = 50;
  const bufferSize = 120;
  const calWidth = 4200;
  const calFullHeight = 3250;
  const calHeight = calFullHeight - bufferSize;
  let selectedBox = null;
  let metrics = null;
  let curTemplate = null;
  let saveFile = null;
  let fontFamily = 'Arial';

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


  const AUTO_SAVE = 'autoSave';
  function autoSaveConfig() {
    const json = JSON.stringify({
      metrics,
      curTemplate,
      saveFile,
      fontFamily,
      savedAt: new Date().toISOString(),
    });
    // console.log('autoSaveConfig', json);
    localStorage.setItem(AUTO_SAVE, json);
  }

  let noticeHideTimer;
  function flashNotice(txt) {
    clearTimeout(noticeHideTimer);
    $('#notice').text(txt).toggleClass('shown', true);
    noticeHideTimer = setTimeout(() => $('#notice').toggleClass('shown', false), 2000);
  }

  function saveConfigToFile() {
    autoSaveConfig();
    const json = localStorage.getItem(AUTO_SAVE);
    // console.log('saveConfigToFile', json);
    const settingsJSON = JSON.stringify(JSON.parse(json), null, 2);
    writeFileSync(saveFile, settingsJSON);
    flashNotice(`Config saved to ${saveFile}`);
  }

  function loadTemplate(i) {
    metrics = {};
    curTemplate = i;
    const $cal = $('#calendar').empty();
    templates[i].boxes.forEach((box, j) =>
      $('<div>').css(box).attr('id', `box${j + 1}`).appendTo($cal)
    );

    $('#calendar > div').click(function onClick(e) {
      e.preventDefault();
      if ($('body').hasClass('deleting')) {
        $(this).find('.cropFrame').remove();
        $(this).find('textarea').remove();
        delete metrics[$(this).attr('id')];
        autoSaveConfig();
        $('body').removeClass('deleting');
      } else if ($(this).find('img').length === 0) {
        selectedBox = $(this).attr('id');
        $('#file')[0].click();
      }
    });
  }

  function resetCaptionHeight(e) {
    $(e).height(5);
    $(e).height(e.scrollHeight + 10);
  }

  function loadFileToBox(path) {
    const $box = $(`#${selectedBox}`);
    const width = $box.width();
    const height = $box.height();
    const $img = $('<img>').attr('src', path).appendTo($box);
    const key = $box.attr('id');
    const pos = $box.position();
    $img.cropbox({
      width,
      height,
      zoom: 65e7 / width / height,
      controls: false,
      showControls: 'never',
      result: metrics[key] && metrics[key].crop,
    }).on('cropbox', (ce, crop) => {
      metrics[key] = { ...metrics[key], crop, width, height, pos, name: path };
      autoSaveConfig();
    });
    const $ta = $('<textarea>')
      .css('fontFamily', fontFamily)
      .appendTo($box)
      .on('keyup', function onTAKeyup() {
        resetCaptionHeight(this);
        metrics[key].caption = $(this).val();
        autoSaveConfig();
      });
    if (metrics[key]) {
      $ta.val(metrics[key].caption);
      resetCaptionHeight($ta[0]);
    }
  }

  function loadSettings(settings) {
    ({ curTemplate, fontFamily } = settings);
    loadTemplate(curTemplate);
    ({ metrics, saveFile } = settings);
    for (const [id, { name }] of Object.entries(metrics)) {
      selectedBox = id;
      loadFileToBox(name);
    }
    if (saveFile) ipcRenderer.send('enableSave');
  }

  function autoLoadConfig() {
    const settingsJSON = localStorage.getItem(AUTO_SAVE);
    if (!settingsJSON) return false;
    const settings = JSON.parse(settingsJSON);
    console.log(`Loading settings saved at ${settings.savedAt}`);
    loadSettings(settings);
    return true;
  }

  function loadConfigFromFile(filePath) {
    const settings = JSON.parse(readFileSync(filePath, 'utf8'));
    console.log(`Loading settings from ${filePath}`);
    loadSettings(settings);
  }

  function cutBox(boxes, { box, bottom, top, left, right }) {
    const { x, y, w, h } = boxes[box];
    let pri = left || right;
    let box1;
    let box2;
    /* eslint-disable no-multi-spaces */
    if (pri) {
      const priW = Math.round(pri.pct ? w * pri.pct : h * pri.aspect);
      if (left) {
        box1 = { x, y, w: priW, h };
        box2 = { x: x + priW + lineWidth, y, w: w - priW - lineWidth, h };
      } else {
        box1 = { x: x + w - priW, y, w: priW, h };
        box2 = { x, y, w: w - priW - lineWidth, h };
      }
    } else {
      pri = top || bottom;
      const priH = Math.round(pri.pct ? h * pri.pct : w / pri.aspect);
      if (top) {
        box1 = { x, y, w, h: priH };
        box2 = { x, y: y + priH + lineWidth, w, h: h - priH - lineWidth };
      } else {
        box1 = { x, y: h - priH, w, h: priH };
        box2 = { x, y, w, h: h - priH - lineWidth };
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

  function generateConvert(outFile = 'out.png') {
    const metricsArgs = Object.values(metrics).map(f => {
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
        -font ${fontFamily.replace(/\s+/g, '')}-Bold
        -pointsize 72
        xc:black
        ${metricsArgs}
        ${escapeShellArg(outFile)}
    `.trim();
  }

  async function runConvert(outFile) {
    // TODO: change command generator to return array, and escape on-the-fly
    // instead of using exec() here
    try {
      flashNotice(`Rendering PNG to ${outFile}, please wait...`);
      await exec(generateConvert(outFile));
      flashNotice(`Rendered PNG to ${outFile}`);
    } catch (err) {
      ipcRenderer.send('infoBox',
        {
          title: 'Rendering Error',
          message: `Error running convert command: ${err.message}`,
        });
    }
  }

  $(() => {
    $('#file').change(e => {
      const file = e.target.files[0];
      if (!file) return;
      $('#file').val('');
      loadFileToBox(file.path);
    });

    if (!autoLoadConfig()) loadTemplate(0);
  });

  ipcRenderer.on('remove', () => {
    // TODO: disable the "Remove" menu item when deleting or no open images?
    $('body').toggleClass('deleting', true);
    flashNotice('Select box to remove image from');
  });

  ipcRenderer.on('template', (sender, i) => {
    loadTemplate(i);
    autoSaveConfig();
  });

  ipcRenderer.on('export', () => {
    clipboard.writeText(generateConvert(), 'selection');
    flashNotice('Copied convert command to clipboard');
  });

  ipcRenderer.on('new', () => {
    loadTemplate(0);
    saveFile = null;
    autoSaveConfig();
  });

  ipcRenderer.on('saveAs', (ev, filePath) => {
    saveFile = filePath;
    saveConfigToFile();
  });

  ipcRenderer.on('save', saveConfigToFile);

  ipcRenderer.on('load', (ev, filePath) => {
    loadConfigFromFile(filePath);
  });

  ipcRenderer.on('font', (ev, ff) => {
    fontFamily = ff;
    autoSaveConfig();
    $('textarea').css('fontFamily', fontFamily);
  });

  ipcRenderer.on('render', async (ev, filePath) => {
    await runConvert(filePath);
  });
})();
