import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

const host = window.location.hostname
const port = window.location.port || '80'
const scheme = window.location.protocol === 'https:' ? 'https' : 'http'
// En dev (puerto 5173) el navegador conecta a 5173 y Vite hace proxy de /app a :80
const wsPort = port === '5173' ? 5173 : parseInt(port, 10) || 80

export const echo = new Echo({
  broadcaster: 'reverb',
  key: 'domi-ubi-key',
  wsHost: host,
  wsPort,
  wssPort: 443,
  forceTLS: scheme === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  wsPath: '/app',
})

export function getEchoConfig() {
  const wsScheme = scheme === 'https' ? 'wss' : 'ws'
  return {
    wsUrl: `${wsScheme}://${host}:${wsPort}/app`,
    key: 'domi-ubi-key',
  }
}
