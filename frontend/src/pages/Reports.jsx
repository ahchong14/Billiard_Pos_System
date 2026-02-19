import React, {useState, useEffect} from 'react'
import { api } from '../api/mockApi'

export default function Reports(){
  const [transactions, setTransactions] = useState([])
  const [dateRange, setDateRange] = useState({start: '', end: ''})
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topItems: []
  })

  useEffect(() => {
    api.listTransactions().then(data => {
      setTransactions(data || [])
      calculateStats(data || [])
    }).catch(() => {})
  }, [])

  function calculateStats(trans) {
    const total = trans.reduce((sum, t) => sum + (t.amount || 0), 0)
    const avg = trans.length > 0 ? total / trans.length : 0
    
    // Calculate top items
    const itemMap = {}
    trans.forEach(t => {
      if (t.items) {
        t.items.forEach(item => {
          itemMap[item.name] = (itemMap[item.name] || 0) + item.qty
        })
      }
    })
    
    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({name, qty}))

    setStats({
      totalRevenue: total,
      totalOrders: trans.length,
      avgOrderValue: avg,
      topItems
    })
  }

  function handleExportCSV() {
    const headers = ['ID', '金额', '支付方式', '日期']
    const rows = transactions.map(t => [
      t.id || '-',
      (t.amount || 0).toFixed(2),
      t.paymentMethod || '-',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString('zh-CN') : '-'
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n')
    
    const blob = new Blob([csv], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="reports py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">报表与分析</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-slate-600">总营收</div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">RM {stats.totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-1">本月</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-slate-600">订单数</div>
            <div className="text-3xl font-bold text-sky-600 mt-2">{stats.totalOrders}</div>
            <div className="text-xs text-slate-500 mt-1">本月</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-slate-600">平均订单值</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">RM {stats.avgOrderValue.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-1">本月</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-slate-600">活跃天数</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">--</div>
            <div className="text-xs text-slate-500 mt-1">开发中</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-3">筛选条件</h3>
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-slate-600">开始日期</label>
              <input 
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                className="w-full mt-1 border rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-600">结束日期</label>
              <input 
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                className="w-full mt-1 border rounded px-3 py-2"
              />
            </div>
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold"
            >
              导出 CSV
            </button>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">日营收趋势</h3>
            <div className="h-64 bg-slate-100 rounded flex items-center justify-center text-slate-500 text-sm">
              [Chart Area - 需集成 Recharts/Chart.js]
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">支付方式分布</h3>
            <div className="h-64 bg-slate-100 rounded flex items-center justify-center text-slate-500 text-sm">
              [Pie Chart Area]
            </div>
          </div>
        </div>

        {/* Top Items */}
        {stats.topItems.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="font-semibold mb-4">热销商品 top 5</h3>
            <div className="space-y-2">
              {stats.topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded text-center text-xs font-semibold text-blue-600">
                    {idx + 1}
                  </div>
                  <span className="flex-1">{item.name}</span>
                  <span className="text-emerald-600 font-semibold">{item.qty} 单</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">最近交易</h3>
          {transactions.length === 0 ? (
            <div className="text-center text-slate-500 py-8">暂无交易记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left">交易ID</th>
                    <th className="px-4 py-2 text-left">台位</th>
                    <th className="px-4 py-2 text-left">金额</th>
                    <th className="px-4 py-2 text-left">支付方式</th>
                    <th className="px-4 py-2 text-left">日期</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(-10).reverse().map(t => (
                    <tr key={t.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs">{(t.id || '-').slice(0, 8)}</td>
                      <td className="px-4 py-2">台 {t.tableId || '-'}</td>
                      <td className="px-4 py-2 text-emerald-600 font-medium">RM {(t.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-2">{t.paymentMethod || '-'}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('zh-CN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
