import React, {useEffect, useState} from 'react'
import { api } from '../api/mockApi'
import { v4 as uuidv4 } from 'uuid'

export default function Members(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({name:'', phone:'', level:'Silver', balance:0, points: 0})
  const [selectedMember, setSelectedMember] = useState(null)
  const [topupAmount, setTopupAmount] = useState(0)

  useEffect(()=>{ api.listMembers().then(data => setList(data || [])) },[])

  function handleAdd(e){
    e.preventDefault()
    if (!form.name || !form.phone) {
      alert('请输入姓名和电话')
      return
    }
    
    const newM = {
      ...form, 
      id: uuidv4(),
      joinDate: new Date().toISOString().split('T')[0],
      lastVisited: null,
      totalSpent: 0,
      tier: 'Silver'
    }
    
    api.addMember(newM).then(m => {
      setList(prev => [...prev, m])
      alert(`✓ 会员已创建`)
      setForm({name:'', phone:'', level:'Silver', balance:0, points: 0})
    }).catch(err => alert('保存失败: ' + err.message))
  }

  function handleTopup(memberId) {
    if (topupAmount <= 0) {
      alert('请输入有效金额')
      return
    }
    
    setList(prev => prev.map(m => 
      m.id === memberId 
        ? {...m, balance: (m.balance || 0) + topupAmount}
        : m
    ))
    
    setSelectedMember(null)
    setTopupAmount(0)
    alert(`✓ 已充值 RM ${topupAmount}`)
  }

  return (
    <div className="members py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">会员管理</h2>

        {/* Add Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-4">创建新会员</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              className="border rounded px-3 py-2" 
              placeholder="姓名"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
            <input 
              className="border rounded px-3 py-2"
              type="tel"
              placeholder="电话号码"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              required
            />
            <select 
              className="border rounded px-3 py-2"
              value={form.level}
              onChange={e => setForm({...form, level: e.target.value})}
            >
              <option value="Silver">银卡</option>
              <option value="Gold">金卡</option>
              <option value="Platinum">铂金卡</option>
            </select>
            <input 
              className="border rounded px-3 py-2"
              type="number"
              min="0"
              step="10"
              placeholder="初始余额 (RM)"
              value={form.balance}
              onChange={e => setForm({...form, balance: parseFloat(e.target.value) || 0})}
            />
            <button 
              className="md:col-span-2 bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700"
              type="submit"
            >
              创建会员
            </button>
          </form>
        </div>

        {/* Members List */}
        {list.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded text-center text-slate-600">
            暂无会员
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">姓名</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">电话</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">等级</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">余额</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">积分</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">消费额</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(m => (
                  <tr key={m.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-sm">{m.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        m.level === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                        m.level === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {m.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">RM {(m.balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">{m.points || 0}</td>
                    <td className="px-4 py-3 text-sm">RM {(m.totalSpent || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <button
                        onClick={() => setSelectedMember(m.id)}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs hover:bg-emerald-200 font-medium"
                      >
                        充值
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topup Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">充值账户</h3>
            <input 
              className="w-full border rounded px-3 py-2 mb-4"
              type="number"
              min="0"
              step="10"
              placeholder="充值金额 (RM)"
              value={topupAmount}
              onChange={e => setTopupAmount(parseFloat(e.target.value) || 0)}
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedMember(null)}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                取消
              </button>
              <button 
                onClick={() => handleTopup(selectedMember)}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold"
              >
                确认充值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
