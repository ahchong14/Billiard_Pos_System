const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { WebSocketServer } = require('ws')
const { stringify } = require('csv-stringify/sync')

// MySQL 服务导入
const {
  TableService,
  ReservationService,
  MemberService,
  InventoryService,
  TransactionService,
  QueueService,
  StaffService,
  RateService,
  SettingService,
  MenuService,
  BusinessService,
  PricingService,
  MembershipTierService,
  HolidayService,
  PromotionService,
  RoleService,
  AuditService,
  HardwareService
} = require('./db/services')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// 简易认证与 RBAC 中间件 (基于请求头, 可替换为真实认证)
app.use((req, res, next) => {
  const userId = req.header('x-user-id') || null;
  const username = req.header('x-user-name') || 'anonymous';
  const role = req.header('x-user-role') || 'Staff';
  req.user = { id: userId, name: username, role };
  next();
});

// 权限检查: requirePermission('manage_prices')
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role || 'Staff';
      if (userRole === 'Admin') return next();

      // 快速检查：RoleService 查询
      const roles = await RoleService.list();
      const found = roles.find(r => r.name === userRole);
      const perms = found ? (found.permissions || []) : [];
      if (perms.includes('all') || perms.includes(permission)) return next();

      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    } catch (err) {
      console.error('Permission check error:', err.message);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// 审计日志助手
async function writeAudit(req, action, entity, entityId, beforeState, afterState) {
  try {
    await AuditService.log({
      userId: req.user?.id || null,
      username: req.user?.name || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      beforeState: beforeState || null,
      afterState: afterState || null,
      ip: req.ip || req.headers['x-forwarded-for'] || null
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

// ==================== Root & Health ====================
// Root handler - prevents "Cannot GET /" error
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Pool Hall POS Backend with MySQL',
    version: '2.0.0',
    database: 'MySQL enabled',
    endpoints: {
      tables: 'GET /api/tables, POST /api/tables/:id/state, POST /api/tables/merge, POST /api/tables/:id/unmerge',
      reservations: 'GET /api/reservations, POST /api/reservations',
      members: 'GET /api/members, POST /api/members, POST /api/members/:id/topup',
      inventory: 'GET /api/inventory, POST /api/inventory, POST /api/inventory/:id/outbound, POST /api/inventory/:id/restock',
      staff: 'GET /api/staff, POST /api/staff, PUT /api/staff/:id/status, DELETE /api/staff/:id',
      transactions: 'GET /api/transactions, POST /api/transactions, GET /api/transactions/stats, GET /api/transactions/export/csv',
      queue: 'GET /api/queue, POST /api/queue, POST /api/queue/call-next, DELETE /api/queue/:id',
      rates: 'GET /api/rates, POST /api/rates, DELETE /api/rates/:id',
      settings: 'GET /api/settings, POST /api/settings',
      menu: 'GET /api/menu, POST /api/menu'
    }
  })
})

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'healthy', database: 'MySQL connected' }))

// ==================== 台位管理 (Tables) ====================
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await TableService.list()
    res.json(tables)
  } catch (err) {
    console.error('Error listing tables:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/tables/:id/state', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status, startedAt, elapsedSec, sessionId } = req.body
    
    const updateData = {}
    if (status) updateData.status = status
    if (elapsedSec !== undefined) updateData.elapsedSec = elapsedSec
    if (sessionId) updateData.currentSessionId = sessionId

    const updated = await TableService.update(id, updateData)
    broadcast({ type: 'table_update', table: updated })
    res.json(updated)
  } catch (err) {
    console.error('Error updating table state:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Table merge endpoint
app.post('/api/tables/merge', async (req, res) => {
  try {
    const { primaryTableId, secondaryTableIds } = req.body
    if (!primaryTableId || !Array.isArray(secondaryTableIds) || secondaryTableIds.length === 0) {
      return res.status(400).json({ error: 'primaryTableId and secondaryTableIds required' })
    }

    const result = await TableService.merge(primaryTableId, secondaryTableIds)
    const primary = await TableService.getById(primaryTableId)
    
    broadcast({ type: 'tables_merged', primaryTableId, secondaryTableIds })
    res.json({ success: true, primary })
  } catch (err) {
    console.error('Error merging tables:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Unmerge tables
app.post('/api/tables/:id/unmerge', async (req, res) => {
  try {
    const primaryId = Number(req.params.id)
    const result = await TableService.unmerge(primaryId)
    const primary = await TableService.getById(primaryId)
    
    broadcast({ type: 'table_unmerged', primaryId })
    res.json({ success: true, primary })
  } catch (err) {
    console.error('Error unmerging table:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 预约管理 (Reservations) ====================
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await ReservationService.list()
    res.json(reservations)
  } catch (err) {
    console.error('Error listing reservations:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/reservations', async (req, res) => {
  try {
    const reservation = await ReservationService.add(req.body)
    res.json(reservation)
  } catch (err) {
    console.error('Error adding reservation:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/reservations/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const updated = await ReservationService.updateStatus(req.params.id, status)
    res.json(updated)
  } catch (err) {
    console.error('Error updating reservation:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 会员管理 (Members) ====================
app.get('/api/members', async (req, res) => {
  try {
    const members = await MemberService.list()
    res.json(members)
  } catch (err) {
    console.error('Error listing members:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/members', async (req, res) => {
  try {
    const member = await MemberService.add(req.body)
    res.json(member)
  } catch (err) {
    console.error('Error adding member:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/members/:id/topup', async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'amount required and must be > 0' })
    }
    const updated = await MemberService.topup(req.params.id, amount)
    
    // 记录充值交易
    await TransactionService.add({
      tableId: null,
      items: null,
      subtotal: amount,
      amount: amount,
      paymentMethod: 'card',
      notes: '会员充值'
    })
    
    res.json(updated)
  } catch (err) {
    console.error('Error topup member:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 库存管理 (Inventory) ====================
app.get('/api/inventory', async (req, res) => {
  try {
    const inventory = await InventoryService.list()
    res.json(inventory)
  } catch (err) {
    console.error('Error listing inventory:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/inventory', async (req, res) => {
  try {
    const item = await InventoryService.add(req.body)
    res.json(item)
  } catch (err) {
    console.error('Error adding inventory:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/inventory/:id/outbound', async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'amount required and must be > 0' })
    }
    const updated = await InventoryService.outbound(req.params.id, amount)
    res.json(updated)
  } catch (err) {
    console.error('Error outbound inventory:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/inventory/:id/restock', async (req, res) => {
  try {
    const updated = await InventoryService.restock(req.params.id)
    res.json(updated)
  } catch (err) {
    console.error('Error restock inventory:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 交易流水 (Transactions) ====================
app.get('/api/transactions', async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100
    const offset = req.query.offset ? Number(req.query.offset) : 0
    const transactions = await TransactionService.list(limit, offset)
    res.json(transactions)
  } catch (err) {
    console.error('Error listing transactions:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = await TransactionService.add(req.body)
    res.json(transaction)
  } catch (err) {
    console.error('Error adding transaction:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/transactions/stats', async (req, res) => {
  try {
    const stats = await TransactionService.getStats()
    res.json(stats)
  } catch (err) {
    console.error('Error getting transaction stats:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/transactions/export/csv', async (req, res) => {
  try {
    const transactions = await TransactionService.list(10000, 0)
    const rows = transactions.map(t => ({
      时间: new Date(t.createdAt).toLocaleString('zh-CN'),
      类型: t.paymentMethod,
      金额: t.amount,
      台位: t.tableId || '-',
      备注: t.notes || ''
    }))
    
    const csv = stringify(rows, { header: true, encoding: 'utf8' })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"')
    res.send(Buffer.from('\uFEFF' + csv))
  } catch (err) {
    console.error('Error exporting CSV:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 等候队列 (Queue) ====================
app.get('/api/queue', async (req, res) => {
  try {
    const queue = await QueueService.list()
    res.json(queue)
  } catch (err) {
    console.error('Error listing queue:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/queue', async (req, res) => {
  try {
    const item = await QueueService.add(req.body)
    res.json(item)
  } catch (err) {
    console.error('Error adding to queue:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/queue/call-next', async (req, res) => {
  try {
    const customer = await QueueService.callNext()
    res.json(customer)
  } catch (err) {
    console.error('Error calling next:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/queue/:id', async (req, res) => {
  try {
    const result = await QueueService.remove(req.params.id)
    res.json(result)
  } catch (err) {
    console.error('Error removing from queue:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 员工管理 (Staff) ====================
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await StaffService.list()
    res.json(staff)
  } catch (err) {
    console.error('Error listing staff:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/staff', async (req, res) => {
  try {
    const staff = await StaffService.add(req.body)
    res.json(staff)
  } catch (err) {
    console.error('Error adding staff:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/staff/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'status required' })
    const updated = await StaffService.updateStatus(req.params.id, status)
    res.json(updated)
  } catch (err) {
    console.error('Error updating staff status:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const result = await StaffService.delete(req.params.id)
    res.json(result)
  } catch (err) {
    console.error('Error deleting staff:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 计费策略 (Rates) ====================
app.get('/api/rates', async (req, res) => {
  try {
    const rates = await RateService.list()
    res.json(rates)
  } catch (err) {
    console.error('Error listing rates:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/rates', async (req, res) => {
  try {
    const rate = await RateService.add(req.body)
    res.json(rate)
  } catch (err) {
    console.error('Error adding rate:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/rates/:id', async (req, res) => {
  try {
    const result = await RateService.delete(req.params.id)
    res.json(result)
  } catch (err) {
    console.error('Error deleting rate:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 系统设置 (Settings) ====================
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SettingService.list()
    res.json(settings)
  } catch (err) {
    console.error('Error listing settings:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value, category } = req.body
    const result = await SettingService.set(key, value, category || 'general')
    res.json({ key, value })
  } catch (err) {
    console.error('Error saving setting:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 商店基础设置 (Business) ====================
app.get('/api/business', async (req, res) => {
  try {
    const bs = await BusinessService.get()
    res.json(bs)
  } catch (err) {
    console.error('Error getting business settings:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/business', async (req, res) => {
  try {
    const updated = await BusinessService.set(req.body)
    res.json(updated)
  } catch (err) {
    console.error('Error saving business settings:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 计费规则 (Pricing) ====================
app.get('/api/pricing', async (req, res) => {
  try {
    const list = await PricingService.list()
    res.json(list)
  } catch (err) {
    console.error('Error listing pricing rules:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/pricing', requirePermission('manage_prices'), async (req, res) => {
  try {
    const before = null
    const item = await PricingService.add(req.body)
    await writeAudit(req, 'create_pricing_rule', 'pricing_rules', item.id, before, item)
    res.json(item)
  } catch (err) {
    console.error('Error adding pricing rule:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// 受保护：新增计费规则（需要 manage_prices 权限）
app.post('/api/pricing/protected', requirePermission('manage_prices'), async (req, res) => {
  try {
    const before = null
    const item = await PricingService.add(req.body)
    await writeAudit(req, 'create_pricing_rule', 'pricing_rules', item.id, before, item)
    res.json(item)
  } catch (err) {
    console.error('Error adding protected pricing rule:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Update a pricing rule
app.put('/api/pricing/:id', requirePermission('manage_prices'), async (req, res) => {
  try {
    const id = req.params.id
    const before = await PricingService.getById(id)
    const updated = await PricingService.update(id, req.body)
    await writeAudit(req, 'update_pricing_rule', 'pricing_rules', id, before, updated)
    res.json(updated)
  } catch (err) {
    console.error('Error updating pricing rule:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Delete a pricing rule
app.delete('/api/pricing/:id', requirePermission('manage_prices'), async (req, res) => {
  try {
    const id = req.params.id
    const before = await PricingService.getById(id)
    const result = await PricingService.delete(id)
    await writeAudit(req, 'delete_pricing_rule', 'pricing_rules', id, before, null)
    res.json(result)
  } catch (err) {
    console.error('Error deleting pricing rule:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 会员等级 (Membership Tiers) ====================
app.get('/api/membership/tiers', async (req, res) => {
  try {
    const tiers = await MembershipTierService.list()
    res.json(tiers)
  } catch (err) {
    console.error('Error listing membership tiers:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/membership/tiers', async (req, res) => {
  try {
    const tier = await MembershipTierService.add(req.body)
    res.json(tier)
  } catch (err) {
    console.error('Error adding membership tier:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 节假日 (Holidays) ====================
app.get('/api/holidays', async (req, res) => {
  try {
    const items = await HolidayService.list()
    res.json(items)
  } catch (err) {
    console.error('Error listing holidays:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/holidays', async (req, res) => {
  try {
    const hs = await HolidayService.add(req.body)
    res.json(hs)
  } catch (err) {
    console.error('Error adding holiday:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 促销 (Promotions) ====================
app.get('/api/promotions', async (req, res) => {
  try {
    const promos = await PromotionService.list()
    res.json(promos)
  } catch (err) {
    console.error('Error listing promotions:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/promotions', async (req, res) => {
  try {
    const p = await PromotionService.add(req.body)
    res.json(p)
  } catch (err) {
    console.error('Error adding promotion:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 角色与权限 (Roles) ====================
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await RoleService.list()
    res.json(roles)
  } catch (err) {
    console.error('Error listing roles:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/roles', async (req, res) => {
  try {
    const r = await RoleService.add(req.body)
    res.json(r)
  } catch (err) {
    console.error('Error adding role:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 审计日志 (Audit Logs) ====================
app.get('/api/audit-logs', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 200
    const logs = await AuditService.list(limit)
    res.json(logs)
  } catch (err) {
    console.error('Error listing audit logs:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 硬件设备 (Hardware) ====================
app.get('/api/hardware', async (req, res) => {
  try {
    const hw = await HardwareService.list()
    res.json(hw)
  } catch (err) {
    console.error('Error listing hardware:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/hardware', async (req, res) => {
  try {
    const h = await HardwareService.add(req.body)
    res.json(h)
  } catch (err) {
    console.error('Error adding hardware:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ==================== 菜单项目 (Menu) ====================
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await MenuService.list()
    res.json(menu)
  } catch (err) {
    console.error('Error listing menu:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/menu', async (req, res) => {
  try {
    const item = await MenuService.add(req.body)
    res.json(item)
  } catch (err) {
    console.error('Error adding menu item:', err.message)
    res.status(500).json({ error: err.message })
  }
})


// ==================== WebSocket Setup ====================
const server = app.listen(3001, () => {
  console.log('\n⭐ ========================================')
  console.log('✅ Pool Hall POS Backend 已启动')
  console.log('📍 地址: http://localhost:3001')
  console.log('🗄️  数据库: MySQL (pool_hall_pos)')
  console.log('⭐ ========================================\n')
})

// WebSocket server for pushing real-time updates
const wss = new WebSocketServer({ server })

function broadcast(msg) {
  const raw = JSON.stringify(msg)
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(raw)
    }
  })
}

wss.on('connection', ws => {
  console.log('🔗 WebSocket 客户端已连接')
  
  // Send initial data
  ;(async () => {
    try {
      const tables = await TableService.list()
      ws.send(JSON.stringify({ type: 'init', tables }))
    } catch (err) {
      console.error('Error sending init:', err.message)
    }
  })()

  ws.on('message', data => {
    try {
      const msg = JSON.parse(data)
      // Handle incoming messages if needed
    } catch (e) {
      // Invalid JSON, ignore
    }
  })

  ws.on('close', () => {
    console.log('🔌 WebSocket 客户端已断开')
  })
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⛔ 正在关闭服务器...')
  wss.clients.forEach(client => client.close())
  server.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})

module.exports = { app, broadcast }
