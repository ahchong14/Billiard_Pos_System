-- ============================================
-- 池球馆 POS 系统 - MySQL 数据库完整初始化脚本
-- ============================================

-- 1. 创建数据库
DROP DATABASE IF EXISTS pool_hall_pos;
CREATE DATABASE pool_hall_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pool_hall_pos;

-- ============================================
-- 表1：台位管理 (Tables)
-- ============================================
CREATE TABLE tables (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('available', 'occupied', 'merged') DEFAULT 'available',
  type VARCHAR(20) DEFAULT '标准',
  capacity INT DEFAULT 4,
  elapsedSec INT DEFAULT 0,
  currentSessionId VARCHAR(36),
  mergedWith JSON,  -- 存储被并入的台位数组 [5, 6, 7]
  createdAt BIGINT,
  updatedAt BIGINT,
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据：20张台位
INSERT INTO tables (name, status, type, capacity, createdAt, updatedAt) VALUES
('台1', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台2', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台3', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台4', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台5', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台6', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台7', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台8', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台9', 'available', 'VIP', 8, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台10', 'available', 'VIP', 8, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台11', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台12', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台13', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台14', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台15', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台16', 'available', 'VIP', 8, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台17', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台18', 'available', '标准', 4, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台19', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('台20', 'available', '豪华', 6, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表2：预约管理 (Reservations)
-- ============================================
CREATE TABLE reservations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date DATE,
  time TIME,
  tableType VARCHAR(20),
  pax INT DEFAULT 2,
  deposit DECIMAL(10, 2) DEFAULT 0,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  reminderSent BOOLEAN DEFAULT FALSE,
  createdAt BIGINT,
  INDEX idx_status (status),
  INDEX idx_date (date),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO reservations VALUES
(UUID(), '张三', '0123456789', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00', '标准', 4, 50, 'pending', FALSE, UNIX_TIMESTAMP()*1000),
(UUID(), '李四', '0987654321', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '20:00', '豪华', 6, 100, 'pending', FALSE, UNIX_TIMESTAMP()*1000),
(UUID(), '王五', '1234567890', CURDATE(), '14:00', '标准', 2, 0, 'completed', TRUE, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表3：会员管理 (Members)
-- ============================================
CREATE TABLE members (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0,
  points INT DEFAULT 0,
  tier ENUM('Silver', 'Gold', 'Platinum') DEFAULT 'Silver',
  totalSpent DECIMAL(10, 2) DEFAULT 0,
  joinDate BIGINT,
  lastVisited BIGINT,
  createdAt BIGINT,
  INDEX idx_tier (tier),
  INDEX idx_phone (phone),
  INDEX idx_joinDate (joinDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO members VALUES
(UUID(), '会员A', '13800138001', 500.00, 500, 'Gold', 2000.00, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '会员B', '13800138002', 200.00, 200, 'Silver', 500.00, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '会员C', '13800138003', 1000.00, 2000, 'Platinum', 5000.00, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '会员D', '13800138004', 150.00, 150, 'Silver', 300.00, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表4：库存管理 (Inventory)
-- ============================================
CREATE TABLE inventory (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  qty INT DEFAULT 0,
  unit VARCHAR(20),
  minQty INT DEFAULT 5,
  category VARCHAR(50),
  createdAt BIGINT,
  lastRestocked BIGINT,
  INDEX idx_category (category),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO inventory VALUES
(UUID(), '可乐', 50, '瓶', 10, '饮料', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '雪碧', 45, '瓶', 10, '饮料', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '咖啡', 30, '杯', 5, '饮料', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '牛奶', 20, '瓶', 5, '饮料', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '花生', 100, '克', 30, '食物', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '薯条', 80, '份', 20, '食物', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '鸡翅', 60, '份', 15, '食物', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '球币', 500, '枚', 200, '消耗品', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '毛巾', 100, '条', 30, '消耗品', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表5：交易流水 (Transactions)
-- ============================================
CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY,
  tableId INT,
  items JSON,  -- [{itemId, name, price, qty}, ...]
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  amount DECIMAL(10, 2),
  paymentMethod VARCHAR(50),  -- cash, card, ewallet, transfer
  paymentStatus ENUM('paid', 'pending', 'cancelled') DEFAULT 'paid',
  createdAt BIGINT,
  notes VARCHAR(255),
  INDEX idx_tableId (tableId),
  INDEX idx_paymentMethod (paymentMethod),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO transactions VALUES
(UUID(), 1, '[{"itemId": 1, "name": "可乐", "price": 5, "qty": 2}]', 10.00, 0, 0, 10.00, 'cash', 'paid', UNIX_TIMESTAMP()*1000 - 86400000, ''),
(UUID(), 2, '[{"itemId": 2, "name": "雪碧", "price": 5, "qty": 1}]', 5.00, 0, 0, 5.00, 'card', 'paid', UNIX_TIMESTAMP()*1000 - 3600000, ''),
(UUID(), 3, '[{"itemId": 3, "name": "咖啡", "price": 8, "qty": 3}]', 24.00, 2, 0, 22.00, 'ewallet', 'paid', UNIX_TIMESTAMP()*1000, '团体优惠');

-- 会员充值记录
INSERT INTO transactions VALUES
(UUID(), NULL, NULL, 500.00, 0, 0, 500.00, 'card', 'paid', UNIX_TIMESTAMP()*1000 - 604800000, '会员充值'),
(UUID(), NULL, NULL, 1000.00, 0, 0, 1000.00, 'transfer', 'paid', UNIX_TIMESTAMP()*1000 - 259200000, '会员充值');

-- ============================================
-- 表6：等候队列 (Queue)
-- ============================================
CREATE TABLE queue (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  pax INT DEFAULT 2,
  position INT,  -- 队列位置，1/2/3...
  status ENUM('waiting', 'notified', 'completed', 'cancelled') DEFAULT 'waiting',
  addedAt BIGINT,
  notifiedAt BIGINT,
  createdAt BIGINT,
  INDEX idx_status (status),
  INDEX idx_position (position),
  INDEX idx_addedAt (addedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO queue VALUES
(UUID(), '小王', '13900139001', 4, 1, 'waiting', UNIX_TIMESTAMP()*1000, NULL, UNIX_TIMESTAMP()*1000),
(UUID(), '小李', '13900139002', 2, 2, 'waiting', UNIX_TIMESTAMP()*1000 - 300000, NULL, UNIX_TIMESTAMP()*1000 - 300000),
(UUID(), '小张', '13900139003', 6, 3, 'notified', UNIX_TIMESTAMP()*1000 - 600000, UNIX_TIMESTAMP()*1000 - 60000, UNIX_TIMESTAMP()*1000 - 600000);

-- ============================================
-- 表7：员工管理 (Staff)
-- ============================================
CREATE TABLE staff (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(50),  -- cashier, waiter, manager, admin
  salary DECIMAL(10, 2) DEFAULT 0,
  hireDate DATE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  commission DECIMAL(10, 2) DEFAULT 0,
  totalSales DECIMAL(10, 2) DEFAULT 0,
  createdAt BIGINT,
  INDEX idx_status (status),
  INDEX idx_position (position),
  INDEX idx_hireDate (hireDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO staff VALUES
(UUID(), '张店长', '14400144001', 'manager', 5000, DATE_SUB(CURDATE(), INTERVAL 365 DAY), 'active', 2000, 50000, UNIX_TIMESTAMP()*1000),
(UUID(), '李收银', '14400144002', 'cashier', 3000, DATE_SUB(CURDATE(), INTERVAL 180 DAY), 'active', 500, 15000, UNIX_TIMESTAMP()*1000),
(UUID(), '王服务', '14400144003', 'waiter', 2500, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 'active', 300, 8000, UNIX_TIMESTAMP()*1000),
(UUID(), '刘管理', '14400144004', 'admin', 6000, DATE_SUB(CURDATE(), INTERVAL 730 DAY), 'active', 3000, 80000, UNIX_TIMESTAMP()*1000),
(UUID(), '陈前员工', '14400144005', 'waiter', 2500, DATE_SUB(CURDATE(), INTERVAL 360 DAY), 'inactive', 0, 5000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表8：计费策略 (Rates)
-- ============================================
CREATE TABLE rates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  baseRate DECIMAL(10, 2),  -- 基础费率 (RM/分钟)
  period VARCHAR(50),  -- 时段: 全天/工作日/weekend
  multiplier DECIMAL(5, 2) DEFAULT 1.0,  -- 倍率
  createdAt BIGINT,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO rates VALUES
(UUID(), '标准费率', 0.50, '全天', 1.0, UNIX_TIMESTAMP()*1000),
(UUID(), '黄金费率', 0.50, '全天', 1.5, UNIX_TIMESTAMP()*1000),
(UUID(), '夜间费率', 0.60, '21:00-06:00', 1.2, UNIX_TIMESTAMP()*1000),
(UUID(), '周末费率', 0.50, '周末', 1.3, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表9：系统设置 (Settings)
-- ============================================
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settingKey VARCHAR(100) NOT NULL UNIQUE,
  settingValue TEXT,
  category VARCHAR(50),  -- billing, business, payment, etc.
  createdAt BIGINT,
  updatedAt BIGINT,
  INDEX idx_category (category),
  INDEX idx_settingKey (settingKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据 - 计费设置
INSERT INTO settings (settingKey, settingValue, category, createdAt, updatedAt) VALUES
('billRate', '0.5', 'billing', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('taxRate', '6', 'billing', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('currency', 'RM', 'billing', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- 初始数据 - 商户设置
INSERT INTO settings (settingKey, settingValue, category, createdAt, updatedAt) VALUES
('businessName', '悠闲池球馆', 'business', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('businessPhone', '+60164000000', 'business', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('businessAddress', 'Jalan Merdeka, 50050 Kuala Lumpur', 'business', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('businessHours', '10:00-02:00', 'business', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- 初始数据 - 支付设置
INSERT INTO settings (settingKey, settingValue, category, createdAt, updatedAt) VALUES
('paymentMethods', '["cash","card","ewallet","transfer"]', 'payment', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- 初始数据 - 备份设置
INSERT INTO settings (settingKey, settingValue, category, createdAt, updatedAt) VALUES
('backupEnabled', 'true', 'backup', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('backupFrequency', 'daily', 'backup', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：商店基础设置（business_settings）
-- ============================================
CREATE TABLE IF NOT EXISTS business_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) DEFAULT 'My Pool Hall',
  logoUrl VARCHAR(1000) DEFAULT NULL,
  openingHours VARCHAR(200) DEFAULT '10:00-02:00',
  timezone VARCHAR(100) DEFAULT 'Asia/Kuala_Lumpur',
  currency VARCHAR(10) DEFAULT 'MYR',
  serviceFeePct DECIMAL(5,2) DEFAULT 5.00,
  taxRatePct DECIMAL(5,2) DEFAULT 6.00,
  receiptHeader VARCHAR(200) DEFAULT NULL,
  ssmRegistration VARCHAR(100) DEFAULT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(200),
  receiptFooter TEXT DEFAULT 'Thank you for visiting!\n',
  createdAt BIGINT,
  updatedAt BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 默认商店设置
INSERT INTO business_settings (name, logoUrl, openingHours, timezone, currency, serviceFeePct, taxRatePct, receiptHeader, ssmRegistration, address, phone, email, receiptFooter, createdAt, updatedAt)
VALUES ('悠闲池球馆', NULL, '10:00-02:00', 'Asia/Kuala_Lumpur', 'MYR', 5.00, 6.00, '悠闲有限公司', 'SSM-123456', 'Jalan Merdeka, 50050 Kuala Lumpur', '+60164000000', 'info@poolhall.example', 'Thank you for visiting!', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：计费规则（pricing_rules）
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  mode ENUM('hourly','per_minute','per_game','flat','per_pax') DEFAULT 'hourly',
  baseRate DECIMAL(10,2) DEFAULT 0.00,
  minChargeMinutes INT DEFAULT 30,
  gracePeriodMinutes INT DEFAULT 5,
  overtimeRatePerMinute DECIMAL(10,4) DEFAULT 0.00,
  config JSON DEFAULT NULL,
  createdAt BIGINT,
  updatedAt BIGINT,
  INDEX idx_mode (mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 示例计费规则
INSERT INTO pricing_rules (id, name, mode, baseRate, minChargeMinutes, gracePeriodMinutes, overtimeRatePerMinute, config, createdAt, updatedAt) VALUES
(UUID(), '标准按小时', 'hourly', 12.00, 30, 5, 0.30, JSON_OBJECT('notes','平日白天标准'), UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '晚间费率', 'hourly', 18.00, 30, 5, 0.30, JSON_OBJECT('notes','18:00-00:00'), UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '周末费率', 'hourly', 20.00, 30, 5, 0.35, JSON_OBJECT('notes','周末专用'), UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
(UUID(), '包场费', 'flat', 200.00, 0, 0, 0.00, JSON_OBJECT('notes','包场费用'), UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：计费时段（pricing_time_slots）用于时段细分
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_time_slots (
  id VARCHAR(36) PRIMARY KEY,
  pricingRuleId VARCHAR(36) NOT NULL,
  startTime VARCHAR(20),
  endTime VARCHAR(20),
  days VARCHAR(50) DEFAULT 'all', -- e.g. mon,tue,wed or weekend
  price DECIMAL(10,2) DEFAULT NULL,
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  createdAt BIGINT,
  FOREIGN KEY (pricingRuleId) REFERENCES pricing_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 新增表：会员等级（membership_tiers）
-- ============================================
CREATE TABLE IF NOT EXISTS membership_tiers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  discountPct DECIMAL(5,2) DEFAULT 0.00,
  pointsRate DECIMAL(10,4) DEFAULT 1.0,
  bonusOnTopup JSON DEFAULT NULL,
  validityDays INT DEFAULT 365,
  birthdayDiscountPct DECIMAL(5,2) DEFAULT 0.00,
  createdAt BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO membership_tiers (id, name, discountPct, pointsRate, bonusOnTopup, validityDays, birthdayDiscountPct, createdAt) VALUES
(UUID(), 'Silver', 0.00, 1.0, JSON_OBJECT('threshold',0,'bonus',0), 365, 0.00, UNIX_TIMESTAMP()*1000),
(UUID(), 'Gold', 5.00, 1.25, JSON_OBJECT('threshold',100,'bonus',10), 365, 5.00, UNIX_TIMESTAMP()*1000),
(UUID(), 'VIP', 10.00, 1.5, JSON_OBJECT('threshold',100,'bonus',20), 365, 10.00, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：节假日（holidays）
-- ============================================
CREATE TABLE IF NOT EXISTS holidays (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200),
  date DATE,
  recurring BOOLEAN DEFAULT FALSE,
  createdAt BIGINT,
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 示例节假日
INSERT INTO holidays (name, date, recurring, createdAt) VALUES
('新年', '2026-01-01', TRUE, UNIX_TIMESTAMP()*1000),
('劳动节', '2026-05-01', TRUE, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：促销/活动（promotions）
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200),
  type ENUM('happy_hour','discount','bundle','holiday') DEFAULT 'discount',
  config JSON DEFAULT NULL,
  startAt BIGINT,
  endAt BIGINT,
  active BOOLEAN DEFAULT TRUE,
  createdAt BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 示例促销：Happy Hour
INSERT INTO promotions (id, name, type, config, startAt, endAt, active, createdAt) VALUES
(UUID(), 'Happy Hour 4-6pm', 'happy_hour', JSON_OBJECT('days','mon,tue,wed,thu,fri','start','16:00','end','18:00','multiplier',0.8), 0, 0, TRUE, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：角色与权限（roles）
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE,
  permissions JSON DEFAULT NULL,
  createdAt BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name, permissions, createdAt) VALUES
('Admin', JSON_ARRAY('all'), UNIX_TIMESTAMP()*1000),
('Manager', JSON_ARRAY('manage_prices','refund','discount'), UNIX_TIMESTAMP()*1000),
('Staff', JSON_ARRAY('open_table','create_order'), UNIX_TIMESTAMP()*1000);

-- ============================================
-- 新增表：审计日志（audit_logs）
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36),
  username VARCHAR(200),
  action VARCHAR(200),
  entity VARCHAR(100),
  entityId VARCHAR(100),
  beforeState JSON DEFAULT NULL,
  afterState JSON DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  createdAt BIGINT,
  INDEX idx_action (action),
  INDEX idx_entity (entity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 新增表：硬件设备（hardware_devices）
-- ============================================
CREATE TABLE IF NOT EXISTS hardware_devices (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200),
  type VARCHAR(100),
  config JSON DEFAULT NULL,
  createdAt BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 默认硬件示例
INSERT INTO hardware_devices (id, name, type, config, createdAt) VALUES
(UUID(), 'POS Printer', 'printer', JSON_OBJECT('port','COM1','model','EPSON_TM_T20'), UNIX_TIMESTAMP()*1000);

-- ============================================
-- 表10：菜单项目 (Menu Items)
-- ============================================
CREATE TABLE menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2),
  category VARCHAR(50),  -- 饮料, 食物, etc.
  available BOOLEAN DEFAULT TRUE,
  createdAt BIGINT,
  INDEX idx_category (category),
  INDEX idx_available (available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据
INSERT INTO menu_items (name, price, category, available, createdAt) VALUES
('可乐', 5.00, '饮料', TRUE, UNIX_TIMESTAMP()*1000),
('雪碧', 5.00, '饮料', TRUE, UNIX_TIMESTAMP()*1000),
('咖啡', 8.00, '饮料', TRUE, UNIX_TIMESTAMP()*1000),
('牛奶', 4.00, '饮料', TRUE, UNIX_TIMESTAMP()*1000),
('花生', 15.00, '食物', TRUE, UNIX_TIMESTAMP()*1000),
('薯条', 12.00, '食物', TRUE, UNIX_TIMESTAMP()*1000),
('鸡翅', 25.00, '食物', TRUE, UNIX_TIMESTAMP()*1000),
('炸鱼', 18.00, '食物', TRUE, UNIX_TIMESTAMP()*1000),
('沙拉', 15.00, '食物', TRUE, UNIX_TIMESTAMP()*1000),
('汉堡', 20.00, '食物', TRUE, UNIX_TIMESTAMP()*1000);

-- ============================================
-- 创建用户和权限
-- ============================================
CREATE USER IF NOT EXISTS 'pool_user'@'localhost' IDENTIFIED BY 'Pool@2024Secure';
GRANT ALL PRIVILEGES ON pool_hall_pos.* TO 'pool_user'@'localhost';
FLUSH PRIVILEGES;

-- ============================================
-- 创建索引优化查询性能
-- ============================================
CREATE INDEX idx_tables_status ON tables(status, updatedAt DESC);
CREATE INDEX idx_reservations_phone_date ON reservations(phone, date);
CREATE INDEX idx_members_tier_joinDate ON members(tier, joinDate DESC);
CREATE INDEX idx_inventory_category_qty ON inventory(category, qty);
CREATE INDEX idx_transactions_date_method ON transactions(createdAt DESC, paymentMethod);
CREATE INDEX idx_queue_position_status ON queue(status, position);
CREATE INDEX idx_staff_hire_status ON staff(hireDate DESC, status);

-- ============================================
-- 初始化完成
-- ============================================
SELECT '✅ 数据库初始化成功!' AS message;
SELECT COUNT(*) as tables_count FROM tables;
SELECT COUNT(*) as members_count FROM members;
SELECT COUNT(*) as transactions_count FROM transactions;

-- 显示所有表
SHOW TABLES;
