import React, {createContext, useContext, useEffect, useState, useRef} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { subscribe } from '../ws'

const AppContext = createContext(null)

export function useApp(){
  return useContext(AppContext)
}

function defaultTables(count=12){
  return Array.from({length:count}).map((_,i)=>({
    id: i+1,
    status: 'idle', // idle | occupied | cleaning | reserved
    startedAt: null,
    elapsedSec: 0,
    currentSessionId: null,
    serviceRequestedAt: null,
    activityLogs: []
  }))
}

function appendLog(table, message){
  const logs = Array.isArray(table.activityLogs) ? table.activityLogs : []
  return {
    ...table,
    activityLogs: [{ id: uuidv4(), message, timestamp: Date.now() }, ...logs].slice(0, 20)
  }
}

export function AppProvider({children}){
  const [tables, setTables] = useState(()=> defaultTables(12))
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([]) // [{itemId, name, price, qty}, ...]
  const [rates, setRates] = useState([])
  const [settings, setSettings] = useState({})
  const [orders, setOrders] = useState({}) // {tableId: [{id, items, status, createdAt}, ...], ...}
  const timersRef = useRef({})

  useEffect(()=>{
    // try to fetch tables, rates, settings from backend via mockApi
    import('../api/mockApi').then(async mod=>{
      try{
        const t = await mod.api.listTables()
        setTables(t)
      }catch(e){ }
      try{
        const r = await mod.api.listRates()
        setRates(r)
      }catch(e){}
      try{
        const s = await mod.api.listSettings()
        setSettings(s)
      }catch(e){}
    })

    // subscribe to websocket table updates
    const unsub = subscribe(msg=>{
      if(msg && msg.type === 'table_update' && msg.table){
        setTables(prev=> prev.map(t=> t.id===msg.table.id ? msg.table : t))
      }
      if(msg && msg.type === 'init' && msg.tables){
        setTables(msg.tables)
      }
    })
    return ()=> unsub()
  },[])

  useEffect(()=>{
    // persist
    localStorage.setItem('pool_tables_v1', JSON.stringify(tables))
  },[tables])

  function startTable(tableId){
    setTables(prev=> prev.map(t=> {
      if(t.id!==tableId) return t
      return appendLog({
        ...t,
        status: 'occupied',
        startedAt: Date.now(),
        currentSessionId: uuidv4(),
        elapsedSec: 0
      }, '开台并开始计时')
    }))
    setSelectedTableId(tableId)
  }

  function stopTable(tableId){
    setTables(prev=> prev.map(t=> {
      if(t.id!==tableId) return t
      return appendLog({
        ...t,
        status: 'idle',
        startedAt: null,
        elapsedSec: 0,
        currentSessionId: null,
        serviceRequestedAt: null
      }, '结账完成，桌位已空闲')
    }))
    if(selectedTableId === tableId) setSelectedTableId(null)
  }

  function markTableCleaning(tableId){
    setTables(prev=> prev.map(t=> {
      if(t.id!==tableId) return t
      return appendLog({
        ...t,
        status: 'cleaning',
        startedAt: null,
        elapsedSec: 0,
        currentSessionId: null,
        serviceRequestedAt: null
      }, '已标记为清理中')
    }))
  }

  function clearTableCleaning(tableId){
    setTables(prev=> prev.map(t=> {
      if(t.id!==tableId) return t
      return appendLog({ ...t, status: 'idle' }, '清理完成，恢复为空闲')
    }))
  }

  function requestTableService(tableId){
    setTables(prev=> prev.map(t=> {
      if(t.id!==tableId) return t
      return appendLog({ ...t, serviceRequestedAt: Date.now() }, '已呼叫服务')
    }))
  }

  function resolveTableService(tableId){
    setTables(prev=> prev.map(t=> {
      if(t.id!==tableId) return t
      return appendLog({ ...t, serviceRequestedAt: null }, '服务请求已处理')
    }))
  }

  function selectTable(id){ setSelectedTableId(id) }

  async function mergeTables(sourceId, targetId){
    try {
      // Call backend merge API
      const response = await fetch('http://localhost:3001/api/tables/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryTableId: targetId,
          secondaryTableIds: [sourceId]
        })
      })
      
      if (!response.ok) {
        console.error('Merge API error:', response.status)
        return false
      }

      const result = await response.json()
      
      // Update local state based on backend response
      setTables(prev => prev.map(t => {
        if (t.id === targetId) {
          // Primary table gets merge info
          return {
            ...t,
            mergedWith: result.primary.mergedWith || [sourceId],
            status: 'occupied'
          }
        }
        if (t.id === sourceId) {
          // Secondary table becomes merged
          return {
            ...t,
            status: 'merged',
            mergedInto: targetId
          }
        }
        return t
      }))
      
      return true
    } catch (err) {
      console.error('Merge error:', err)
      // Fallback to local merge
      setTables(prev=> prev.map(t=>{
        if(t.id===targetId){
          const merged = {...t}
          merged.mergedWith = Array.from(new Set([...(merged.mergedWith||[]), sourceId]))
          merged.status = 'occupied'
          return merged
        }
        if(t.id===sourceId){
          return {...t, status:'merged', mergedInto: targetId}
        }
        return t
      }))
      return false
    }
  }

  async function splitTable(tableId) {
    try {
      const response = await fetch(`http://localhost:3001/api/tables/${tableId}/unmerge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setTables(prev => prev.map(t => {
          if (t.id === tableId) {
            return { ...t, mergedWith: undefined }
          }
          // Restore merged tables
          if (t.mergedInto === tableId) {
            return { ...t, status: 'occupied', mergedInto: undefined }
          }
          return t
        }))
        return true
      }
    } catch (err) {
      console.error('Unmerge error:', err)
    }

    // Fallback local split
    setTables(prev=> prev.map(t=> t.id===tableId ? ({...t, mergedWith: undefined}) : t))
    return false
  }


  function tick(){
    setTables(prev=> prev.map(t=> {
      if(t.status==='occupied' && t.startedAt){
        const secs = Math.floor((Date.now() - t.startedAt)/1000)
        return {...t, elapsedSec: secs}
      }
      return t
    }))
  }

  useEffect(()=>{
    const id = setInterval(()=> tick(), 1000)
    return ()=> clearInterval(id)
  },[])

  // keyboard shortcuts: F1 start, F2 stop
  useEffect(()=>{
    function onKey(e){
      if(e.key === 'F1'){
        if(selectedTableId) startTable(selectedTableId)
        e.preventDefault()
      }
      if(e.key === 'F2'){
        if(selectedTableId) stopTable(selectedTableId)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[selectedTableId])

  // Cart management
  function addToCart(item) {
    setCart(prev => {
      const exists = prev.find(x => x.itemId === item.itemId)
      if (exists) {
        return prev.map(x => x.itemId === item.itemId ? {...x, qty: x.qty + (item.qty || 1)} : x)
      }
      return [...prev, {itemId: item.itemId, name: item.name, price: item.price, qty: item.qty || 1}]
    })
  }

  function removeFromCart(itemId) {
    setCart(prev => prev.filter(x => x.itemId !== itemId))
  }

  function updateCartQty(itemId, qty) {
    if (qty <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(prev => prev.map(x => x.itemId === itemId ? {...x, qty} : x))
    }
  }

  function clearCart() {
    setCart([])
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  }

  async function submitOrder(paymentMethod = 'cash') {
    if (!selectedTableId || cart.length === 0) return false

    try {
      const table = tables.find(t => t.id === selectedTableId)
      const minutes = table ? Math.ceil((table.elapsedSec || 0) / 60) : 0
      const ratePerMin = (rates && rates.length>0) ? (rates[0].baseRate || 0.5) : 0.5
      const tableFee = minutes * ratePerMin
      const cartTotal = getCartTotal()
      const amount = tableFee + cartTotal

      const orderData = {
        tableId: selectedTableId,
        items: cart,
        subtotal: tableFee + cartTotal,
        discount: 0,
        tax: 0,
        amount: amount,
        paymentMethod,
        notes: '订单'
      }

      // Save to backend via API
      const response = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const savedOrder = await response.json()
        
        // Update local orders
        setOrders(prev => ({
          ...prev,
          [selectedTableId]: [...(prev[selectedTableId] || []), savedOrder]
        }))
        clearCart()
        return true
      } else {
        console.error('Order submission failed:', response.status)
        return false
      }
    } catch (err) {
      console.error('Order submission error:', err)
      return false
    }
  }

  function computeTableFeeForTable(table){
    const mins = Math.ceil((table.elapsedSec || 0)/60)
    const ratePerMin = (rates && rates.length>0) ? (rates[0].baseRate || 0.5) : 0.5
    const businessServiceFeePct = settings.serviceFeePct ? Number(settings.serviceFeePct) : null
    const subtotal = mins * ratePerMin
    const serviceFee = businessServiceFeePct ? subtotal * (businessServiceFeePct/100) : 0
    return { minutes: mins, ratePerMin, subtotal, serviceFee, total: subtotal + serviceFee }
  }

  return (
    <AppContext.Provider value={{
      tables, setTables, startTable, stopTable, user, setUser, selectedTableId, selectTable,
      mergeTables, splitTable,
      markTableCleaning, clearTableCleaning, requestTableService, resolveTableService,
      cart, addToCart, removeFromCart, updateCartQty, clearCart, getCartTotal, submitOrder,
      orders, setOrders,
      rates, settings, computeTableFeeForTable
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext
