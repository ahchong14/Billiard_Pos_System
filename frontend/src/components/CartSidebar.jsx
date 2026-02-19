import React, {useState} from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

// Sample menu items - in real app, fetch from backend
const MENU_ITEMS = [
  {id: 1, name: '可乐', price: 5, category: '饮料'},
  {id: 2, name: '咖啡', price: 8, category: '饮料'},
  {id: 3, name: '鸡翅', price: 15, category: '食物'},
  {id: 4, name: '薯条', price: 12, category: '食物'},
  {id: 5, name: '牛奶', price: 6, category: '饮料'},
  {id: 6, name: '汉堡', price: 18, category: '食物'},
]

export default function CartSidebar(){
  const { selectedTableId, cart, removeFromCart, updateCartQty, clearCart, getCartTotal, addToCart } = useApp()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const total = getCartTotal()

  function handleAddItem(item) {
    if (!selectedTableId) {
      alert('请先选择台位')
      return
    }
    addToCart({
      itemId: item.id,
      name: item.name,
      price: item.price,
      qty: 1
    })
  }

  return (
    <aside className="w-80 bg-white rounded-l shadow-lg h-full fixed right-0 top-16 flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">购物车</h3>
          <div className="text-sm bg-sky-100 px-2 py-1 rounded">
            台位 {selectedTableId || '-'}
          </div>
        </div>
      </div>

      {/* Menu/Items Selector */}
      <div className="p-3 border-b bg-slate-50">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="w-full px-3 py-2 bg-sky-500 text-white rounded text-sm font-medium hover:bg-sky-600"
        >
          {showMenu ? '隐藏菜单' : '展开菜单'} ▼
        </button>
        {showMenu && (
          <div className="mt-3 grid grid-cols-2 gap-2 max-h-40 overflow-auto">
            {MENU_ITEMS.map(item => (
              <div key={item.id} className="p-2 bg-white border rounded hover:bg-sky-50 cursor-pointer transition-all" 
                   onClick={() => handleAddItem(item)}>
                <div className="text-xs font-medium">{item.name}</div>
                <div className="text-xs text-slate-600">RM {item.price.toFixed(2)}</div>
                <div className="text-xs text-slate-400 mt-1">{item.category}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-3">
        {cart.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <div className="text-sm">购物车为空</div>
            <div className="text-xs mt-1">从菜单中添加项目</div>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.itemId} className="flex items-start gap-3 p-2 bg-slate-50 rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-slate-600">RM {item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateCartQty(item.itemId, item.qty - 1)}
                    className="px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button 
                    onClick={() => updateCartQty(item.itemId, item.qty + 1)}
                    className="px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.itemId)}
                  className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs hover:bg-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Total and Actions */}
      <div className="p-4 border-t bg-slate-50">
        <div className="flex justify-between items-center mb-3 pb-3 border-b">
          <span className="font-semibold">小计</span>
          <span className="text-lg font-bold text-emerald-600">RM {total.toFixed(2)}</span>
        </div>
        <div className="space-y-2">
          {cart.length > 0 && (
            <button 
              onClick={() => clearCart()}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded hover:bg-slate-100"
            >
              清空购物车
            </button>
          )}
          <button 
            onClick={() => {
              if (cart.length === 0) {
                alert('购物车为空')
                return
              }
              navigate('/checkout')
            }}
            className={`w-full px-3 py-2 rounded font-semibold text-white text-sm ${
              cart.length === 0 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            去结算 → 
          </button>
        </div>
      </div>
    </aside>
  )
}
