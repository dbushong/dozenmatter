'use strict';

const { join: pathJoin } = require('path');

const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron');

const templates = require('./templates');

function enableSave() {
  Menu.getApplicationMenu().getMenuItemById('save').enabled = true;
}
ipcMain.on('enableSave', enableSave);

function createWindow() {
  const win = new BrowserWindow({
    width: 1090,
    height: 858,
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
    checked: i === 0,
    click: () => win.webContents.send('template', i),
  }));
}

const filters = [{ name: 'JSON Configs', extensions: ['json'] }];

async function handleSaveConfigAs(win) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Matte Config',
    filters,
  });
  if (!canceled) {
    await win.webContents.send('saveAs', filePath);
    enableSave();
  }
}

async function handleLoadConfig(win) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Load Matte Config',
    filters,
    properties: ['openFile'],
  });
  if (!canceled) {
    await win.webContents.send('load', filePaths[0]);
    enableSave();
  }
}

function createMenus(win) {
  ipcMain.on('infoBox', (ev, { title, message }) => {
    dialog.showMessageBox(win, {
      type: 'info',
      title,
      message,
      buttons: ['OK'],
    });
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      id: 'file',
      label: 'File',
      submenu: [
        {
          label: 'New Matte',
          id: 'new',
          click: () => win.webContents.send('new'),
        },

        { type: 'separator' },

        {
          label: 'Open Matte Config',
          id: 'load',
          accelerator: 'CommandOrControl+O',
          click: () => handleLoadConfig(win),
        },
        {
          label: 'Save Matte Config',
          id: 'save',
          enabled: false,
          accelerator: 'CommandOrControl+S',
          click: () => win.webContents.send('save'),
        },
        { label: 'Save Matte Config As...', id: 'saveAs', click: () => handleSaveConfigAs(win) },

        { type: 'separator' },

        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Copy Convert Command',
          id: 'export',
          accelerator: 'CommandOrControl+C',
          click: () => win.webContents.send('export'),
        },

      ],
    },
    {
      label: 'Template',
      submenu: [
        { label: 'Remove Image', id: 'remove', click: () => win.webContents.send('remove') },
        { type: 'separator' },
        ...templateMenuItems(win),
      ],
    },
    ...(app.isPackaged ? [] : [{
      label: 'Developer',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    }]),
  ]));
}

app.whenReady().then(() => {
  const win = createWindow();
  createMenus(win);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
