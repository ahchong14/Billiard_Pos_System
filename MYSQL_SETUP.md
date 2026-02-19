# 🗄️ MySQL 数据库设置指南

## 📋 前置要求

- MySQL 5.7+ 或 8.0+
- Node.js 14+
- npm 或 yarn

## 🚀 快速设置

### 第1步：安装 MySQL

**Windows:**
1. 下载 MySQL 8.0 安装程序：https://dev.mysql.com/downloads/mysql/
2. 运行安装程序，按照向导操作
3. 设置根密码（记住这个密码！）
4. 配置 MySQL 服务为自动启动

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation  # 配置安全设置
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

---

### 第2步：创建数据库和用户

#### 选项 A：使用 SQL 脚本（推荐）

1. **打开 MySQL 命令行**
   ```bash
   mysql -u root -p
   ```
   输入你的 MySQL 根密码

2. **运行初始化脚本**
   ```sql
   SOURCE /path/to/pool_hall_setup.sql;
   ```

   **Windows 示例：**
   ```sql
   SOURCE C:/Users/user/Downloads/Diagram/vpp/pool_system/pool_hall_setup.sql;
   ```

   **macOS/Linux 示例：**
   ```sql
   SOURCE /Users/yourname/Downloads/Diagram/vpp/pool_system/pool_hall_setup.sql;
   ```

3. **验证创建成功**
   ```sql
   USE pool_hall_pos;
   SHOW TABLES;
   ```

   应该看到10个表：
   - tables, reservations, members, inventory, transactions
   - queue, staff, rates, settings, menu_items

4. **验证用户创建成功**
   ```sql
   SELECT User, Host FROM mysql.user WHERE User='pool_user';
   ```

#### 选项 B：手动创建（如果选项 A 失败）

1. 打开 MySQL 命令行
   ```bash
   mysql -u root -p
   ```

2. 逐行下面的命令：
   ```sql
   CREATE DATABASE pool_hall_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'pool_user'@'localhost' IDENTIFIED BY 'Pool@2024Secure';
   GRANT ALL PRIVILEGES ON pool_hall_pos.* TO 'pool_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. 然后运行 `pool_hall_setup.sql` 中的其他部分

---

### 第3步：配置后端环境

1. **编辑 `.env` 文件**
   
   文件位置：`backend/.env`

   ```env
   # MySQL 连接配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=pool_user
   DB_PASSWORD=Pool@2024Secure
   DB_NAME=pool_hall_pos
   
   # 服务器配置
   SERVER_PORT=3001
   NODE_ENV=development
   LOG_LEVEL=info
   ```

2. **根据你的 MySQL 配置修改连接参数：**
   - `DB_HOST`: MySQL 服务器地址（本地通常是 `localhost`）
   - `DB_USER`: MySQL 用户名（默认 `pool_user`）
   - `DB_PASSWORD`: MySQL 密码（默认 `Pool@2024Secure`）
   - `DB_NAME`: 数据库名称（默认 `pool_hall_pos`）

---

### 第4步：启动应用

#### 方式1：使用启动脚本（推荐）

**Windows:**
```bash
.\start.bat
```

**macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

#### 方式2：手动启动

**终端1 - 启动后端：**
```bash
cd backend
npm install  # 如果还未安装依赖
node server.js
```

**终端2 - 启动前端：**
```bash
cd frontend
npm install  # 如果还未安装依赖
npm run dev
```

---

## ✅ 验证设置

### 检查后端连接

访问后端健康检查端点：
```bash
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"healthy","database":"MySQL connected"}
```

### 检查前端连接

1. 打开浏览器访问：http://localhost:5173 (或显示的实际端口)
2. 应该看到登录或仪表板页面
3. 点击"预约"、"会员"等页面，确保数据从 MySQL 正确加载

### 检查数据库连接

在 MySQL 命令行运行：
```sql
USE pool_hall_pos;
SELECT COUNT(*) as table_count FROM tables;
SELECT COUNT(*) as member_count FROM members;
SELECT COUNT(*) as transaction_count FROM transactions;
```

---

## 🔧 故障排除

### 问题1：连接被拒绝 `ECONNREFUSED`

**原因：** MySQL 服务未运行或使用了错误的端口

**解决方案：**
```bash
# 检查 MySQL 是否运行 (Windows)
sc query MySQL80

# 检查 MySQL 是否运行 (macOS)
brew services list | grep mysql

# 启动 MySQL (macOS)
brew services start mysql

# 启动 MySQL (Linux)
sudo systemctl start mysql
```

### 问题2：访问被拒绝 `Access Denied for user`

**原因：** 用户名或密码不正确

**解决方案：**
1. 检查 `.env` 文件中的用户名和密码
2. 验证用户是否已创建：
   ```sql
   SELECT User, Host FROM mysql.user;
   ```
3. 如果用户不存在，重新运行 `pool_hall_setup.sql`

### 问题3：未知数据库 `pool_hall_pos`

**原因：** 数据库未创建

**解决方案：**
```bash
# 完整文件路径（Windows）
mysql -u root -p < C:\Users\user\Downloads\Diagram\vpp\pool_system\pool_hall_setup.sql

# 完整文件路径（macOS）
mysql -u root -p < /Users/yourname/Downloads/Diagram/vpp/pool_system/pool_hall_setup.sql

# 或在 MySQL 命令行中
SOURCE /path/to/pool_hall_setup.sql;
```

### 问题4：数据未在前端显示

**原因：** 可能是 API 未正确连接到 MySQL

**解决方案：**
1. 检查后端日志，确保没有错误
2. 打开浏览器开发者工具（F12），检查网络请求
3. 访问 http://localhost:3001/health 验证后端可用
4. 检查 MySQL 连接配置是否正确

### 问题5：插入数据时报错 `Column doesn't exist`

**原因：** 表结构不匹配，可能是 SQL 脚本未完全执行

**解决方案：**
```sql
USE pool_hall_pos;
DESCRIBE tables;  -- 查看 tables 表结构
SHOW CREATE TABLE tables;  -- 查看完整的 CREATE 语句
```

---

## 📚 数据库结构

### 核心表说明

| 表名 | 用途 | 主要字段 |
|------|------|--------|
| **tables** | 台位管理 | id, name, status, capacity, elapsedSec, mergedWith |
| **reservations** | 预约管理 | id, name, phone, date, time, status, deposit |
| **members** | 会员管理 | id, name, phone, balance, points, tier, totalSpent |
| **inventory** | 库存管理 | id, name, qty, unit, minQty, category |
| **transactions** | 交易流水 | id, tableId, items, amount, paymentMethod, createdAt |
| **queue** | 等候队列 | id, name, phone, pax, position, status |
| **staff** | 员工管理 | id, name, phone, position, salary, hireDate, status |
| **rates** | 计费策略 | id, name, baseRate, period, multiplier |
| **settings** | 系统设置 | id, settingKey, settingValue, category |
| **menu_items** | 菜单项目 | id, name, price, category, available |

---

## 🔐 安全建议

1. **修改默认密码**
   ```sql
   ALTER USER 'pool_user'@'localhost' IDENTIFIED BY 'your_strong_password';
   FLUSH PRIVILEGES;
   ```

2. **限制用户权限**
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON pool_hall_pos.* TO 'pool_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **定期备份**
   ```bash
   mysqldump -u pool_user -p pool_hall_pos > backup.sql
   ```

4. **在生产环境中：**
   - 使用强密码
   - 启用 SSL 连接
   - 限制数据库访问 IP
   - 定期更新 MySQL 版本

---

## 📖 常用 SQL 命令

```sql
-- 登录 MySQL
mysql -u pool_user -p pool_hall_pos

-- 查看所有数据库
SHOW DATABASES;

-- 查看所有表
USE pool_hall_pos;
SHOW TABLES;

-- 查看表结构
DESCRIBE tables;

-- 查看当前用户
SELECT USER();

-- 导出数据
mysqldump -u pool_user -p pool_hall_pos > backup.sql

-- 导入数据
mysql -u pool_user -p pool_hall_pos < backup.sql

-- 查看表数据
SELECT * FROM tables;
SELECT * FROM members;
SELECT * FROM transactions;
```

---

## ✨ 完成！

恭喜！🎉 你的 MySQL 数据库现在已完全配置。

### 下一步：

1. ✅ 启动后端：`node backend/server.js`
2. ✅ 启动前端：`npm run dev` （在 `frontend` 目录）
3. ✅ 打开浏览器：http://localhost:5173
4. ✅ 开始测试应用程序！

如有问题，查看故障排除部分或检查后端日志。

---

**需要帮助？** 查看后端 `.env` 文件和 `db/config.js` 了解详细配置。
