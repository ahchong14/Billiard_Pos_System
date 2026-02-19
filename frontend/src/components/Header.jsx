import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header(){
  const { user, setUser } = useApp()
  const nav = useNavigate()

  function handleLogout(){
    setUser(null)
    nav('/login')
  }

    return (
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">Pool POS</div>
          <div className="text-sm text-slate-300">运营原型</div>
        </div>
        <nav className="flex-1">
          <ul className="flex gap-4">
            <li><Link className="hover:text-white text-slate-200" to="/">Dashboard</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/reservations">Reservations</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/queue">Queue</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/members">Members</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/inventory">Inventory</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/staff">Staff</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/reports">Reports</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/rates">Rates</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/transactions">Transactions</Link></li>
            <li><Link className="hover:text-white text-slate-200" to="/settings">Settings</Link></li>
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm">{user.name}</span>
              <button className="text-sm text-slate-200 hover:text-white" onClick={handleLogout}>登出</button>
            </>
          ) : (
            <Link className="text-sm text-slate-200 hover:text-white" to="/login">登录</Link>
          )}
        </div>
      </header>
    )
}
