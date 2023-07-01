const { app, BrowserWindow, ipcMain } = require('electron');
const IntervalTree = require('@flatten-js/interval-tree').default;
const path = require('path');
const Database = require('better-sqlite3');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 720,
        minWidth: 630,
        minHeight: 540,
        webPreferences: {
            devTools: true,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments : ['' + saveData.postInfo.maxPostID],
        },
        titleBarStyle: 'hidden',
        icon: 'icon.png'
    });
    win.setMenuBarVisibility(false)
    win.loadFile('index.html');
    ipcMain.on('minimize', () => {
        win.minimize();
    });
    ipcMain.on('adjust', () => {
        win.isMaximized() ? win.unmaximize() : win.maximize();
    });
    ipcMain.on('close', () => {
        saveData.db.close();
        win.close();
    });
    ipcMain.on('createPost', (e, postID, internals, startDay, endDay, metadata) => {
        saveData.postInfo.createPost(postID, internals, startDay, endDay, metadata);
    });
    ipcMain.on('savePost', (e, postID, startDay, endDay, metadata) => {
        saveData.postInfo.savePost(postID, startDay, endDay, metadata);
    });
    ipcMain.on('updateInternals', (e, postID, internals) => {
        saveData.postInfo.updateInternals(postID, internals);
    });
    ipcMain.on('deletePost', (e, postID) => {
        saveData.postInfo.deletePost(postID);
    });
    ipcMain.handle('getInternals', (e, postID) => {
        return saveData.postInfo.getInternals(postID);
    });
    ipcMain.handle('queryDay', (e, dayIndex) => {
        return saveData.postInfo.queryDay(dayIndex);
    });
}

let saveData = {
    config : {
        ivBase : 10,
        maxIvSize : 5,
    },
    sizeToTable(ivSize) {
        let ct = 0;
        ivSize--;
        while (ivSize > 0) {
            ivSize = Math.floor(ivSize / this.config.ivBase);
            ct++;
        }
        return this.pow[ct];
    },
    pow : [], //stores the interval size thresholds
    db : new Database('./saveData/twrd.db'),
    postInfo: { //handles the posts and incoming queries for modification
        ivTree : new IntervalTree(),
        maxPostID : 0, //used for generating new postIDs
        posts : {
            /*
            postID1 : {
                startDay : ...,
                endDay : ...,
                metadata : ...,
            }
            */
        },
        visitedDay : { //if day was already visited, no need to load from database
            /*
            dayIndex1 : true,
            */
        },
        createPost(postID, internals, startDay, endDay, metadata) {
            let newTable = saveData.sizeToTable(endDay - startDay + 1);

            this.maxPostID = postID;

            let sqlSave = `
                REPLACE INTO posts_${newTable} (postID, internals, startDay, endDay, metadata)
                VALUES (?, ?, ?, ?, ?)
            `;
            saveData.db.prepare(sqlSave).run(postID, internals, startDay, endDay, metadata);

            this.posts[postID] = {
                startDay : startDay,
                endDay : endDay,
                metadata : metadata
            }

            this.ivTree.insert([startDay, endDay], postID);
        },
        savePost(postID, startDay, endDay, metadata) {
            let newTable = saveData.sizeToTable(endDay - startDay + 1);
            
            let internals = undefined;

            //the post is guaranteed to have been cached in this.posts
            let originalTable = saveData.sizeToTable(this.posts[postID].endDay - this.posts[postID].startDay + 1);
            if (originalTable != newTable) {
                let sqlGrab = `
                    SELECT internals FROM posts_${originalTable}
                    WHERE postID == ${postID};
                `
                const row = saveData.db.prepare(sqlGrab).get();
                internals = row.internals;
                let sqlDel = `
                    DELETE FROM posts_${originalTable}
                    WHERE postID == ${postID};
                `;
                saveData.db.prepare(sqlDel).run();
            }
            this.ivTree.remove([this.posts[postID].startDay, this.posts[postID].endDay], postID);

            if (internals == undefined) {
                let sqlSave = `
                    UPDATE posts_${newTable}
                    SET startDay = ?, endDay = ?, metadata = ?
                    WHERE postID = ?
                `;
                saveData.db.prepare(sqlSave).run(startDay, endDay, metadata, postID);
            } else {
                let sqlSave = `
                    REPLACE INTO posts_${newTable} (postID, internals, startDay, endDay, metadata)
                    VALUES (?, ?, ?, ?, ?)
                `;
                saveData.db.prepare(sqlSave).run(postID, internals, startDay, endDay, metadata);
            }

            this.posts[postID] = {
                startDay : startDay,
                endDay : endDay,
                metadata : metadata
            }

            this.ivTree.insert([startDay, endDay], postID);
        },
        updateInternals(postID, internals) {
            let table = saveData.sizeToTable(this.posts[postID].endDay - this.posts[postID].startDay + 1);
            let sqlSave = `
                UPDATE posts_${table}
                SET internals = ?
                WHERE postID = ?
            `;
            saveData.db.prepare(sqlSave).run(internals, postID);
        },
        deletePost(postID) {
            let table = saveData.sizeToTable(this.posts[postID].endDay - this.posts[postID].startDay + 1);
            let sqlDel = `
                DELETE FROM posts_${table}
                WHERE postID == ${postID};
            `
            saveData.db.prepare(sqlDel).run();

            this.ivTree.remove([this.posts[postID].startDay, this.posts[postID].endDay], postID);
            delete this.posts[postID];
        },
        getInternals(postID) {
            let table = saveData.sizeToTable(this.posts[postID].endDay - this.posts[postID].startDay + 1);
            let sqlGrab = `
                SELECT internals FROM posts_${table}
                WHERE postID == ${postID};
            `
            const row = saveData.db.prepare(sqlGrab).get();
            return row.internals;
        },
        //given a specific day ID, send out an object that maps postIDs to data
        queryDay(dayIndex) {
            let ret = {};
            if (dayIndex in this.visitedDay) {
                let IDs = this.ivTree.search([dayIndex, dayIndex]);
                IDs.forEach(postID => {
                    ret[postID] = this.posts[postID];
                });
            } else {
                let ct = 0;
                for (let i = 0; i <= saveData.config.maxIvSize; i++) {
                    let sqlGrab = `
                        SELECT postID, startDay, endDay, metadata
                        FROM posts_${saveData.pow[i]}
                        WHERE endDay BETWEEN ${dayIndex} AND ${dayIndex + saveData.pow[i] - 1}
                            AND startDay <= ${dayIndex};
                    `
                    const rows = saveData.db.prepare(sqlGrab).all();

                    rows.forEach(row => {
                        if (!(row.postID in this.posts)) {
                            this.posts[row.postID] = {
                                startDay : row.startDay,
                                endDay : row.endDay,
                                metadata : row.metadata
                            }
                            this.ivTree.insert([row.startDay, row.endDay], row.postID);
                        }
                        ret[row.postID] = this.posts[row.postID];
                    });
                }
                this.visitedDay[dayIndex] = true;
            }
            return ret;
        }
    },
    init() {
        this.pow = new Array(this.config.maxIvSize + 1);
        this.pow[0] = 1;
        for (let i = 1; i <= this.config.maxIvSize; i++) {
            this.pow[i] = this.config.ivBase * this.pow[i - 1];
        }

        //create tables for each range of post sizes up to this.config.ivBase**(this.config.maxIvSize)
        for (let i = 0; i <= this.config.maxIvSize; i++) {
            let sqlCreate = `
                CREATE TABLE IF NOT EXISTS posts_${this.pow[i]} (
                    postID INTEGER NOT NULL PRIMARY KEY,
                    internals TEXT NOT NULL,
                    startDay INTEGER NOT NULL,
                    endDay INTEGER NOT NULL,
                    metadata TEXT NOT NULL
                ) WITHOUT ROWID
            `;
            this.db.prepare(sqlCreate).run();
        }
        for (let i = 0; i <= this.config.maxIvSize; i++) {
            let sqlMAX = `SELECT MAX(postID) FROM posts_${this.pow[i]}`;
            const row = this.db.prepare(sqlMAX).get();

            if (row != null) {
                const maxVal = row['MAX(postID)'];
                this.postInfo.maxPostID = Math.max(maxVal, this.postInfo.maxPostID);
            }
        }
        console.log(this.postInfo.maxPostID);
    }
}

//app.disableHardwareAcceleration();

app.whenReady().then(() => {
    saveData.init();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

