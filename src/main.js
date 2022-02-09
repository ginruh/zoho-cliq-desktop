const { app, BrowserWindow, Menu, nativeImage, session, Tray } = require('electron')
const path = require('path')
const store = require('./store')

const homePageURL = 'https://www.zoho.com/en-in/cliq/'

let mainWindow = null
let tray = null

const appLock = app.requestSingleInstanceLock()

function createWindow () {
  // Create the browser window
  mainWindow = new BrowserWindow({
    height: 1000,
    width: 1200,
    show: true,
    title: 'Zoho Cliq',
    icon: path.join(__dirname, 'assets', 'icons', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'preload.js'),
      devTools: !app.isPackaged,
      webviewTag: true
    }
  })

  // remove menu
  mainWindow.removeMenu()

  // load home.html file
  mainWindow.loadURL(`file://${path.join(__dirname, 'home.html')}`)

  // Open the DevTools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', () => {
    const cliqDashboardURL = store.get('cliqDashboardURL')
    if (cliqDashboardURL) {
      mainWindow.webContents.send('redirect-url', cliqDashboardURL)
    } else {
      mainWindow.webContents.send('redirect-url', homePageURL)
    }
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.on('did-navigate', (event, url) => {
    if (url.includes('/index.do')) {
      store.set('cliqDashboardURL', url)
    } else if (url === 'https://www.zoho.com/cliq/login.html') {
      store.delete('cliqDashboardURL')
    }
  })

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
        if (blockedURLs.length === 0) {
          blockedURLs.push(url)
          console.log(details.url)
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

if (!appLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    if (mainWindow) {
      if (!mainWindow.isVisible() || mainWindow.isMinimized()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.on('ready', () => {
    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.whenReady().then(() => {
    const icon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'icons', '256x256.png')
    )
    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true
          app.quit()
        }
      }
    ])

    tray.setToolTip('Zoho Cliq')
    tray.setContextMenu(contextMenu)
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
