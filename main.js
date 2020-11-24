'use strict';

const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1090,
    height: 858,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile('index.html');

  return win;
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

  function sendFn(...args) {
    return () => win.webContents.send(...args);
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      id: 'file',
      label: 'File',
      submenu: [
        {
          label: 'New Matte', id: 'new', click: sendFn('new'),
        },
        { type: 'separator' },
        { label: 'Load Matte Config', id: 'load', click: sendFn('load') },
        { label: 'Save Matte Config', id: 'save', enabled: false, click: sendFn('save') },
        { label: 'Save Matte Config As...', id: 'saveAs', enabled: false, click: sendFn('saveAs') },
        { type: 'separator' },
        { label: 'Export as PNG', id: 'export', click: sendFn('export') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Template',
      submenu: [
        { label: 'Remove Image', id: 'remove', click: sendFn('remove') },
        { type: 'separator' },
        { label: '1', type: 'radio', checked: true, click: sendFn('template', 1) },
        { label: '2', type: 'radio', click: sendFn('template', 2) },
        { label: '3', type: 'radio', click: sendFn('template', 3) },
        { label: '4', type: 'radio', click: sendFn('template', 4) },
        { label: '5', type: 'radio', click: sendFn('template', 5) },
        { label: '6', type: 'radio', click: sendFn('template', 6) },
        { label: '7', type: 'radio', click: sendFn('template', 7) },
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
