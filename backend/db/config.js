// MySQL 数据库连接配置
require('dotenv').config()
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT) || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL 连接成功');
    console.log('   主机:', process.env.DB_HOST || '');
    console.log('   端口:', process.env.DB_PORT || '');
    console.log('   数据库:', process.env.DB_NAME || '');
    console.log('   用户:', process.env.DB_USER || '');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL 连接失败:', err.message);
    console.error('\n📋 错误诊断：');
    console.error('1. 确保 MySQL 服务已启动');
    console.error('2. 检查 .env 文件配置是否正确');
    console.error('3. 已运行 pool_hall_setup.sql 脚本？');
    console.error('\n🔧 当前配置：');
    console.error('   DB_HOST:', process.env.DB_HOST || '');
    console.error('   DB_USER:', process.env.DB_USER || '');
    console.error('   DB_NAME:', process.env.DB_NAME || '');
    console.error('\n📖 解决方案：');
    console.error('   1. 在 MySQL 命令行运行 pool_hall_setup.sql');
    console.error('   2. 或使用 MySQL GUI 工具运行 SQL 脚本');
    console.error('   3. 修改 .env 文件匹配你的 MySQL 配置');
    process.exit(1);
  });

module.exports = { pool };
