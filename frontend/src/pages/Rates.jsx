import React, {useState} from 'react'

export default function Rates(){
  const [rates, setRates] = useState([
    {id: 1, name: '标准', baseRate: 0.50, period: '10:00-18:00', multiplier: 1.0},
    {id: 2, name: '黄金', baseRate: 0.75, period: '18:00-22:00', multiplier: 1.5},
    {id: 3, name: '夜间', baseRate: 0.60, period: '22:00-06:00', multiplier: 1.2},
  ])
  const [newRate, setNewRate] = useState({name: '', baseRate: 0.5, period: '', multiplier: 1.0})
  const [editingId, setEditingId] = useState(null)

  function handleAddRate(e) {
    e.preventDefault()
    if (!newRate.name || !newRate.period) {
      alert('请填写完整信息')
      return
    }
    setRates([...rates, {...newRate, id: Date.now()}])
    setNewRate({name: '', baseRate: 0.5, period: '', multiplier: 1.0})
  }

  function handleDeleteRate(id) {
    if (confirm('确认删除此费率?')) {
      setRates(rates.filter(r => r.id !== id))
    }
  }

  return (
    <div className="rates py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">计费策略管理</h2>

        {/* Add New Rate */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-4">新增计费策略</h3>
          <form onSubmit={handleAddRate} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input 
              type="text"
              placeholder="策略名称 (如：标准时段)"
              value={newRate.name}
              onChange={e => setNewRate({...newRate, name: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input 
              type="number"
              step="0.01"
              min="0"
              placeholder="基础费率 (RM/分钟)"
              value={newRate.baseRate}
              onChange={e => setNewRate({...newRate, baseRate: parseFloat(e.target.value) || 0})}
              className="border rounded px-3 py-2"
              required
            />
            <input 
              type="text"
              placeholder="时段 (如：10:00-18:00)"
              value={newRate.period}
              onChange={e => setNewRate({...newRate, period: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input 
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              placeholder="倍率 (1.0 = 基础价)"
              value={newRate.multiplier}
              onChange={e => setNewRate({...newRate, multiplier: parseFloat(e.target.value) || 1.0})}
              className="border rounded px-3 py-2"
            />
            <button 
              type="submit"
              className="bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700"
            >
              添加
            </button>
          </form>
        </div>

        {/* Rates List */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">策略名称</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">基础费率</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">时段</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">倍率</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">实际费率</th>
                <th className="px-4 py-2 text-center text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm">RM {r.baseRate.toFixed(2)}/分钟</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.period}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{r.multiplier.toFixed(1)}x</td>
                  <td className="px-4 py-3 text-sm text-emerald-600 font-bold">
                    RM {(r.baseRate * r.multiplier).toFixed(2)}/分钟
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <button
                      onClick={() => handleDeleteRate(r.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reference Price List */}
        <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-4 text-blue-900">💡 参考价格</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rates.map(r => {
              const actualRate = r.baseRate * r.multiplier
              return (
                <div key={r.id} className="bg-white p-3 rounded">
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{r.period}</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div>15分钟: RM {(15 * actualRate).toFixed(2)}</div>
                    <div>30分钟: RM {(30 * actualRate).toFixed(2)}</div>
                    <div>1小时: RM {(60 * actualRate).toFixed(2)}</div>
                    <div>2小时: RM {(120 * actualRate).toFixed(2)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
