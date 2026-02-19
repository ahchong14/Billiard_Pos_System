import React, {useEffect, useState} from 'react'
import { api } from '../api/mockApi'
import { v4 as uuidv4 } from 'uuid'

export default function Inventory(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({name:'', unit: '件', qty: 0, minQty: 5, category: '饮料'})
  const [editingId, setEditingId] = useState(null)
  const [outboundAmount, setOutboundAmount] = useState(0)

  useEffect(()=>{ 
    api.listInventory().then(data => setItems(data || [])).catch(() => {})
  },[])

  function handleAdd(e){
    e.preventDefault()
    if (!form.name || form.qty < 0) {
      alert('请填写正确的物料信息')
      return
    }

    const newItem = {
      ...form,
      id: uuidv4(),
      createdAt: Date.now(),
      lastRestocked: Date.now()
    }

    api.addInventory(newItem).then(i => {
      setItems(prev => [...prev, i])
      alert('✓ 物料已添加')
      setForm({name:'', unit: '件', qty: 0, minQty: 5, category: '饮料'})
    }).catch(err => alert('保存失败: ' + err.message))
  }

  function handleOutbound(itemId) {
    if (outboundAmount <= 0) {
      alert('请输入有效数量')
      return
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.qty - outboundAmount
        if (newQty < 0) {
          alert('库存不足')
          return item
        }
        return {...item, qty: newQty}
      }
      return item
    }))
    setOutboundAmount(0)
    setEditingId(null)
  }

  function handleRestock(itemId) {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? {...item, qty: item.minQty * 3, lastRestocked: Date.now()}
        : item
    ))
  }

  const lowStockItems = items.filter(i => i.qty <= i.minQty)

  return (
    <div className="inventory py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">库存管理</h2>

        {/* Add Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-4">入库新物料</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              className="border rounded px-3 py-2"
              placeholder="物料名称"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
            <input 
              className="border rounded px-3 py-2"
              type="number"
              min="0"
              placeholder="数量"
              value={form.qty}
              onChange={e => setForm({...form, qty: parseInt(e.target.value) || 0})}
              required
            />
            <select 
              className="border rounded px-3 py-2"
              value={form.unit}
              onChange={e => setForm({...form, unit: e.target.value})}
            >
              <option>件</option>
              <option>瓶</option>
              <option>盒</option>
              <option>包</option>
              <option>千克</option>
            </select>
            <select 
              className="border rounded px-3 py-2"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option>饮料</option>
              <option>食物</option>
              <option>用品</option>
              <option>其他</option>
            </select>
            <input 
              className="border rounded px-3 py-2"
              type="number"
              min="1"
              placeholder="最低库存"
              value={form.minQty}
              onChange={e => setForm({...form, minQty: parseInt(e.target.value) || 5})}
            />
            <button 
              className="md:col-span-4 bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700"
              type="submit"
            >
              确认入库
            </button>
          </form>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <div className="text-red-800 font-semibold mb-2">⚠ {lowStockItems.length} 种物料库存低于最低值</div>
            <div className="flex gap-2 flex-wrap">
              {lowStockItems.map(item => (
                <span key={item.id} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                  {item.name}: {item.qty} {item.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inventory List */}
        {items.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded text-center text-slate-600">
            暂无物料
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">物料名称</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">分类</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">当前库存</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">最低值</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">单位</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">状态</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm">{item.category}</td>
                    <td className="px-4 py-3 text-sm font-bold">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.minQty}</td>
                    <td className="px-4 py-3 text-sm">{item.unit}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.qty <= item.minQty 
                          ? 'bg-red-100 text-red-700' 
                          : item.qty <= item.minQty * 2
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.qty <= item.minQty ? '低库存' : item.qty <= item.minQty * 2 ? '预警' : '正常'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {editingId === item.id ? (
                        <div className="flex gap-1 justify-center">
                          <input 
                            type="number"
                            min="0"
                            max={item.qty}
                            value={outboundAmount}
                            onChange={e => setOutboundAmount(parseInt(e.target.value) || 0)}
                            className="w-16 border rounded px-2 py-1 text-xs"
                            placeholder="数量"
                            autoFocus
                          />
                          <button
                            onClick={() => handleOutbound(item.id)}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs hover:bg-emerald-200"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              setOutboundAmount(0)
                            }}
                            className="px-2 py-1 bg-slate-200 rounded text-xs"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setEditingId(item.id)}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            出库
                          </button>
                          <button
                            onClick={() => handleRestock(item.id)}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs hover:bg-emerald-200"
                          >
                            补货
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
