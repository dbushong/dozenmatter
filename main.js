'use strict';

const { join: pathJoin, resolve: pathResolve } = require('path');
const { existsSync } = require('fs');

// eslint-disable-next-line import/no-extraneous-dependencies
const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron');
const prompt = require('electron-prompt');

const templates = require('./templates');

const isMac = process.platform === 'darwin';

const WIDTH = 4200;
const HEIGHT = 3250;
const SCALE = 0.252;

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

async function handleChangeFont(win) {
  const fontFamily = await prompt(
    {
      title: 'Select Font Family',
      label: 'Font Family:',
      type: 'input',
      customStylesheet: 'prompt.css',
    },
    win
  );
  if (fontFamily) win.webContents.send('font', fontFamily);
}

function createMenus(win) {
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

          { type: 'separator' },

          {
            label: 'Change Caption Font',
            click: () => handleChangeFont(win),
          },
        ],
      },

      {
        label: 'Template',
        submenu: templateMenuItems(win),
      },

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

app.whenReady().then(async () => {
  const win = createWindow();
  createMenus(win);
  const cfgArg = process.argv[2];
  win.webContents.once('did-finish-load', () => {
    if (cfgArg && existsSync(cfgArg)) {
      sendLoadConfig(win, pathResolve(cfgArg));
    } else {
      win.webContents.send('startup');
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
