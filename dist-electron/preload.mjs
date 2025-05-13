"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      electron.ipcRenderer.send(channel, data);
    },
    sendSync: (channel, data) => {
      return electron.ipcRenderer.sendSync(channel, data);
    },
    on: (channel, func) => {
      electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once: (channel, func) => {
      electron.ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    invoke: (channel, ...args) => {
      return electron.ipcRenderer.invoke(channel, ...args);
    },
    removeAllListeners: (channel) => {
      electron.ipcRenderer.removeAllListeners(channel);
    }
  }
});
console.log("Electron IPC exposed to renderer process");
