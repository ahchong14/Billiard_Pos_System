import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TableModal from '../components/TableModal'
import { api } from '../api/mockApi'

function TableCard({t, onOpen, isMergedIntoAnother, computeFee}){
  const mins = Math.floor((t.elapsedSec||0)/60)
  const secs = (t.elapsedSec||0) % 60
  const isOccupied = t.status === 'occupied'
  const isMerged = t.status === 'merged'
  const hasMerged = Array.isArray(t.mergedWith) && t.mergedWith.length > 0
  
  let statusClass = 'bg-emerald-50'
  if (isMerged) statusClass = 'bg-amber-50 opacity-60 ring-2 ring-amber-300'
  else if (isOccupied) statusClass = 'bg-red-50'
  else if (t.status === 'reserved') statusClass = 'bg-blue-50'
  else if (t.status === 'cleaning') statusClass = 'bg-slate-100 ring-1 ring-slate-300'

  return (
    <div 
      className={`relative ${statusClass} rounded-lg p-4 shadow cursor-pointer flex flex-col justify-between transition-all hover:shadow-lg ${isMerged ? 'pointer-events-none' : ''}`} 
      onClick={()=>!isMerged && onOpen(t)} 
      draggable={!isMerged}
      onDragStart={(e)=> {
        if(!isMerged) e.dataTransfer.setData('text/plain', t.id)
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-semibold">台 {t.id}</div>
          <div className="text-sm text-slate-500">
            {isMerged ? `已并入台 ${t.mergedInto}` : t.status.toUpperCase()}
          </div>
          {hasMerged && (
            <div className="text-xs text-slate-600 mt-1">
              并入: {t.mergedWith.join(', ')}
            </div>
          )}
          {t.serviceRequestedAt && (
            <div className="text-xs text-amber-600 mt-1">服务请求中</div>
          )}
        </div>
        <div className="flex gap-2">
          {!isMerged && (
            <>
              <button title="加单" className="px-2 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600">＋</button>
              <button title="结账" className="px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600">￥</button>
              <button title="切换" className="px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300">↔</button>
            </>
          )}
        </div>
      </div>

      {!isMerged && (
        <div className="text-center py-4">
          <div className="text-2xl font-bold">{mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}</div>
          {computeFee ? (
            (() => {
              const fee = computeFee(t)
              return <div className="text-sm text-slate-600 mt-1">RM {fee.total.toFixed(2)}</div>
            })()
          ) : (
            <div className="text-sm text-slate-600 mt-1">RM {( (t.elapsedSec||0)/60 * 0.5 ).toFixed(2)}</div>
          )}
        </div>
      )}

      <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{background: isMerged ? '#f59e0b' : isOccupied ? '#ef4444' : t.status==='reserved' ? '#3b82f6' : '#10b981'}}></div>
    </div>
  )
}

export default function Dashboard(){
  const { tables, selectTable, mergeTables, computeTableFeeForTable } = useApp()
  const navigate = useNavigate()
  const [sel, setSel] = useState(null)
  const [mergeStatus, setMergeStatus] = useState('')
  const [stats, setStats] = useState({ totalTransactions: 0, totalRevenue: 0, avgOrderValue: 0 })
  const [promotions, setPromotions] = useState([])
  const [reservations, setReservations] = useState([])

  function handleOpen(t){
    setSel(t)
    selectTable(t.id)
  }

  async function handleDrop(e, targetId){
    e.preventDefault()
    const data = e.dataTransfer.getData('text/plain')
    const sourceId = Number(data)
    if(sourceId && sourceId !== targetId){
      setMergeStatus('合并中...')
      const success = await mergeTables(sourceId, targetId)
      if(success){
        setMergeStatus(`✓ 台位 ${sourceId} 已并入台位 ${targetId}`)
        setTimeout(()=> setMergeStatus(''), 3000)
      } else {
        setMergeStatus(`✗ 合并失败，已本地保存`)
        setTimeout(()=> setMergeStatus(''), 3000)
      }
    }
  }

  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try{
        const s = await api.getTransactionStats()
        if(mounted) setStats(s)
      }catch(e){}
      try{
        const p = await api.listPromotions()
        if(mounted) setPromotions(p)
      }catch(e){}
      try{
        const r = await api.listReservations()
        if(mounted) setReservations(r)
      }catch(e){}
    })()
    return ()=> { mounted = false }
  },[])

  return (
    <div className="dashboard">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">桌位地图</h2>
        <div className="toolbar flex items-center gap-3">
          <div className="text-sm text-slate-700 mr-4">
            <div>活跃订单: <span className="font-semibold">{stats.totalTransactions}</span></div>
            <div>今日收入: <span className="font-semibold">RM {Number(stats.totalRevenue||0).toFixed(2)}</span></div>
          </div>
          <button className="px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700" onClick={()=>navigate('/settings')}>新增 / 管理台位</button>
          <button className="px-3 py-2 border rounded hover:bg-slate-50" onClick={()=>navigate('/settings')}>布局/设置</button>
        </div>
      </div>

      {mergeStatus && (
        <div className={`mb-4 p-3 rounded ${mergeStatus.includes('✓') ? 'bg-emerald-100 text-emerald-800' : mergeStatus.includes('✗') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {mergeStatus}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(t=> (
          <div key={t.id} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>handleDrop(e,t.id)}>
            <TableCard t={t} onOpen={handleOpen} computeFee={computeTableFeeForTable} />
          </div>
        ))}
      </div>

      <TableModal table={sel} onClose={()=>setSel(null)} />

      {promotions && promotions.length>0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">当前促销</h3>
          <div className="flex gap-2">
            {promotions.map(p=> (
              <div key={p.id} className="px-3 py-2 bg-amber-50 rounded border text-sm">{p.name} — {p.type || p.discount || ''}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
