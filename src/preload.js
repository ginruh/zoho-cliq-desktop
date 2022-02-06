/* eslint-disable no-empty */
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer } = require('electron')
const notifier = require('node-notifier')
const WebSocket = require('ws')

const connect = ({ url, headers }) => {
  const ws = new WebSocket(url, [], {
    headers
  })
  ws.on('error', (event) => {
    console.log('Websocket error:', event)
  })
  ws.on('message', (data) => {
    try {
      const messages = JSON.parse(data.toString())
      messages.forEach((message) => {
        if (message.mtype === '12') {
          notifier.notify({
            title: message.msg.nname,
            message: message.msg.notification_text,
            wait: true,
            type: 'info'
          }, (error, response) => {
            if (error) console.log(error)
            else console.log(response)
          })
        }
      })
    } catch (error) {}
  })
  ws.on('open', () => {
    console.log('Websocket connection opened')
    setInterval(() => {
      ws.send('-', (error) => {
        if (error) console.log('Error unable to send data:', error)
        else console.log('Ping sent')
      })
    }, 30000)
  })
  ws.on('close', () => {
    console.log('Websocket connection closed')
    connect({ url, headers })
  })
}

ipcRenderer.on('websocket-connection', (event, arg) => {
  const { url, headers } = JSON.parse(arg)
  connect({ url, headers })
})
