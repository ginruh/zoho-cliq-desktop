const { app, BrowserWindow, Menu, nativeImage, session, Tray } = require('electron')
const path = require('path')

let mainWindow = null

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 1000,
    width: 1200,
    title: 'Zoho Cliq',
    icon: path.join(__dirname, 'assets', 'icons', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: !app.isPackaged
    }
  })

  // and load the zoho cliq
  mainWindow.loadURL('https://cliq.zoho.com/index.do')

  // Open the DevTools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  app.setBadgeCount(10)

  const blockedURLs = []

  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: [
        'wss://*.zoho.com/pconnect*',
        'wss://*.zoho.in/pconnect*'
      ]
    },
    (details, cb) => {
      mainWindow.webContents.once('did-finish-load', () => {
        const { url } = details
        if (!blockedURLs.includes(url)) {
          blockedURLs.push(url)
          mainWindow.webContents.send('websocket-connection', JSON.stringify({
            url: details.url,
            headers: details.requestHeaders
          }))
          cb({ cancel: false })
        } else {
          cb({ cancel: false })
        }
      })
    }
  )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

let tray = null
app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'assets', 'icons', '256x256.png')
  )
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (mainWindow) mainWindow.show()
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Zoho Cliq')
  tray.setContextMenu(contextMenu)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
