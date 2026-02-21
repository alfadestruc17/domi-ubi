import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

export default function Layout() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-logo">Domi-Ubi</Link>
        <nav className="layout-nav">
          <Link to="/stores" className="layout-nav-link">Tiendas</Link>
          <Link to="/profile" className="layout-profile">Perfil</Link>
          <span className="layout-user">
            {user?.name} {profile?.role === 'driver' && '(Conductor)'} {profile?.role === 'store' && '(Tienda)'}
          </span>
          <button type="button" onClick={handleLogout} className="layout-logout">Salir</button>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
