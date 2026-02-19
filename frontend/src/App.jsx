import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Checkout from './pages/Checkout'
import Header from './components/Header'
import Login from './components/Login'
import { AppProvider } from './context/AppContext'
import CartSidebar from './components/CartSidebar'
import Reservations from './pages/Reservations'
import Queue from './pages/Queue'
import Members from './pages/Members'
import Inventory from './pages/Inventory'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'
import Rates from './pages/Rates'

export default function App(){
  return (
    <AppProvider>
      <div className="app min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto p-6 relative pr-80">
          <CartSidebar />
          <Routes>
            <Route path="/login" element={<Login/>} />
            <Route path="/" element={<Dashboard/>} />
            <Route path="/checkout" element={<Checkout/>} />
            <Route path="/reservations" element={<Reservations/>} />
            <Route path="/queue" element={<Queue/>} />
            <Route path="/members" element={<Members/>} />
            <Route path="/inventory" element={<Inventory/>} />
            <Route path="/staff" element={<Staff/>} />
            <Route path="/reports" element={<Reports/>} />
            <Route path="/rates" element={<Rates/>} />
            <Route path="/transactions" element={<Transactions/>} />
            <Route path="/settings" element={<Settings/>} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  )
}
