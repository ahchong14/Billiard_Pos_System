// API Layer: REST endpoints > localStorage fallback
// Now connected to MySQL via Express backend

const BASE = 'http://localhost:3001'  // backend URL
const FALLBACK = {
  TABLES: 'pool_tables_v1',
  RESERVATIONS: 'pool_reservations_v1',
  MEMBERS: 'pool_members_v1',
  INVENTORY: 'pool_inventory_v1',
  STAFF: 'pool_staff_v1',
  TRANSACTIONS: 'pool_transactions_v1',
  QUEUE: 'pool_queue_v1',
  RATES: 'pool_rates_v1',
  SETTINGS: 'pool_settings_v1'
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

async function tryFetch(url, opts) {
  try {
    opts = opts || {}
    // attach dev auth headers (reads from localStorage.app_user JSON if present)
    const dev = (() => {
      try{
        const raw = localStorage.getItem('app_user')
        return raw ? JSON.parse(raw) : null
      }catch(e){ return null }
    })()
    const authHeaders = dev ? {
      'x-user-role': dev.role || 'Staff',
      'x-user-id': dev.id || '',
      'x-user-name': dev.name || ''
    } : { 'x-user-role': 'Admin' }
    opts.headers = {...(opts.headers||{}), ...authHeaders}
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn('API 请求失败:', url, e.message)
    throw e
  }
}

const headers = {
  'Content-Type': 'application/json'
}

export const api = {
  // ==================== 台位 ====================
  async listTables() {
    try {
      return await tryFetch(BASE + '/api/tables')
    } catch (e) {
      return read(FALLBACK.TABLES, [])
    }
  },

  async updateTableState(id, body) {
    try {
      return await tryFetch(BASE + '/api/tables/' + id + '/state', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
    } catch (e) {
      const arr = read(FALLBACK.TABLES, [])
      const t = arr.find(x => x.id === id)
      if (t) {
        Object.assign(t, body)
        write(FALLBACK.TABLES, arr)
        return t
      }
      return null
    }
  },

  async mergeTables(primaryId, secondaryIds) {
    try {
      return await tryFetch(BASE + '/api/tables/merge', {
        method: 'POST',
        headers,
        body: JSON.stringify({ primaryTableId: primaryId, secondaryTableIds: secondaryIds })
      })
    } catch (e) {
      throw new Error('合并失败: ' + e.message)
    }
  },

  async unmergeTables(tableId) {
    try {
      return await tryFetch(BASE + '/api/tables/' + tableId + '/unmerge', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
    } catch (e) {
      throw new Error('解除合并失败: ' + e.message)
    }
  },

  // ==================== 预约 ====================
  async listReservations() {
    try {
      return await tryFetch(BASE + '/api/reservations')
    } catch (e) {
      return read(FALLBACK.RESERVATIONS, [])
    }
  },

  async addReservation(r) {
    try {
      return await tryFetch(BASE + '/api/reservations', {
        method: 'POST',
        headers,
        body: JSON.stringify(r)
      })
    } catch (e) {
      const arr = read(FALLBACK.RESERVATIONS, [])
      arr.push(r)
      write(FALLBACK.RESERVATIONS, arr)
      return r
    }
  },

  async updateReservationStatus(id, status) {
    try {
      return await tryFetch(BASE + '/api/reservations/' + id + '/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({ status })
      })
    } catch (e) {
      throw new Error('更新预约状态失败: ' + e.message)
    }
  },

  // ==================== 会员 ====================
  async listMembers() {
    try {
      return await tryFetch(BASE + '/api/members')
    } catch (e) {
      return read(FALLBACK.MEMBERS, [])
    }
  },

  async addMember(m) {
    try {
      return await tryFetch(BASE + '/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify(m)
      })
    } catch (e) {
      const arr = read(FALLBACK.MEMBERS, [])
      arr.push(m)
      write(FALLBACK.MEMBERS, arr)
      return m
    }
  },

  async topupMember(memberId, amount) {
    try {
      return await tryFetch(BASE + '/api/members/' + memberId + '/topup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount })
      })
    } catch (e) {
      throw new Error('充值失败: ' + e.message)
    }
  },

  // ==================== 库存 ====================
  async listInventory() {
    try {
      return await tryFetch(BASE + '/api/inventory')
    } catch (e) {
      return read(FALLBACK.INVENTORY, [])
    }
  },

  async addInventory(it) {
    try {
      return await tryFetch(BASE + '/api/inventory', {
        method: 'POST',
        headers,
        body: JSON.stringify(it)
      })
    } catch (e) {
      const arr = read(FALLBACK.INVENTORY, [])
      arr.push(it)
      write(FALLBACK.INVENTORY, arr)
      return it
    }
  },

  async outboundInventory(itemId, amount) {
    try {
      return await tryFetch(BASE + '/api/inventory/' + itemId + '/outbound', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount })
      })
    } catch (e) {
      throw new Error('出库失败: ' + e.message)
    }
  },

  async restockInventory(itemId) {
    try {
      return await tryFetch(BASE + '/api/inventory/' + itemId + '/restock', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
    } catch (e) {
      throw new Error('补货失败: ' + e.message)
    }
  },

  // ==================== 交易 ====================
  async listTransactions() {
    try {
      return await tryFetch(BASE + '/api/transactions')
    } catch (e) {
      return read(FALLBACK.TRANSACTIONS, [])
    }
  },

  async addTransaction(t) {
    try {
      return await tryFetch(BASE + '/api/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify(t)
      })
    } catch (e) {
      const arr = read(FALLBACK.TRANSACTIONS, [])
      arr.push(t)
      write(FALLBACK.TRANSACTIONS, arr)
      return t
    }
  },

  async getTransactionStats() {
    try {
      return await tryFetch(BASE + '/api/transactions/stats')
    } catch (e) {
      return { totalTransactions: 0, totalRevenue: 0, avgOrderValue: 0, activeDays: 0 }
    }
  },

  async exportTransactionsCsv() {
    try {
      const res = await fetch(BASE + '/api/transactions/export/csv')
      const filename = 'transactions_' + new Date().toISOString().slice(0, 10) + '.csv'
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (e) {
      throw new Error('导出失败: ' + e.message)
    }
  },

  // ==================== 队列 ====================
  async listQueue() {
    try {
      return await tryFetch(BASE + '/api/queue')
    } catch (e) {
      return read(FALLBACK.QUEUE, [])
    }
  },

  async enqueue(q) {
    try {
      return await tryFetch(BASE + '/api/queue', {
        method: 'POST',
        headers,
        body: JSON.stringify(q)
      })
    } catch (e) {
      const arr = read(FALLBACK.QUEUE, [])
      arr.push(q)
      write(FALLBACK.QUEUE, arr)
      return q
    }
  },

  async callNext() {
    try {
      return await tryFetch(BASE + '/api/queue/call-next', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
    } catch (e) {
      throw new Error('通知失败: ' + e.message)
    }
  },

  async dequeue(id) {
    try {
      return await tryFetch(BASE + '/api/queue/' + id, { method: 'DELETE' })
    } catch (e) {
      let arr = read(FALLBACK.QUEUE, [])
      arr = arr.filter(x => x.id !== id)
      write(FALLBACK.QUEUE, arr)
    }
  },

  // ==================== 员工 ====================
  async listStaff() {
    try {
      return await tryFetch(BASE + '/api/staff')
    } catch (e) {
      return read(FALLBACK.STAFF, [])
    }
  },

  async addStaff(s) {
    try {
      return await tryFetch(BASE + '/api/staff', {
        method: 'POST',
        headers,
        body: JSON.stringify(s)
      })
    } catch (e) {
      const arr = read(FALLBACK.STAFF, [])
      arr.push(s)
      write(FALLBACK.STAFF, arr)
      return s
    }
  },

  async updateStaffStatus(id, status) {
    try {
      return await tryFetch(BASE + '/api/staff/' + id + '/status', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      })
    } catch (e) {
      throw new Error('更新员工状态失败: ' + e.message)
    }
  },

  async deleteStaff(id) {
    try {
      return await tryFetch(BASE + '/api/staff/' + id, { method: 'DELETE' })
    } catch (e) {
      const arr = read(FALLBACK.STAFF, [])
      const idx = arr.findIndex(x => x.id === id)
      if (idx >= 0) arr.splice(idx, 1)
      write(FALLBACK.STAFF, arr)
    }
  },

  // ==================== 计费策略 ====================
  async listRates() {
    try {
      return await tryFetch(BASE + '/api/rates')
    } catch (e) {
      return read(FALLBACK.RATES, [])
    }
  },

  async addRate(r) {
    try {
      return await tryFetch(BASE + '/api/rates', {
        method: 'POST',
        headers,
        body: JSON.stringify(r)
      })
    } catch (e) {
      const arr = read(FALLBACK.RATES, [])
      arr.push(r)
      write(FALLBACK.RATES, arr)
      return r
    }
  },

  async deleteRate(id) {
    try {
      return await tryFetch(BASE + '/api/rates/' + id, { method: 'DELETE' })
    } catch (e) {
      const arr = read(FALLBACK.RATES, [])
      const idx = arr.findIndex(x => x.id === id)
      if (idx >= 0) arr.splice(idx, 1)
      write(FALLBACK.RATES, arr)
    }
  },

  // ==================== 计费规则 (Pricing rules)
  async listPricing() {
    try {
      return await tryFetch(BASE + '/api/pricing')
    } catch (e) {
      return []
    }
  },

  async addPricing(p) {
    try {
      return await tryFetch(BASE + '/api/pricing', {
        method: 'POST',
        headers,
        body: JSON.stringify(p)
      })
    } catch (e) {
      throw new Error('添加计费规则失败: ' + e.message)
    }
  },
  async updatePricing(id, p) {
    try {
      return await tryFetch(BASE + '/api/pricing/' + id, {
        method: 'PUT',
        headers,
        body: JSON.stringify(p)
      })
    } catch (e) {
      throw new Error('更新计费规则失败: ' + e.message)
    }
  },

  async deletePricing(id) {
    try {
      return await tryFetch(BASE + '/api/pricing/' + id, { method: 'DELETE' })
    } catch (e) {
      throw new Error('删除计费规则失败: ' + e.message)
    }
  },

  // ==================== 会员等级 (Membership tiers)
  async listMembershipTiers() {
    try {
      return await tryFetch(BASE + '/api/membership/tiers')
    } catch (e) {
      return []
    }
  },

  async addMembershipTier(tier) {
    try {
      return await tryFetch(BASE + '/api/membership/tiers', {
        method: 'POST',
        headers,
        body: JSON.stringify(tier)
      })
    } catch (e) {
      throw new Error('添加会员等级失败: ' + e.message)
    }
  },

  // ==================== 促销 (Promotions)
  async listPromotions() {
    try {
      return await tryFetch(BASE + '/api/promotions')
    } catch (e) {
      return []
    }
  },

  async addPromotion(promo) {
    try {
      return await tryFetch(BASE + '/api/promotions', {
        method: 'POST',
        headers,
        body: JSON.stringify(promo)
      })
    } catch (e) {
      throw new Error('添加促销失败: ' + e.message)
    }
  },

  async deletePromotion(id) {
    try {
      return await tryFetch(BASE + '/api/promotions/' + id, { method: 'DELETE' })
    } catch (e) {
      throw new Error('删除促销失败: ' + e.message)
    }
  },

  // ==================== 系统设置 ====================
  async listSettings() {
    try {
      return await tryFetch(BASE + '/api/settings')
    } catch (e) {
      return read(FALLBACK.SETTINGS, {})
    }
  },

  async saveSetting(key, value, category = 'general') {
    try {
      return await tryFetch(BASE + '/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value, category })
      })
    } catch (e) {
      const obj = read(FALLBACK.SETTINGS, {})
      obj[key] = value
      write(FALLBACK.SETTINGS, obj)
      return { key, value }
    }
  },

  // ==================== 商户信息 (Business) ====================
  async getBusiness() {
    try {
      return await tryFetch(BASE + '/api/business')
    } catch (e) {
      return read(FALLBACK.SETTINGS, {})
    }
  },

  async saveBusiness(biz) {
    try {
      return await tryFetch(BASE + '/api/business', {
        method: 'POST',
        headers,
        body: JSON.stringify(biz)
      })
    } catch (e) {
      const obj = read(FALLBACK.SETTINGS, {})
      Object.assign(obj, biz)
      write(FALLBACK.SETTINGS, obj)
      return obj
    }
  },

  // ==================== 菜单 ====================
  async listMenu() {
    try {
      return await tryFetch(BASE + '/api/menu')
    } catch (e) {
      return [
        { id: 1, name: '可乐', price: 5, category: '饮料' },
        { id: 2, name: '雪碧', price: 5, category: '饮料' },
        { id: 3, name: '咖啡', price: 8, category: '饮料' },
        { id: 4, name: '鸡翅', price: 25, category: '食物' }
      ]
    }
  },

  async addMenuItem(m) {
    try {
      return await tryFetch(BASE + '/api/menu', {
        method: 'POST',
        headers,
        body: JSON.stringify(m)
      })
    } catch (e) {
      throw new Error('添加菜单项失败: ' + e.message)
    }
  }
}


