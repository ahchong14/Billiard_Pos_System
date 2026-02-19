import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Checkout(){
  const navigate = useNavigate()
  const { selectedTableId, tables, cart, getCartTotal, clearCart, submitOrder } = useApp()
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isProcessing, setIsProcessing] = useState(false)

  const table = tables.find(t => t.id === selectedTableId)
  if (!table) {
    return (
      <div className="checkout py-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
          <div className="text-red-600">未选择台位或台位不存在</div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            返回桌位地图
          </button>
        </div>
      </div>
    )
  }

  const minutes = Math.ceil((table.elapsedSec||0)/60)
  const ratePerMin = 0.5 // RM per minute
  const tableFee = minutes * ratePerMin
  const cartTotal = getCartTotal()
  const subtotal = tableFee + cartTotal
  const total = Math.max(0, subtotal - discount)

  async function handlePay(){
    if (cart.length === 0 && table.status !== 'occupied') {
      alert('没有应收项目')
      return
    }

    setIsProcessing(true)
    const success = await submitOrder(paymentMethod)
    
    if (success) {
      alert(`✓ 支付成功\n方式: ${paymentMethod}\n金额: RM ${total.toFixed(2)}`)
      // Reset table after checkout
      clearCart()
      navigate('/dashboard')
    } else {
      alert('⚠ 订单保存失败，请检查后端连接')
    }
    setIsProcessing(false)
  }

  return (
    <div className="checkout py-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">结账 - 台位 {table.id}</h2>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-3 py-2 border rounded hover:bg-slate-50"
            >
              返回
            </button>
          </div>

          {/* Table Usage Fee */}
          <div className="border-b pb-4 mb-4">
            <h3 className="font-semibold mb-3">台位费用</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>使用时长</span>
                <span className="font-medium">{minutes} 分钟</span>
              </div>
              <div className="flex justify-between">
                <span>单价</span>
                <span>RM {ratePerMin.toFixed(2)} / 分钟</span>
              </div>
              <div className="flex justify-between bg-blue-50 p-2 rounded font-medium">
                <span>台位小计</span>
                <span>RM {tableFee.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold mb-3">订单项目</h3>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <span>{item.name} × {item.qty}</span>
                    <span>RM {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between bg-green-50 p-2 rounded font-medium mt-2">
                <span>订单小计</span>
                <span>RM {cartTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Discount */}
          <div className="border-b pb-4 mb-4">
            <h3 className="font-semibold mb-3">优惠</h3>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="优惠金额"
                className="flex-1 px-3 py-2 border rounded"
              />
              <span className="px-3 py-2">RM</span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-emerald-50 p-4 rounded mb-6">
            <div className="flex justify-between text-lg font-bold">
              <span>合计应收</span>
              <span className="text-emerald-600">RM {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">支付方式</h3>
            <div className="grid grid-cols-2 gap-3">
              {['cash', 'card', 'ewallet', 'transfer'].map(method => (
                <label key={method} className="flex items-center p-3 border rounded cursor-pointer hover:bg-blue-50" style={{borderColor: paymentMethod === method ? '#0284c7' : '#e2e8f0', backgroundColor: paymentMethod === method ? '#f0f9ff' : 'white'}}>
                  <input 
                    type="radio" 
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    {method === 'cash' ? '现金' : method === 'card' ? '刷卡' : method === 'ewallet' ? '电子钱包' : '银行转账'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-3 border rounded font-semibold hover:bg-slate-50"
            >
              取消
            </button>
            <button 
              onClick={handlePay}
              disabled={isProcessing}
              className={`flex-1 px-4 py-3 rounded text-white font-semibold ${
                isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isProcessing ? '处理中...' : `确认支付 RM ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
