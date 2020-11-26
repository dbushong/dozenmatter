'use strict';

const { join: pathJoin, resolve: pathResolve } = require('path');
const { existsSync } = require('fs');

// eslint-disable-next-line import/no-extraneous-dependencies
const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron');

const templates = require('./templates');
const { listBoldFonts } = require('./fonts');

const isMac = process.platform === 'darwin';

const WIDTH = 4200;
const HEIGHT = 3250;
const SCALE = 0.252;

function dieOnError(err) {
  process.nextTick(() => {
    throw err;
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: Math.ceil(WIDTH * SCALE),
    height: Math.floor((HEIGHT + 100) * SCALE),
    webPreferences: {
      nodeIntegration: true,
    },
    resizable: false,
  });

  win.loadFile(pathJoin(__dirname, 'index.html'));

  return win;
}

function templateMenuItems(win) {
  return templates.map(({ name: label }, i) => ({
    label,
    type: 'radio',
    id: `tmpl${i}`,
    checked: i === 0,
    click: () => win.webContents.send('template', i),
  }));
}

function fontMenuItems(win, fontList) {
  return fontList.map(({ cssFontFamily, imFontName }, i) => ({
    label: cssFontFamily,
    type: 'radio',
    id: `font-${imFontName}`,
    checked: i === 0,
    click: () => win.webContents.send('font', { cssFontFamily, imFontName }),
  }));
}

const configFilters = [{ name: 'JSON Configs', extensions: ['json'] }];
async function handleSaveConfigAs(win) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Matte Config',
    filters: configFilters,
  });
  if (!canceled) {
    await win.webContents.send('saveAs', filePath);
  }
}

function sendLoadConfig(win, filePath) {
  return win.webContents.send('load', filePath);
}

async function handleLoadConfig(win) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Load Matte Config',
    filters: configFilters,
    properties: ['openFile'],
  });
  if (!canceled) await sendLoadConfig(win, filePaths[0]);
}

async function handleExport(win) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export as PNG',
    filters: [{ name: 'PNG files', extensions: ['png'] }],
  });
  if (!canceled) await win.webContents.send('export', filePath);
}

async function createMenus(win) {
  ipcMain.on('infoBox', (ev, opts) => {
    dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['OK'],
      ...opts,
    });
  });

  ipcMain.on('saveAs', () => handleSaveConfigAs(win));

  ipcMain.on('template', (ev, i) => {
    Menu.getApplicationMenu().getMenuItemById(`tmpl${i}`).checked = true;
  });

  const fontList = await listBoldFonts();
  const fallbackFont = fontList[0];
  ipcMain.on('font', async (ev, id) => {
    const menu = Menu.getApplicationMenu().getMenuItemById(`font-${id}`);
    if (menu) menu.checked = true;
    else {
      await dialog.showMessageBox(win, {
        type: 'warning',
        buttons: ['OK'],
        message: `Unable to find font "${id}" locally; falling back on ${fallbackFont.cssFontFamily}`,
      });
      win.webContents.send('font', fallbackFont);
    }
  });

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(isMac ? [{ role: 'appMenu' }] : []),
      {
        id: 'file',
        label: 'File',
        submenu: [
          {
            label: 'New Matte',
            accelerator: 'CommandOrControl+N',
            id: 'new',
            click: () => win.webContents.send('new'),
          },

          { type: 'separator' },

          {
            label: 'Open Matte Config...',
            id: 'load',
            accelerator: 'CommandOrControl+O',
            click: () => handleLoadConfig(win),
          },
          {
            label: 'Save Matte Config',
            id: 'save',
            accelerator: 'CommandOrControl+S',
            click: () => win.webContents.send('save'),
          },
          {
            label: 'Save Matte Config As...',
            id: 'saveAs',
            click: () => handleSaveConfigAs(win),
          },

          { type: 'separator' },

          {
            label: 'Export as PNG...',
            accelerator: 'CommandOrControl+E',
            click: () => handleExport(win),
          },

          ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit' }]),
        ],
      },

      {
        label: 'Edit',
        submenu: [
          {
            label: 'Copy Convert Command',
            accelerator: 'CommandOrControl+C',
            click: () => win.webContents.send('copy'),
          },

          { type: 'separator' },

          {
            label: 'Remove Image',
            id: 'remove',
            click: () => win.webContents.send('remove'),
          },
        ],
      },

      {
        label: 'Template',
        submenu: templateMenuItems(win),
      },

      { label: 'Font', submenu: fontMenuItems(win, fontList) },

      ...(app.isPackaged
        ? []
        : [
            {
              label: 'Developer',
              submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
              ],
            },
          ]),
    ])
  );
}

app
  .whenReady()
  .then(async () => {
    const win = createWindow();
    await createMenus(win);
    const cfgArg = process.argv[2];
    win.webContents.once('did-finish-load', () => {
      if (cfgArg && existsSync(cfgArg)) {
        sendLoadConfig(win, pathResolve(cfgArg));
      }
    });
  })
  .catch(dieOnError);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
