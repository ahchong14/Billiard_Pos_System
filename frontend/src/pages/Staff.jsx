import React, {useEffect, useState} from 'react'
import { api } from '../api/mockApi'
import { v4 as uuidv4 } from 'uuid'

export default function Staff(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({name:'', phone:'', role:'cashier', salary: 0, hireDate: new Date().toISOString().split('T')[0]})
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{ 
    api.listStaff().then(data => setList(data || [])).catch(() => {})
  },[])

  function handleAdd(e){
    e.preventDefault()
    if (!form.name || !form.phone) {
      alert('请填写姓名和电话')
      return
    }

    const newStaff = {
      ...form,
      id: uuidv4(),
      status: 'active',
      createdAt: Date.now(),
      commission: 0,
      totalSales: 0
    }

    api.addStaff(newStaff).then(s => {
      setList(prev => [...prev, s])
      alert('✓ 员工已添加')
      setForm({name:'', phone:'', role:'cashier', salary: 0, hireDate: new Date().toISOString().split('T')[0]})
    }).catch(err => alert('保存失败: ' + err.message))
  }

  function handleStatusChange(id, newStatus) {
    setList(prev => prev.map(s => s.id === id ? {...s, status: newStatus} : s))
  }

  function handleDelete(id) {
    if (confirm('确认删除此员工?')) {
      setList(prev => prev.filter(s => s.id !== id))
    }
  }

  const roles = {
    cashier: '收银员',
    waiter: '服务员',
    manager: '店长',
    admin: '管理员'
  }

  const activeStaff = list.filter(s => s.status !== 'inactive')
  const inactiveStaff = list.filter(s => s.status === 'inactive')

  return (
    <div className="staff py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">员工管理</h2>

        {/* Add Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-4">添加新员工</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="cashier">收银员</option>
              <option value="waiter">服务员</option>
              <option value="manager">店长</option>
              <option value="admin">管理员</option>
            </select>
            <input 
              className="border rounded px-3 py-2"
              type="number"
              min="0"
              placeholder="月薪 (RM)"
              value={form.salary}
              onChange={e => setForm({...form, salary: parseFloat(e.target.value) || 0})}
            />
            <input 
              className="border rounded px-3 py-2"
              type="date"
              value={form.hireDate}
              onChange={e => setForm({...form, hireDate: e.target.value})}
            />
            <button 
              className="md:col-span-4 bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700"
              type="submit"
            >
              添加员工
            </button>
          </form>
        </div>

        {/* Active Staff */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">在职员工 ({activeStaff.length})</h3>
          {activeStaff.length === 0 ? (
            <div className="bg-slate-50 p-6 rounded text-center text-slate-600">暂无在职员工</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">姓名</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">职位</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">电话</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">月薪</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">佣金</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">累计销售</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map(s => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{roles[s.role] || s.role}</td>
                      <td className="px-4 py-3 text-sm">{s.phone}</td>
                      <td className="px-4 py-3 text-sm">RM {(s.salary || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600">RM {(s.commission || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">RM {(s.totalSales || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        <button
                          onClick={() => handleStatusChange(s.id, 'inactive')}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                        >
                          离职
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inactive Staff */}
        {inactiveStaff.length > 0 && (
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">已离职员工 ({inactiveStaff.length})</h3>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">姓名</th>
                    <th className="px-4 py-2 text-left font-semibold">职位</th>
                    <th className="px-4 py-2 text-left font-semibold">最后销售</th>
                    <th className="px-4 py-2 text-center font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveStaff.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">{roles[s.role] || s.role}</td>
                      <td className="px-4 py-3 text-slate-600">RM {(s.totalSales || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleStatusChange(s.id, 'active')}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                          >
                            重新聘用
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="px-2 py-1 bg-slate-200 rounded hover:bg-slate-300 text-xs"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
