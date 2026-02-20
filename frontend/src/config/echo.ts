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
const wsPort = port === '5173' ? 5173 : parseInt(port, 10) || 80

// Pusher-js construye path como (wsPath || '') + '/app/' + key. Si wsPath es '/app' sale /app/app/key.
// Dejar wsPath vacío para que el path sea /app/domi-ubi-key (el proxy /app y Reverb lo aceptan).
let echoInstance: ReturnType<typeof Echo> | null = null

export function getEcho(): ReturnType<typeof Echo> {
  if (!echoInstance) {
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: 'domi-ubi-key',
      wsHost: host,
      wsPort,
      wssPort: 443,
      forceTLS: scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      wsPath: '', // vacío para que pusher-js genere /app/key y no /app/app/key
    })
  }
  return echoInstance
}

// No exportar una instancia aquí: así Echo solo se conecta al montar TripView/DriverDashboard, no en login.

export function getEchoConfig() {
  const wsScheme = scheme === 'https' ? 'wss' : 'ws'
  return {
    wsUrl: `${wsScheme}://${host}:${wsPort}/app`,
    key: 'domi-ubi-key',
  }
}
