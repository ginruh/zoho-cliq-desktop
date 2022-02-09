/* eslint-disable no-empty */
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, BrowserWindow, contextBridge } = require('electron')
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
      const messageSeq = []
      messages.forEach((message) => {
        messageSeq.push(message.seq)
        if (['12', '20'].includes(message.mtype) && message.retry !== 'true') {
          const { msg } = message
          const currentUserId = localStorage.getItem('ownerid')
          if (msg.sender !== currentUserId) {
            if (msg.notification_props) {
              try {
                const notificationProps = JSON.parse(msg.notification_props)
                const { mentions } = notificationProps
                if (mentions) {
                  mentions.forEach(mention => {
                    msg.notification_text = msg.notification_text.replace(`{@${mention.id}}`, mention.dn)
                  })
                }
              } catch (error) {
                console.error(error)
              }
            }
            const notification = new Notification(`@${msg.nname}`, {
              body: msg.notification_text,
              icon: `https://contacts.zoho.in/file?ID=${msg.sender}&fs=thumb`
            })
            notification.onclick = () => {
              BrowserWindow.getCurrentWindow().show()
            }
          }
        }
      })
      ws.send(
        JSON.stringify({
          s: messageSeq.join(',')
        })
      )
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

ipcRenderer.on('redirect-url', (event, url) => {
  console.log(window.location.href, url)
  if (window.location.href !== url) {
    window.location.href = url
  }
})

contextBridge.exposeInMainWorld(
  'electron',
  {
    onLocationChange: (url) => {
      ipcRenderer.send('cliq-dashboard-url', url)
    },
    resetCliqDashboardURL: () => {
      ipcRenderer.send('reset-cliq-dashboard-url')
    }
  }
)
