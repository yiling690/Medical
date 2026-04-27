const fs = require('fs');
const path = require('path');

// 模拟数据库文件路径
const DATA_FILE = path.join(__dirname, '../../data.json');

// 初始化默认数据
const defaultData = {
  user: [
    { id: 1, username: 'doctor01', password: '123456', role: 'doctor', name: '王医生', patient_id: null },
    { id: 2, username: 'patient01', password: '123456', role: 'patient', name: '张三', patient_id: 'P-202300123' }
  ],
  patient: [
    { id: 1, patient_no: 'P-202300123', name: '张三', gender: '男', age: 30, phone: '13800138000' }
  ],
  medical_record: [],
  audit_log: []
};

// 如果数据文件不存在，创建它
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
}

// 模拟 mysql2/promise 的接口
const pool = {
  query: async (sql, params = []) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // 简单的 SQL 解析模拟 (仅支持本项目中使用的基本查询)
    if (sql.includes('SELECT') && sql.includes('FROM user')) {
      const username = params[0];
      const role = params[1];
      const users = data.user.filter(u => u.username === username && (!role || u.role === role));
      return [users];
    }

    if (sql.includes('INSERT INTO user')) {
      const newUser = {
        id: data.user.length + 1,
        username: params[0],
        password: params[1],
        role: params[2],
        name: params[3],
        patient_id: params[4]
      };
      data.user.push(newUser);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      return [{ insertId: newUser.id }];
    }

    if (sql.includes('SELECT') && sql.includes('FROM patient')) {
      return [data.patient];
    }

    if (sql.includes('INSERT INTO audit_log')) {
      const newLog = {
        id: data.audit_log.length + 1,
        user_id: params[0],
        action: params[1],
        detail: params[2],
        ip_address: params[3],
        created_at: new Date().toISOString()
      };
      data.audit_log.push(newLog);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      return [{ insertId: newLog.id }];
    }

    if (sql.includes('SELECT') && sql.includes('FROM medical_record')) {
      return [data.medical_record];
    }

    // 其他查询返回空数组以防崩溃
    return [[]];
  },
  
  // 模拟初始化函数
  initializeDatabase: async () => {
    console.log('Using Local JSON Database (Mock Mode) - No MySQL required!');
    return true;
  }
};

module.exports = pool;
