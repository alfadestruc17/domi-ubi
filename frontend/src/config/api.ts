/**
 * Base URL de la API (gateway). En dev Vite hace proxy de /auth, /users, /trips, /drivers a localhost:80.
 */
export const API_BASE = ''

export const ROUTES = {
  auth: {
    register: '/auth/api/register',
    login: '/auth/api/login',
    forgotPassword: '/auth/api/forgot-password',
    validateToken: '/auth/api/validate-token',
    logout: '/auth/api/logout',
  },
  users: {
    profile: '/users/api/profile',
  },
  trips: {
    list: '/trips/api/trips',
    create: '/trips/api/trips',
    available: '/trips/api/trips/available',
    show: (id: number) => `/trips/api/trips/${id}`,
    status: (id: number) => `/trips/api/trips/${id}/status`,
    availableDrivers: '/trips/api/trips/available-drivers',
  },
  drivers: {
    me: '/drivers/api/drivers/me',
    available: '/drivers/api/drivers/available',
    availability: '/drivers/api/drivers/me/availability',
    location: '/drivers/api/drivers/me/location',
  },
} as const
