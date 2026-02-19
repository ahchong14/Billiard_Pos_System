import React, {useEffect, useState} from 'react'
import { api } from '../api/mockApi'

export default function Transactions(){
  const [list, setList] = useState([])
  const [filterType, setFilterType] = useState('all') // all | income | expense
  const [searchInput, setSearchInput] = useState('')

  useEffect(()=>{ 
    api.listTransactions().then(data => setList(data || [])).catch(() => {})
  },[])

  function handleExportCSV() {
    const headers = ['时间', '类型', '支付方式', '金额', '台位ID', '备注']
    const rows = filteredList.map(t => [
      t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '-',
      t.type || 'order',
      t.paymentMethod || '-',
      (t.amount || 0).toFixed(2),
      t.tableId || '-',
      t.remark || '-'
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n')
    
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const filteredList = list.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (searchInput && !JSON.stringify(t).toLowerCase().includes(searchInput.toLowerCase())) return false
    return true
  })

  const stats = {
    totalIncome: filteredList.filter(t => (t.amount || 0) > 0).reduce((sum, t) => sum + t.amount, 0),
    totalExpense: filteredList.filter(t => (t.amount || 0) < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalTransactions: filteredList.length
  }

  return (
    <div className="transactions py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">交易流水</h2>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold"
          >
            导出 CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div className="text-sm text-emerald-700">总收入</div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">RM {stats.totalIncome.toFixed(2)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-700">总支出</div>
            <div className="text-2xl font-bold text-red-600 mt-2">RM {stats.totalExpense.toFixed(2)}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">总交易数</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{stats.totalTransactions}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex gap-2 flex-wrap">
              {['all', 'order', 'topup', 'refund'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded font-medium text-sm ${
                    filterType === type
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type === 'all' ? '全部' : type === 'order' ? '订单' : type === 'topup' ? '充值' : '退款'}
                </button>
              ))}
            </div>
            <input 
              className="flex-1 border rounded px-3 py-2"
              placeholder="搜索交易 (金额、台位、备注...)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Transactions List */}
        {filteredList.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded text-center text-slate-600">
            暂无交易记录
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">时间</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">类型</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">支付方式</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">台位</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">金额</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">备注</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(t => (
                  <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={`px-2 py-1 rounded text-xs ${
                        t.type === 'order' ? 'bg-blue-100 text-blue-700' :
                        t.type === 'topup' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.type === 'order' ? '订单' : t.type === 'topup' ? '充值' : t.type || '其他'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{t.paymentMethod || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">台 {t.tableId || '-'}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${
                      (t.amount || 0) > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {(t.amount || 0) > 0 ? '+' : ''} RM {Math.abs(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.remark || '-'}</td>
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
