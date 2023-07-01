const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('minimize'),
    adjust: () => ipcRenderer.send('adjust'),
    close: () => ipcRenderer.send('close'),
    save: () => ipcRenderer.send('save'),
    postInfo : {
        queryDay : (dayIndex) => ipcRenderer.invoke('queryDay', dayIndex),
        getInternals : (postID) => ipcRenderer.invoke('getInternals', postID),
        createPost : (postID, internals, startDay, endDay, metadata) => ipcRenderer.send('createPost', postID, internals, startDay, endDay, metadata),
        savePost : (postID, startDay, endDay, metadata) => ipcRenderer.send('savePost', postID, startDay, endDay, metadata),
        updateInternals : (postID, internals) => ipcRenderer.send('updateInternals', postID, internals),
        deletePost : (postID) => ipcRenderer.send('deletePost', postID),
    },
    initialMaxPostID: process.argv[process.argv.length - 1]
});

