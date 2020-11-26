'use strict';

/* eslint-env browser,jquery */
(() => {
  const {
    resolve: pathResolve,
    dirname,
    relative: pathRelative,
  } = require('path');
  const { writeFileSync, readFileSync, statSync } = require('fs');
  const { promisify } = require('util');
  const exec = promisify(require('child_process').exec);

  // eslint-disable-next-line import/no-extraneous-dependencies
  const { ipcRenderer, clipboard } = require('electron');

  const templates = require('./templates');

  // eslint-disable-next-line no-console
  const log = console.log.bind(console);

  // given a relative path (e.g. imgs/x.jpg or ../y.jpg) and an absolute path
  // to a config file (e.g. /Users/bob/d/c.json), return an absolutized version
  // of the former, e.g. /Users/bob/d/imgs/x.jpg or /Users/bob/y.jpg respectively
  function absolutePath(relPath, cfgPath) {
    return cfgPath ? pathResolve(dirname(cfgPath), relPath) : relPath;
  }

  // given an absolute path to an image and an absolute path to a config file
  // (e.g. /Users/bob/d/c.json), return a relativized version of the former
  // iff it's on the same device as the config path
  // e.g. /Users/bob/d/imgs/x.jpg, /Users/bob/d/cfg.json -> imgs/x.jpg
  // but  /Volumes/ext/x.jpg, /Users/bob/d/cfg.json -> /Volumes/ext/x.jpg
  function relativePath(absPath, cfgPath) {
    if (!cfgPath) return absPath;
    const cfgDir = dirname(cfgPath);
    const cfgDev = statSync(cfgDir).dev;
    const imgDev = statSync(absPath).dev;
    return cfgDev === imgDev ? pathRelative(cfgDir, absPath) : absPath;
  }

  const lineWidth = 50;
  const bufferSize = 120;
  const matteWidth = 4200;
  const matteFullHeight = 3250;
  const matteHeight = matteFullHeight - bufferSize;
  const settingsVersion = 1;
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

  function fixupRelativeMetricPaths(oldSaveFile, newSaveFile) {
    for (const m of Object.values(metrics)) {
      m.path = relativePath(absolutePath(m.path, oldSaveFile), newSaveFile);
    }
  }

  function migrateSettings(settings) {
    while (settings.version < settingsVersion) {
      // each case N is the migration to do from N -> N+1
      switch (settings.version) {
        case null:
          settings.version = 0;
          break;
        default:
          // no migration for this version
          break;
      }
      settings.version++;
    }
  }

  const AUTO_SAVE = 'autoSave';
  function autoSaveConfig() {
    const json = JSON.stringify({
      metrics,
      curTemplate,
      saveFile,
      fontFamily,
      version: settingsVersion,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(AUTO_SAVE, json);
  }

  let noticeHideTimer;
  function flashNotice(txt) {
    clearTimeout(noticeHideTimer);
    $('#notice').text(txt).toggleClass('shown', true);
    noticeHideTimer = setTimeout(
      () => $('#notice').toggleClass('shown', false),
      2000
    );
  }

  function saveConfigToFile() {
    autoSaveConfig();
    const settings = JSON.parse(localStorage.getItem(AUTO_SAVE));
    delete settings.saveFile;
    const settingsJSON = JSON.stringify(settings, null, 2);
    writeFileSync(saveFile, settingsJSON);
    flashNotice(`Config saved to ${saveFile}`);
  }

  function loadTemplate(i) {
    metrics = {};
    curTemplate = i;
    const $matte = $('#matte').empty();
    templates[i].boxes.forEach((box, j) =>
      $('<div>')
        .css(box)
        .attr('id', `box${j + 1}`)
        .appendTo($matte)
    );

    $('#matte > div').click(function onClick(e) {
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
    $(e).height(e.scrollHeight + 20);
  }

  function loadFileToBox(path) {
    const $box = $(`#${selectedBox}`);
    const width = $box.width();
    const height = $box.height();
    const $img = $('<img>')
      .attr('src', absolutePath(path, saveFile))
      .appendTo($box);
    const key = $box.attr('id');
    const pos = $box.position();
    $img
      .cropbox({
        width,
        height,
        zoom: 65e7 / width / height,
        controls: false,
        showControls: 'never',
        result: metrics[key] && metrics[key].crop,
      })
      .on('cropbox', (ce, crop) => {
        metrics[key] = {
          ...metrics[key],
          crop,
          width,
          height,
          pos,
          path,
        };
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
    migrateSettings(settings);
    ({ curTemplate, fontFamily } = settings);
    loadTemplate(curTemplate);
    ({ metrics, saveFile } = settings);
    for (const [id, { path }] of Object.entries(metrics)) {
      selectedBox = id;
      loadFileToBox(path);
    }
    ipcRenderer.send('template', curTemplate);
  }

  function autoLoadConfig() {
    const settingsJSON = localStorage.getItem(AUTO_SAVE);
    if (!settingsJSON) return false;
    const settings = JSON.parse(settingsJSON);
    log(`Loading settings saved at ${settings.savedAt}`);
    loadSettings(settings);
    return true;
  }

  function loadConfigFromFile(filePath) {
    const settings = JSON.parse(readFileSync(filePath, 'utf8'));
    log(`Loading settings from ${filePath}`);
    loadSettings({ ...settings, saveFile: filePath });
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
    const boxes = [{ x: 0, y, w: matteWidth, h: matteHeight }];
    cuts.forEach(cut => cutBox(boxes, cut));
    templates[i] = {
      name,
      boxes: boxes.map(({ x, y: top, w, h }) => ({
        top: `${top}px`,
        left: `${x}px`,
        width: `${w}px`,
        height: `${h}px`,
      })),
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
    return strs
      .map(s => `${s.replace(/\n[\n\s]*/g, ' ')}${vals.shift()}`)
      .join('');
  }

  function generateConvert(outFile = 'out.png') {
    const metricsArgs = Object.values(metrics)
      .map(f => {
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
         ${escapeShellArg(absolutePath(f.path, saveFile))}
         -normalize
         -crop ${f.crop.cropW}x${f.crop.cropH}+${f.crop.cropX}+${f.crop.cropY}
         -resize ${f.width}x${f.height} ${caption}
       \\)
       -gravity northwest
       -geometry +${f.pos.left}+${f.pos.top}
       -composite
      `;
      })
      .join(' ');
    return oneLine`
      convert
        -size ${matteWidth}x${matteFullHeight}
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
      flashNotice(`Exporting PNG to ${outFile}, please wait...`);
      const res = await exec(generateConvert(outFile));
      const withWarnings = res.stderr ? ` with warnings: ${res.stderr}` : '';
      flashNotice(`Exported PNG to ${outFile}${withWarnings}`);
    } catch (err) {
      ipcRenderer.send('infoBox', {
        title: 'Exporting Error',
        message: `Error running convert command: ${err.message}`,
      });
    }
  }

  $(() => {
    $('#file').change(e => {
      const file = e.target.files[0];
      if (!file) return;
      $('#file').val('');
      loadFileToBox(relativePath(file.path, saveFile));
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

  ipcRenderer.on('copy', () => {
    clipboard.writeText(generateConvert(), 'selection');
    flashNotice('Copied convert command to clipboard');
  });

  ipcRenderer.on('new', () => {
    loadTemplate(0);
    saveFile = null;
    autoSaveConfig();
  });

  ipcRenderer.on('saveAs', (ev, filePath) => {
    // if we change the save file, we might need to adjust the relative paths
    fixupRelativeMetricPaths(saveFile, filePath);
    saveFile = filePath;
    saveConfigToFile();
  });

  ipcRenderer.on('save', () => {
    if (saveFile) saveConfigToFile();
    else ipcRenderer.send('saveAs');
  });

  ipcRenderer.on('load', (ev, filePath) => {
    loadConfigFromFile(filePath);
  });

  ipcRenderer.on('font', (ev, ff) => {
    fontFamily = ff;
    autoSaveConfig();
    $('textarea').css('fontFamily', fontFamily);
  });

  ipcRenderer.on('export', async (ev, filePath) => {
    await runConvert(filePath);
  });
})();
