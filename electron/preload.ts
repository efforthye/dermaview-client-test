import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
// contextBridge.exposeInMainWorld('ipcRenderer', {
//   on(...args: Parameters<typeof ipcRenderer.on>) {
//     const [channel, listener] = args
//     return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
//   },
//   off(...args: Parameters<typeof ipcRenderer.off>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.off(channel, ...omit)
//   },
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.send(channel, ...omit)
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.invoke(channel, ...omit)
//   },
//
//   // You can expose other APTs you need here.
//   // ...
// })


// preload.mjs
import { contextBridge, ipcRenderer } from 'electron';

// Electron API를 노출
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    sendSync: (channel, data) => {
      return ipcRenderer.sendSync(channel, data);
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once: (channel, func) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    invoke: (channel, ...args) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

// 노출된 API 상태를 표시
console.log('Electron IPC exposed to renderer process');