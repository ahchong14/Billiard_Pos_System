import React, {useState} from 'react'
import { useApp } from '../context/AppContext'
import dayjs from 'dayjs'

export default function TableModal({table, onClose}){
  const { startTable, stopTable } = useApp()
  const [extendMin, setExtendMin] = useState(30)

  if(!table) return null

  function handleStart(){
    startTable(table.id)
    onClose()
  }

  function handleStop(){
    stopTable(table.id)
    onClose()
  }

  const started = table.startedAt ? dayjs(table.startedAt).format('HH:mm:ss') : '--'
  const mins = Math.floor((table.elapsedSec||0)/60)
  const secs = (table.elapsedSec||0)%60

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold">桌位 {table.id} - {table.status}</h3>
            <div className="text-sm text-slate-500">开始时间: {started}</div>
          </div>
          <button className="text-slate-400" onClick={onClose}>关闭 ✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 bg-slate-50 p-3 rounded">
            <div className="text-center">
              <div className="text-4xl font-bold">{mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}</div>
              <div className="text-sm text-slate-600 mt-2">RM {((table.elapsedSec||0)/60*0.5).toFixed(2)}</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {table.status !== 'occupied' ? (
                <button className="bg-emerald-600 text-white rounded py-2" onClick={handleStart}>开台 (开始计时)</button>
              ) : (
                <button className="bg-red-600 text-white rounded py-2" onClick={handleStop}>结账并空台</button>
              )}
              <button className="bg-slate-200 rounded py-2" onClick={()=>alert('标记为清理（模拟）')}>标记为清理</button>
              <button className="bg-sky-600 text-white rounded py-2" onClick={()=>alert('呼叫服务（示例）')}>呼叫服务</button>
              <button className="border rounded py-2" onClick={()=>alert('打印账单（示例）')}>打印账单</button>
            </div>
          </div>

          <div className="col-span-2">
            <div>
              <h4 className="font-semibold">顾客与订单</h4>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="flex justify-between"><div className="text-sm text-slate-600">顾客姓名</div><div>—</div></div>
                <div className="flex justify-between"><div className="text-sm text-slate-600">会员等级</div><div>—</div></div>
                <div className="text-sm text-slate-600">订单项（示例）</div>
                <ul className="mt-2 divide-y">
                  <li className="py-2 flex justify-between"><div>可乐 x1</div><div>RM 4.00</div></li>
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">历史记录</h4>
              <div className="mt-2 text-sm text-slate-500">最近操作与账单将显示在这里（示例）。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
