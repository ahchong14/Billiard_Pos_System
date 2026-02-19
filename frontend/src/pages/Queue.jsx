import React, {useEffect, useState} from 'react'
import { api } from '../api/mockApi'
import { v4 as uuidv4 } from 'uuid'

export default function Queue(){
  const [queue, setQueue] = useState([])
  const [form, setForm] = useState({name: '', phone: '', pax: 1})
  const [calledQueue, setCalledQueue] = useState([])

  useEffect(()=>{ 
    api.listQueue().then(data => setQueue(data || [])).catch(() => {})
  },[])

  function handleAdd(e){
    e.preventDefault()
    if (!form.name || !form.phone) {
      alert('请输入姓名和电话号码')
      return
    }

    const item = {
      id: uuidv4(),
      ...form,
      addedAt: Date.now(),
      position: queue.length + 1,
      status: 'waiting'
    }

    api.enqueue(item).then(() => {
      setQueue(prev => [...prev, item])
      alert(`✓ ${form.name} 已加入队列，位置: ${item.position}`)
      setForm({name: '', phone: '', pax: 1})
    }).catch(err => alert('加入失败: ' + err.message))
  }

  function handleCallNext(){
    if (queue.length === 0) {
      alert('队列为空')
      return
    }

    const next = queue[0]
    setCalledQueue(prev => [...prev, {...next, calledAt: Date.now()}])
    alert(`✓ 已通知 ${next.name}\\n电话: ${next.phone}\\n人数: ${next.pax}`)
    
    api.dequeue(next.id).then(() => {
      setQueue(prev => prev.slice(1).map((item, idx) => ({...item, position: idx + 1})))
    }).catch(err => alert('操作失败: ' + err.message))
  }

  function handleSkip(id) {
    if (confirm('将此客户移到队列末尾?')) {
      const skipped = queue.find(q => q.id === id)
      setQueue(prev => {
        const filtered = prev.filter(q => q.id !== id)
        return [...filtered, {...skipped, position: filtered.length + 1}]
      })
    }
  }

  function handleRemove(id) {
    if (confirm('将此客户从队列删除?')) {
      setQueue(prev => prev.filter(q => q.id !== id).map((item, idx) => ({...item, position: idx + 1})))
    }
  }

  return (
    <div className="queue py-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">等候队列</h2>

        {/* Add to Queue Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-4">加入等候队列</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text"
              placeholder="顾客姓名"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input 
              type="tel"
              placeholder="联系电话"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input 
              type="number"
              min="1"
              max="20"
              placeholder="人数"
              value={form.pax}
              onChange={e => setForm({...form, pax: parseInt(e.target.value) || 1})}
              className="border rounded px-3 py-2"
            />
            <button 
              type="submit"
              className="bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700"
            >
              加入队列
            </button>
          </form>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">等候人数</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{queue.length}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-700">已通知</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{calledQueue.length}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-700">平均等候</div>
            <div className="text-3xl font-bold text-slate-600 mt-2">--</div>
          </div>
        </div>

        {/* Waiting Queue */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">当前队列</h3>
            {queue.length > 0 && (
              <button 
                onClick={handleCallNext}
                className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700"
              >
                ► 通知下一位
              </button>
            )}
          </div>
          {queue.length === 0 ? (
            <div className="p-8 text-center text-slate-500">暂无等候客户</div>
          ) : (
            <ul className="divide-y">
              {queue.map((q, idx) => (
                <li key={q.id} className="px-4 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-600">
                      {q.position}
                    </div>
                    <div>
                      <div className="font-medium">{q.name}</div>
                      <div className="text-xs text-slate-500">{q.phone} · {q.pax} 人 · 加入于 {new Date(q.addedAt).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {idx === 0 && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">下一位</span>
                    )}
                    <button
                      onClick={() => handleSkip(q.id)}
                      className="px-3 py-1 text-xs border rounded hover:bg-slate-100"
                    >
                      后移
                    </button>
                    <button
                      onClick={() => handleRemove(q.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Called Queue */}
        {calledQueue.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold">已通知客户</h3>
            </div>
            <ul className="divide-y">
              {calledQueue.slice(-10).reverse().map(q => (
                <li key={q.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{q.name}</span>
                    <span className="text-slate-600 ml-2">通知于 {new Date(q.calledAt).toLocaleTimeString('zh-CN')}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
