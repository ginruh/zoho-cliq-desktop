const Store = require('electron-store')
const storeListeners = require('./listeners')

const schema = {
  cliqDashboardURL: {
    type: 'string'
  }
}

const store = new Store({
  schema
})

// Listen to events associated with store
storeListeners(store)

module.exports = store
