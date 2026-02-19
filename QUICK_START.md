# 🎯 池球馆 POS 系统 - 完整快速启动指南

## ⚡ 5分钟快速启动

### 前提条件
- ✅ MySQL 5.7+ 或 8.0+
- ✅ Node.js 14+
- ✅ npm 或 yarn

---

## 🚀 第1步：设置 MySQL 数据库（仅需一次）

### 1️⃣ 打开 MySQL 命令行

**Windows 用户：**
```bash
# 打开命令提示符或 PowerShell，然后运行：
mysql -u root -p
# 输入你的 MySQL 根密码
```

**macOS 用户：**
```bash
mysql -u root -p
```

**Linux 用户：**
```bash
mysql -u root -p
```

### 2️⃣ 执行初始化脚本

在 MySQL 控制台中输入（根据你的文件路径调整）：

**Windows 示例：**
```sql
SOURCE C:/Users/user/Downloads/Diagram/vpp/pool_system/pool_hall_setup.sql;
```

**macOS/Linux 示例：**
```sql
SOURCE /path/to/pool_hall_setup.sql;
```

### 3️⃣ 验证数据库创建成功

```sql
USE pool_hall_pos;
SHOW TABLES;
SELECT COUNT(*) FROM tables;
```

应该看到：
```
✅ 10 个表已创建
✅ 20 张台位已初始化
✅ 样本数据已导入
```

---

## 🏃 第2步：启动应用程序

### 选项 A：使用启动脚本（推荐）

**Windows：**
```bash
cd c:\Users\user\Downloads\Diagram\vpp\pool_system
start.bat
```

**macOS/Linux：**
```bash
cd /path/to/pool_system
chmod +x start.sh
./start.sh
```

### 选项 B：手动启动

**终端 1 - 启动后端：**
```bash
cd c:\Users\user\Downloads\Diagram\vpp\pool_system\backend
npm install  # 首次运行
node server.js
```

**终端 2 - 启动前端：**
```bash
cd c:\Users\user\Downloads\Diagram\vpp\pool_system\frontend
npm install  # 首次运行
npm run dev
```

---

## 🌐 第3步：打开应用

在浏览器中访问：
```
http://localhost:5175
```

或查看终端输出的端口（如果 5173/5174 被占用）

---

## ✅ 验证连接

### 检查后端健康状实
```bash
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"healthy","database":"MySQL connected"}
```

### 检查前端界面

1. 打开 http://localhost:5175
2. 点击"预约"或"会员" - 应该看到数据加载
3. 检查浏览器开发者工具（F12 → Console）- 应该无错误

### 检查 MySQL 数据

打开 MySQL 命令行：
```sql
USE pool_hall_pos;
SELECT * FROM tables LIMIT 1;
SELECT * FROM members;
SELECT COUNT(*) as transaction_count FROM transactions;
```

---

## ⚙️ 自定义配置

### 修改 MySQL 连接信息

编辑文件：`backend/.env`

```env
DB_HOST=localhost          # MySQL 主机
DB_PORT=3306              # MySQL 端口
DB_USER=pool_user         # MySQL 用户名
DB_PASSWORD=Pool@2024Secure  # MySQL 密码
DB_NAME=pool_hall_pos     # 数据库名
```

---

## 🔧 故障排除

### ❌ "MySQL 连接失败"

1. **检查 MySQL 是否运行**
   ```bash
   # Windows
   sc query MySQL80
   
   # macOS
   brew services list | grep mysql
   ```

2. **启动 MySQL**
   ```bash
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

3. **检查凭据**
   - 打开 `.env` 文件
   - 确保用户名/密码/数据库名称正确

4. **重新运行 SQL 脚本**
   ```bash
   mysql -u root -p < pool_hall_setup.sql
   ```

---

### ❌ "端口已在使用"

如果遇到 `Port 5173 is in use` 或类似错误：

1. **前端**：自动尝试 5174、5175
   - 查看终端输出找到实际端口
   - 访问该端口即可

2. **后端**（如果固执）：
   ```bash
   # 找到占用 3001 端口的进程
   # Windows
   netstat -ano | findstr :3001
   
   # macOS/Linux
   lsof -i :3001
   ```

---

### ❌ "无法加载数据"

1. 检查浏览器控制台（F12）
2. 查看网络选项卡，检查 API 请求
3. 确保后端响应 `/health` 端点
4. 检查后端日志中是否有 MySQL 错误

---

## 📊 功能检查清单

启动后，验证这些功能正常工作：

- [ ] [仪表板](http://localhost:5175) - 看到 20 张台位
- [ ] [预约页面](http://localhost:5175/reservations) - 加载预约列表
- [ ] [会员页面](http://localhost:5175/members) - 显示会员列表和样本数据
- [ ] [库存页面](http://localhost:5175/inventory) - 显示库存项目
- [ ] [交易页面](http://localhost:5175/transactions) - 显示样本交易
- [ ] [队列页面](http://localhost:5175/queue) - 显示等候列表
- [ ] [员工页面](http://localhost:5175/staff) - 显示员工列表
- [ ] [计费页面](http://localhost:5175/rates) - 显示计费策略
- [ ] [报表页面](http://localhost:5175/reports) - 显示 KPI 数据
- [ ] [设置页面](http://localhost:5175/settings) - 加载配置

---

## 💾 备份和恢复

### 备份数据库

```bash
mysqldump -u pool_user -p pool_hall_pos > backup.sql
```

### 恢复数据库

```bash
mysql -u pool_user -p pool_hall_pos < backup.sql
```

---

## 📝 文件结构

```
pool_system/
├── backend/
│   ├── db/
│   │   ├── config.js       ← MySQL 连接配置
│   │   └── services.js     ← 数据库服务层
│   ├── server.js           ← Express 服务器
│   ├── .env                ← 环境变量 ⚙️
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── mockApi.js  ← API 调用层
│   │   ├── context/
│   │   │   └── AppContext.jsx ← 状态管理
│   │   └── pages/          ← 11 个页面
│   └── package.json
├── pool_hall_setup.sql     ← MySQL 初始化脚本 📊
├── MYSQL_SETUP.md          ← MySQL 详细指南
├── COMPLETION_REPORT.md    ← 功能完成报告
├── start.bat               ← Windows 启动脚本
└── start.sh                ← Linux/Mac 启动脚本
```

---

## 🎯 主要功能

| 功能 | 页面 | 数据库表 |
|------|------|--------|
| 台位管理 | Dashboard | `tables` |
| 预约查询 | Reservations | `reservations` |
| 会员充值 | Members | `members` |
| 库存追踪 | Inventory | `inventory` |
| 交易记录 | Transactions | `transactions` |
| 等候队列 | Queue | `queue` |
| 员工管理 | Staff | `staff` |
| 计时策略 | Rates | `rates` |
| 系统配置 | Settings | `settings` |
| 销售报表 | Reports | `transactions` |

---

## 🔐 安全提示

⚠️ **生产环境之前：**

1. 修改 `.env` 中的默认密码
2. 启用 MySQL SSL 连接
3. 限制数据库访问 IP
4. 定期备份数据
5. 启用日志审计

---

## 📞 调试命令

```bash
# 检查 MySQL 状态
mysql -u pool_user -p -e "SELECT 1;"

# 查看所有数据库
mysql -u pool_user -p -e "SHOW DATABASES;"

# 查看表数据量
mysql -u pool_user -p pool_hall_pos -e "SELECT COUNT(*) FROM tables; SELECT COUNT(*) FROM members;"

# 查看后端日志
# (查看运行 node server.js 的终端)

# 查看前端日志
# (打开浏览器 F12 → Console 选项卡)
```

---

## ✨ 就完成了！

你现在有一个功能完整的池球馆 POS 系统，配备：

✅ MySQL 数据库（10 个表）  
✅ Express REST API（20+ 端点）  
✅ React 前端（11 个页面）  
✅ 实时 WebSocket 更新  
✅ 完整的离线支持（localStorage 回退）

### 下一步：

1. 🧪 测试所有页面和功能
2. 📊 在 Reports 页面查看样本数据
3. 💡 尝试添加新数据（预约、会员、库存等）
4. 📈 检查数据是否正确保存到 MySQL

---

**有问题？** 检查 `MYSQL_SETUP.md` 或 `IMPROVEMENTS.md` 了解详细信息

**需要 GUI 数据库工具？** 尝试：
- MySQL Workbench
- DBeaver（免费）
- Sequel Pro（macOS）
- Navicat

祝你工作愉快！ 🎉
