import React, {useEffect, useState} from 'react'
import { api } from '../api/mockApi'
import { v4 as uuidv4 } from 'uuid'

export default function Reservations(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({name:'', phone:'', date:'', time:'', tableType:'普通', pax: 2, deposit: 0})
  const [tab, setTab] = useState('pending') // pending | completed | cancelled

  useEffect(()=>{ 
    api.listReservations().then(data => setList(data || []))
  },[])

  function handleAdd(e){
    e.preventDefault()
    if (!form.name || !form.phone || !form.date || !form.time) {
      alert('请填写完整信息')
      return
    }
    
    const item = {
      ...form, 
      id: uuidv4(), 
      status: 'pending',
      createdAt: Date.now(),
      reminderSent: false
    }
    
    api.addReservation(item).then(r => {
      setList(prev => [...prev, r])
      alert(`✓ 预约已创建，编号: ${r.id.slice(0,8)}`)
      setForm({name:'', phone:'', date:'', time:'', tableType:'普通', pax: 2, deposit: 0})
    }).catch(err => alert('保存失败: ' + err.message))
  }

  function handleStatusChange(id, newStatus) {
    setList(prev => prev.map(r => r.id === id ? {...r, status: newStatus} : r))
  }

  const filteredList = list.filter(r => r.status === tab)

  return (
    <div className="reservations py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">预约管理</h2>

        {/* Add Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-4">新增预约</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              className="border rounded px-3 py-2" 
              placeholder="客户姓名" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
            <input 
              className="border rounded px-3 py-2" 
              placeholder="电话号码"
              type="tel"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              required
            />
            <input 
              className="border rounded px-3 py-2" 
              type="date" 
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              required
            />
            <input 
              className="border rounded px-3 py-2" 
              type="time"
              value={form.time}
              onChange={e => setForm({...form, time: e.target.value})}
              required
            />
            <input 
              className="border rounded px-3 py-2"
              type="number"
              min="1"
              max="20"
              placeholder="人数"
              value={form.pax}
              onChange={e => setForm({...form, pax: parseInt(e.target.value) || 1})}
            />
            <input 
              className="border rounded px-3 py-2"
              type="number"
              min="0"
              step="10"
              placeholder="定金 (RM)"
              value={form.deposit}
              onChange={e => setForm({...form, deposit: parseFloat(e.target.value) || 0})}
            />
            <select 
              className="border rounded px-3 py-2"
              value={form.tableType}
              onChange={e => setForm({...form, tableType: e.target.value})}
            >
              <option>标准</option>
              <option>豪华</option>
              <option>VIP</option>
            </select>
            <button 
              className="md:col-span-2 bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700" 
              type="submit"
            >
              创建预约
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {['pending', 'completed', 'cancelled'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 border-b-2 font-medium ${
                tab === t 
                  ? 'border-sky-500 text-sky-600' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'pending' ? '待处理' : t === 'completed' ? '已完成' : '已取消'}
              <span className="ml-2 inline-block bg-slate-200 px-2 py-0 rounded-full text-xs">
                {list.filter(r => r.status === t).length}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {filteredList.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded text-center text-slate-600">
            暂无{tab === 'pending' ? '待处理' : tab === 'completed' ? '已完成' : '已取消'}预约
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">客户</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">电话</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">预约时间</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">人数</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">台型</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">定金</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(r => (
                  <tr key={r.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-sm">{r.phone}</td>
                    <td className="px-4 py-3 text-sm">{r.date} {r.time}</td>
                    <td className="px-4 py-3 text-sm">{r.pax} 人</td>
                    <td className="px-4 py-3 text-sm">{r.tableType}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">RM {r.deposit || 0}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {tab === 'pending' && (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleStatusChange(r.id, 'completed')}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs hover:bg-emerald-200"
                          >
                            完成
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, 'cancelled')}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            取消
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
