// 数据库服务层 - 所有 CRUD 操作
const { pool } = require('./config');
const { v4: uuidv4 } = require('uuid');

// ==================== 台位管理 ====================
const TableService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM tables ORDER BY id');
    return rows.map(row => ({
      ...row,
      mergedWith: row.mergedWith ? JSON.parse(row.mergedWith) : []
    }));
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      mergedWith: rows[0].mergedWith ? JSON.parse(rows[0].mergedWith) : []
    };
  },

  async update(id, data) {
    const { status, elapsedSec, currentSessionId, mergedWith } = data;
    const mergedWithJson = mergedWith ? JSON.stringify(mergedWith) : null;
    await pool.query(
      'UPDATE tables SET status = ?, elapsedSec = ?, currentSessionId = ?, mergedWith = ?, updatedAt = ? WHERE id = ?',
      [status, elapsedSec, currentSessionId, mergedWithJson, Date.now(), id]
    );
    return this.getById(id);
  },

  async merge(primaryId, secondaryIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 获取主台位
      const [primary] = await conn.query('SELECT * FROM tables WHERE id = ?', [primaryId]);
      if (primary.length === 0) throw new Error('主台位不存在');

      // 获取副台位总时长
      const [secondaries] = await conn.query(
        'SELECT SUM(elapsedSec) as totalSeconds FROM tables WHERE id IN (?)',
        [secondaryIds]
      );
      const additionalSeconds = secondaries[0]?.totalSeconds || 0;

      // 更新主台位（取最大时长）
      const newElapsedSec = Math.max(primary[0].elapsedSec || 0, additionalSeconds);
      const mergedWith = JSON.stringify(secondaryIds);
      await conn.query(
        'UPDATE tables SET status = ?, elapsedSec = ?, mergedWith = ?, updatedAt = ? WHERE id = ?',
        ['occupied', newElapsedSec, mergedWith, Date.now(), primaryId]
      );

      // 更新副台位为已合并状态
      await conn.query(
        'UPDATE tables SET status = ?, updatedAt = ? WHERE id IN (?)',
        ['merged', Date.now(), secondaryIds]
      );

      await conn.commit();
      return { success: true, primaryId, secondaryIds };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async unmerge(tableId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 获取合并信息
      const [rows] = await conn.query('SELECT mergedWith FROM tables WHERE id = ?', [tableId]);
      if (rows.length === 0) throw new Error('台位不存在');

      const mergedWith = rows[0].mergedWith ? JSON.parse(rows[0].mergedWith) : [];

      // 清除主台位的合并记录
      await conn.query(
        'UPDATE tables SET mergedWith = NULL, status = ? WHERE id = ?',
        ['occupied', tableId]
      );

      // 恢复副台位为占用状态
      if (mergedWith.length > 0) {
        await conn.query(
          'UPDATE tables SET status = ? WHERE id IN (?)',
          ['occupied', mergedWith]
        );
      }

      await conn.commit();
      return { success: true, tableId, unmergedIds: mergedWith };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

// ==================== 预约管理 ====================
const ReservationService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM reservations ORDER BY createdAt DESC');
    return rows;
  },

  async add(data) {
    const id = uuidv4();
    const { name, phone, date, time, tableType, pax, deposit } = data;
    await pool.query(
      'INSERT INTO reservations (id, name, phone, date, time, tableType, pax, deposit, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, date, time, tableType, pax, deposit, 'pending', Date.now()]
    );
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    return rows[0];
  },

  async updateStatus(id, newStatus) {
    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [newStatus, id]);
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    return rows[0];
  }
};

// ==================== 会员管理 ====================
const MemberService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM members ORDER BY createdAt DESC');
    return rows;
  },

  async add(data) {
    const id = uuidv4();
    const { name, phone } = data;
    await pool.query(
      'INSERT INTO members (id, name, phone, balance, points, tier, totalSpent, joinDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, 0, 0, 'Silver', 0, Date.now(), Date.now()]
    );
    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
    return rows[0];
  },

  async topup(id, amount) {
    await pool.query(
      'UPDATE members SET balance = balance + ?, lastVisited = ? WHERE id = ?',
      [amount, Date.now(), id]
    );
    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
    return rows[0];
  }
};

// ==================== 库存管理 ====================
const InventoryService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM inventory ORDER BY category, name');
    return rows;
  },

  async add(data) {
    const id = uuidv4();
    const { name, unit, qty, minQty, category } = data;
    await pool.query(
      'INSERT INTO inventory (id, name, unit, qty, minQty, category, createdAt, lastRestocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, unit, qty, minQty, category, Date.now(), Date.now()]
    );
    const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0];
  },

  async outbound(id, amount) {
    await pool.query('UPDATE inventory SET qty = qty - ? WHERE id = ?', [amount, id]);
    const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0];
  },

  async restock(id) {
    // 补货至最小库存的3倍
    const [rows] = await pool.query('SELECT minQty FROM inventory WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('物料不存在');
    const targetQty = rows[0].minQty * 3;
    await pool.query('UPDATE inventory SET qty = ?, lastRestocked = ? WHERE id = ?', [targetQty, Date.now(), id]);
    const [updated] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    return updated[0];
  }
};

// ==================== 交易流水 ====================
const TransactionService = {
  async list(limit = 100, offset = 0) {
    const [rows] = await pool.query(
      'SELECT * FROM transactions ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows.map(row => ({
      ...row,
      items: row.items ? JSON.parse(row.items) : []
    }));
  },

  async add(data) {
    const id = uuidv4();
    const { tableId, items, subtotal, discount, tax, amount, paymentMethod, notes } = data;
    const itemsJson = JSON.stringify(items || []);
    
    await pool.query(
      'INSERT INTO transactions (id, tableId, items, subtotal, discount, tax, amount, paymentMethod, paymentStatus, createdAt, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, tableId, itemsJson, subtotal, discount || 0, tax || 0, amount, paymentMethod, 'paid', Date.now(), notes || '']
    );
    
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
    return {
      ...rows[0],
      items: rows[0].items ? JSON.parse(rows[0].items) : []
    };
  },

  async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(amount) as totalRevenue,
        AVG(amount) as avgOrderValue,
        COUNT(DISTINCT DATE(FROM_UNIXTIME(createdAt/1000))) as activeDays
      FROM transactions WHERE paymentStatus = 'paid'
    `);
    return stats[0] || { totalTransactions: 0, totalRevenue: 0, avgOrderValue: 0, activeDays: 0 };
  }
};

// ==================== 等候队列 ====================
const QueueService = {
  async list() {
    const [rows] = await pool.query(
      'SELECT * FROM queue WHERE status != "completed" AND status != "cancelled" ORDER BY position ASC'
    );
    return rows;
  },

  async add(data) {
    const id = uuidv4();
    const { name, phone, pax } = data;
    
    // 获取当前最大位置
    const [maxPos] = await pool.query('SELECT MAX(position) as maxPos FROM queue WHERE status IN ("waiting", "notified")');
    const nextPos = (maxPos[0]?.maxPos || 0) + 1;
    
    await pool.query(
      'INSERT INTO queue (id, name, phone, pax, position, status, addedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, pax, nextPos, 'waiting', Date.now(), Date.now()]
    );
    
    const [rows] = await pool.query('SELECT * FROM queue WHERE id = ?', [id]);
    return rows[0];
  },

  async callNext() {
    // 获取位置为1的顾客
    const [rows] = await pool.query('SELECT * FROM queue WHERE position = 1 AND status = "waiting"');
    if (rows.length === 0) throw new Error('队列为空');
    
    const customer = rows[0];
    await pool.query(
      'UPDATE queue SET status = ?, notifiedAt = ? WHERE id = ?',
      ['notified', Date.now(), customer.id]
    );
    
    return customer;
  },

  async remove(id) {
    const [rows] = await pool.query('SELECT position FROM queue WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('顾客不存在');
    
    const position = rows[0].position;
    await pool.query('DELETE FROM queue WHERE id = ?', [id]);
    
    // 重新编号之后的位置
    await pool.query('UPDATE queue SET position = position - 1 WHERE position > ?', [position]);
    
    return { success: true };
  }
};

// ==================== 员工管理 ====================
const StaffService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM staff ORDER BY hireDate DESC');
    return rows;
  },

  async add(data) {
    const id = uuidv4();
    const { name, phone, position, salary, hireDate } = data;
    
    await pool.query(
      'INSERT INTO staff (id, name, phone, position, salary, hireDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, position, salary, hireDate, 'active', Date.now()]
    );
    
    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
    return rows[0];
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE staff SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM staff WHERE id = ?', [id]);
    return { success: true };
  }
};

// ==================== 计费策略 ====================
const RateService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM rates ORDER BY createdAt DESC');
    return rows;
  },

  async add(data) {
    const id = uuidv4();
    const { name, baseRate, period, multiplier } = data;
    
    await pool.query(
      'INSERT INTO rates (id, name, baseRate, period, multiplier, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, baseRate, period, multiplier || 1.0, Date.now()]
    );
    
    const [rows] = await pool.query('SELECT * FROM rates WHERE id = ?', [id]);
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM rates WHERE id = ?', [id]);
    return { success: true };
  }
};

// ==================== 系统设置 ====================
const SettingService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY category');
    const result = {};
    rows.forEach(row => {
      result[row.settingKey] = row.settingValue;
    });
    return result;
  },

  async get(key) {
    const [rows] = await pool.query('SELECT settingValue FROM settings WHERE settingKey = ?', [key]);
    return rows.length > 0 ? rows[0].settingValue : null;
  },

  async set(key, value, category = 'general') {
    const existing = await this.get(key);
    if (existing) {
      await pool.query(
        'UPDATE settings SET settingValue = ?, updatedAt = ? WHERE settingKey = ?',
        [value, Date.now(), key]
      );
    } else {
      await pool.query(
        'INSERT INTO settings (settingKey, settingValue, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [key, value, category, Date.now(), Date.now()]
      );
    }
    return value;
  }
};

// ==================== 菜单项目 ====================
const MenuService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE available = TRUE ORDER BY category, name');
    return rows;
  },

  async add(data) {
    const { name, price, category } = data;
    
    await pool.query(
      'INSERT INTO menu_items (name, price, category, available, createdAt) VALUES (?, ?, ?, ?, ?)',
      [name, price, category, true, Date.now()]
    );
    
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE name = ? ORDER BY id DESC LIMIT 1', [name]);
    return rows[0];
  }
};

// ==================== 商店基础设置 ====================
const BusinessService = {
  async get() {
    const [rows] = await pool.query('SELECT * FROM business_settings ORDER BY id LIMIT 1');
    return rows.length ? rows[0] : null;
  },

  async set(data) {
    const existing = await this.get();
    const now = Date.now();
    if (existing) {
      await pool.query(
        `UPDATE business_settings SET name = ?, logoUrl = ?, openingHours = ?, timezone = ?, currency = ?, serviceFeePct = ?, taxRatePct = ?, receiptHeader = ?, ssmRegistration = ?, address = ?, phone = ?, email = ?, receiptFooter = ?, updatedAt = ? WHERE id = ?`,
        [data.name, data.logoUrl, data.openingHours, data.timezone, data.currency, data.serviceFeePct, data.taxRatePct, data.receiptHeader, data.ssmRegistration, data.address, data.phone, data.email, data.receiptFooter, now, existing.id]
      );
      const [rows] = await pool.query('SELECT * FROM business_settings WHERE id = ?', [existing.id]);
      return rows[0];
    } else {
      await pool.query(
        `INSERT INTO business_settings (name, logoUrl, openingHours, timezone, currency, serviceFeePct, taxRatePct, receiptHeader, ssmRegistration, address, phone, email, receiptFooter, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [data.name, data.logoUrl, data.openingHours, data.timezone, data.currency, data.serviceFeePct, data.taxRatePct, data.receiptHeader, data.ssmRegistration, data.address, data.phone, data.email, data.receiptFooter, now, now]
      );
      const [rows] = await pool.query('SELECT * FROM business_settings ORDER BY id DESC LIMIT 1');
      return rows[0];
    }
  }
};

// ==================== 计费规则服务 ====================
const PricingService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY createdAt DESC');
    return rows;
  },
  async add(data) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO pricing_rules (id, name, mode, baseRate, minChargeMinutes, gracePeriodMinutes, overtimeRatePerMinute, config, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.name, data.mode || 'hourly', data.baseRate || 0, data.minChargeMinutes || 30, data.gracePeriodMinutes || 5, data.overtimeRatePerMinute || 0, JSON.stringify(data.config || {}), Date.now(), Date.now()]
    );
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [id]);
    return rows[0];
  },
  async update(id, data) {
    const now = Date.now();
    await pool.query(
      'UPDATE pricing_rules SET name = ?, mode = ?, baseRate = ?, minChargeMinutes = ?, gracePeriodMinutes = ?, overtimeRatePerMinute = ?, config = ?, updatedAt = ? WHERE id = ?',
      [data.name, data.mode || 'hourly', data.baseRate || 0, data.minChargeMinutes || 30, data.gracePeriodMinutes || 5, data.overtimeRatePerMinute || 0, JSON.stringify(data.config || {}), now, id]
    );
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },
  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },
  async delete(id) {
    await pool.query('DELETE FROM pricing_rules WHERE id = ?', [id]);
    return { success: true };
  }
};

// ==================== 会员等级服务 ====================
const MembershipTierService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM membership_tiers ORDER BY createdAt DESC');
    return rows;
  },
  async add(data) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO membership_tiers (id, name, discountPct, pointsRate, bonusOnTopup, validityDays, birthdayDiscountPct, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.name, data.discountPct || 0, data.pointsRate || 1.0, JSON.stringify(data.bonusOnTopup || {}), data.validityDays || 365, data.birthdayDiscountPct || 0, Date.now()]
    );
    const [rows] = await pool.query('SELECT * FROM membership_tiers WHERE id = ?', [id]);
    return rows[0];
  }
};

// ==================== 节假日服务 ====================
const HolidayService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM holidays ORDER BY date');
    return rows;
  },
  async add(data) {
    await pool.query('INSERT INTO holidays (name, date, recurring, createdAt) VALUES (?, ?, ?, ?)', [data.name, data.date, data.recurring ? 1 : 0, Date.now()]);
    const [rows] = await pool.query('SELECT * FROM holidays ORDER BY id DESC LIMIT 1');
    return rows[0];
  }
};

// ==================== 促销服务 ====================
const PromotionService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM promotions ORDER BY createdAt DESC');
    return rows.map(r => ({ ...r, config: r.config ? JSON.parse(r.config) : null }));
  },
  async add(data) {
    const id = uuidv4();
    await pool.query('INSERT INTO promotions (id, name, type, config, startAt, endAt, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, data.name, data.type || 'discount', JSON.stringify(data.config || {}), data.startAt || 0, data.endAt || 0, data.active ? 1 : 0, Date.now()]);
    const [rows] = await pool.query('SELECT * FROM promotions WHERE id = ?', [id]);
    return rows[0];
  }
};

// ==================== 角色服务 ====================
const RoleService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY id');
    return rows.map(r => ({ ...r, permissions: r.permissions ? JSON.parse(r.permissions) : [] }));
  },
  async add(data) {
    await pool.query('INSERT INTO roles (name, permissions, createdAt) VALUES (?, ?, ?)', [data.name, JSON.stringify(data.permissions || []), Date.now()]);
    const [rows] = await pool.query('SELECT * FROM roles WHERE name = ? LIMIT 1', [data.name]);
    return rows[0];
  }
};

// ==================== 审计日志服务 ====================
const AuditService = {
  async log(entry) {
    const id = uuidv4();
    await pool.query('INSERT INTO audit_logs (id, userId, username, action, entity, entityId, beforeState, afterState, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, entry.userId || null, entry.username || null, entry.action, entry.entity || null, entry.entityId || null, JSON.stringify(entry.beforeState || null), JSON.stringify(entry.afterState || null), entry.ip || null, Date.now()]);
    return { id };
  },
  async list(limit = 100) {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT ?', [limit]);
    return rows.map(r => ({ ...r, beforeState: r.beforeState ? JSON.parse(r.beforeState) : null, afterState: r.afterState ? JSON.parse(r.afterState) : null }));
  }
};

// ==================== 硬件设备服务 ====================
const HardwareService = {
  async list() {
    const [rows] = await pool.query('SELECT * FROM hardware_devices ORDER BY createdAt DESC');
    return rows.map(r => ({ ...r, config: r.config ? JSON.parse(r.config) : null }));
  },
  async add(data) {
    const id = uuidv4();
    await pool.query('INSERT INTO hardware_devices (id, name, type, config, createdAt) VALUES (?, ?, ?, ?, ?)', [id, data.name, data.type, JSON.stringify(data.config || {}), Date.now()]);
    const [rows] = await pool.query('SELECT * FROM hardware_devices WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = {
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
};
