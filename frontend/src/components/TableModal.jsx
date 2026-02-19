import React, {useMemo, useState} from 'react'
import { useApp } from '../context/AppContext'
import dayjs from 'dayjs'

function ReceiptPreview({table, fee, onClose, onConfirm}){
  const serviceTime = table.startedAt
    ? `${dayjs(table.startedAt).format('YYYY-MM-DD HH:mm:ss')} - ${dayjs().format('HH:mm:ss')}`
    : '未开始计时'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-xl font-semibold">打印预览（Receipt）</h4>
          <button className="text-slate-400" onClick={onClose}>关闭 ✕</button>
        </div>

        <div className="border rounded p-4 font-mono text-sm bg-slate-50">
          <div className="text-center font-semibold">Billiard POS</div>
          <div className="text-center">Table #{table.id} Receipt</div>
          <div className="my-2 border-t border-dashed" />
          <div className="flex justify-between"><span>单号</span><span>{table.currentSessionId || '-'}</span></div>
          <div className="flex justify-between"><span>开台时间段</span><span>{serviceTime}</span></div>
          <div className="flex justify-between"><span>计时分钟</span><span>{fee.minutes} min</span></div>
          <div className="flex justify-between"><span>费率</span><span>RM {fee.ratePerMin.toFixed(2)}/min</span></div>
          <div className="my-2 border-t border-dashed" />
          <div className="flex justify-between"><span>小计</span><span>RM {fee.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>服务费</span><span>RM {fee.serviceFee.toFixed(2)}</span></div>
          <div className="my-2 border-t border-dashed" />
          <div className="flex justify-between font-semibold"><span>总计</span><span>RM {fee.total.toFixed(2)}</span></div>
          <div className="mt-3 text-center text-xs text-slate-500">Thank you and see you again.</div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 border rounded hover:bg-slate-50" onClick={onClose}>返回</button>
          <button className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={onConfirm}>确认打印</button>
        </div>
      </div>
    </div>
  )
}

export default function TableModal({table, onClose}){
  const {
    startTable,
    stopTable,
    markTableCleaning,
    clearTableCleaning,
    requestTableService,
    resolveTableService,
    computeTableFeeForTable
  } = useApp()
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)

  if(!table) return null

  function handleStart(){
    startTable(table.id)
    onClose()
  }

  function handleStop(){
    stopTable(table.id)
    onClose()
  }

  function handleCleaning(){
    if(table.status === 'cleaning'){
      clearTableCleaning(table.id)
      return
    }
    markTableCleaning(table.id)
  }

  function handleService(){
    if(table.serviceRequestedAt){
      resolveTableService(table.id)
      return
    }
    requestTableService(table.id)
  }

  function confirmPrint(){
    setPrintPreviewOpen(false)
    window.print()
  }

  const started = table.startedAt ? dayjs(table.startedAt).format('HH:mm:ss') : '--'
  const mins = Math.floor((table.elapsedSec||0)/60)
  const secs = (table.elapsedSec||0)%60
  const fee = useMemo(()=>computeTableFeeForTable(table), [computeTableFeeForTable, table])

  const orderSample = [
    { id: 'cola', name: '可乐', qty: 1, price: 4 },
    { id: 'snack', name: '花生小食', qty: 1, price: 6 }
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-semibold">桌位 {table.id} - {table.status}</h3>
              <div className="text-sm text-slate-500">开始时间: {started}</div>
              {table.serviceRequestedAt && (
                <div className="text-xs mt-1 text-amber-600">服务请求时间: {dayjs(table.serviceRequestedAt).format('HH:mm:ss')}</div>
              )}
            </div>
            <button className="text-slate-400" onClick={onClose}>关闭 ✕</button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 bg-slate-50 p-3 rounded">
              <div className="text-center">
                <div className="text-4xl font-bold">{mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}</div>
                <div className="text-sm text-slate-600 mt-2">RM {fee.total.toFixed(2)}</div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {table.status !== 'occupied' ? (
                  <button className="bg-emerald-600 text-white rounded py-2" onClick={handleStart}>开台 (开始计时)</button>
                ) : (
                  <button className="bg-red-600 text-white rounded py-2" onClick={handleStop}>结账并空台</button>
                )}
                <button className="bg-slate-200 rounded py-2" onClick={handleCleaning}>
                  {table.status === 'cleaning' ? '清理完成' : '标记为清理'}
                </button>
                <button className="bg-sky-600 text-white rounded py-2" onClick={handleService}>
                  {table.serviceRequestedAt ? '已响应服务' : '呼叫服务'}
                </button>
                <button className="border rounded py-2" onClick={()=>setPrintPreviewOpen(true)}>打印账单</button>
              </div>
            </div>

            <div className="col-span-2">
              <div>
                <h4 className="font-semibold">顾客与订单</h4>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <div className="flex justify-between"><div className="text-sm text-slate-600">顾客姓名</div><div>散客</div></div>
                  <div className="flex justify-between"><div className="text-sm text-slate-600">会员等级</div><div>普通</div></div>
                  <div className="text-sm text-slate-600">订单项（样本）</div>
                  <ul className="mt-2 divide-y">
                    {orderSample.map(item=> (
                      <li key={item.id} className="py-2 flex justify-between">
                        <div>{item.name} x{item.qty}</div>
                        <div>RM {(item.price * item.qty).toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold">历史记录</h4>
                <div className="mt-2 text-sm text-slate-600 max-h-36 overflow-auto divide-y border rounded">
                  {(table.activityLogs || []).length === 0 ? (
                    <div className="p-2 text-slate-500">暂无记录</div>
                  ) : (
                    table.activityLogs.map(log=> (
                      <div key={log.id} className="p-2 flex justify-between gap-2">
                        <span>{log.message}</span>
                        <span className="text-slate-400 whitespace-nowrap">{dayjs(log.timestamp).format('HH:mm:ss')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {printPreviewOpen && (
        <ReceiptPreview table={table} fee={fee} onClose={()=>setPrintPreviewOpen(false)} onConfirm={confirmPrint} />
      )}
    </>
  )
}
