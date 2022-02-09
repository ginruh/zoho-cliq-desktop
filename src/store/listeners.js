const { ipcMain } = require('electron')

const storeListeners = (store) => {
  ipcMain.on('cliq-dashboard-url', (event, url) => {
    store.set('cliqDashboardURL', url)
  })
  ipcMain.on('reset-cliq-dashboard-url', (event) => {
    store.delete('cliqDashboardURL')
  })
}

module.exports = storeListeners
