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
  inspection_order: [],
  audit_log: []
};

// 如果数据文件不存在，创建它
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
}

const normalizeData = (data) => ({
  ...defaultData,
  ...data,
  user: Array.isArray(data.user) ? data.user : defaultData.user,
  patient: Array.isArray(data.patient) ? data.patient : defaultData.patient,
  medical_record: Array.isArray(data.medical_record) ? data.medical_record : defaultData.medical_record,
  inspection_order: Array.isArray(data.inspection_order) ? data.inspection_order : defaultData.inspection_order,
  audit_log: Array.isArray(data.audit_log) ? data.audit_log : defaultData.audit_log,
});

const readData = () => normalizeData(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const pad = (value) => `${value}`.padStart(2, '0');

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const toOrderRow = (item) => ({
  id: item.id,
  doctorName: item.doctor_name,
  patientId: item.patient_id,
  patientName: item.patient_name,
  itemsJson: typeof item.items_json === 'string' ? item.items_json : JSON.stringify(item.items_json || []),
  remark: item.remark || '',
  status: item.status || '待检查',
  createdAtText: formatDateTime(item.created_at),
  updatedAtText: formatDateTime(item.updated_at),
  createdAt: new Date(item.created_at).getTime(),
  updatedAt: new Date(item.updated_at).getTime(),
});

// 模拟 mysql2/promise 的接口
const pool = {
  query: async (sql, params = []) => {
    const data = readData();
    
    // 简单的 SQL 解析模拟 (仅支持本项目中使用的基本查询)
    if (sql.includes('CREATE TABLE IF NOT EXISTS inspection_order')) {
      if (!Array.isArray(data.inspection_order)) {
        data.inspection_order = [];
        writeData(data);
      }
      return [[]];
    }

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
      writeData(data);
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
      writeData(data);
      return [{ insertId: newLog.id }];
    }

    if (sql.includes('INSERT INTO inspection_order')) {
      const [doctorName, patientId, patientName, itemsJson, remark] = params;
      const now = new Date().toISOString();
      const existing = data.inspection_order.find(
        (item) => item.doctor_name === doctorName && item.patient_id === patientId
      );

      if (existing) {
        existing.patient_name = patientName;
        existing.items_json = itemsJson;
        existing.remark = remark || '';
        existing.status = '待检查';
        existing.updated_at = now;
        writeData(data);
        return [{ insertId: existing.id, affectedRows: 1 }];
      }

      const nextId =
        data.inspection_order.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
      const newOrder = {
        id: nextId,
        doctor_name: doctorName,
        patient_id: patientId,
        patient_name: patientName,
        items_json: itemsJson,
        remark: remark || '',
        status: '待检查',
        created_at: now,
        updated_at: now,
      };
      data.inspection_order.push(newOrder);
      writeData(data);
      return [{ insertId: nextId, affectedRows: 1 }];
    }

    if (sql.includes('UPDATE inspection_order')) {
      const [status, id, doctorName] = params;
      const target = data.inspection_order.find(
        (item) => Number(item.id) === Number(id) && item.doctor_name === doctorName
      );

      if (!target) {
        return [{ affectedRows: 0 }];
      }

      target.status = status;
      target.updated_at = new Date().toISOString();
      writeData(data);
      return [{ affectedRows: 1 }];
    }

    if (sql.includes('SELECT') && sql.includes('FROM inspection_order')) {
      let rows = data.inspection_order.map(toOrderRow);
      const hasDoctorCondition =
        sql.includes('WHERE doctor_name = ?') || sql.includes('AND doctor_name = ?');
      const hasPatientCondition =
        sql.includes('WHERE patient_id = ?') || sql.includes('AND patient_id = ?');

      if (sql.includes('WHERE id = ?')) {
        rows = rows.filter((item) => Number(item.id) === Number(params[0]));
        if (hasDoctorCondition) {
          rows = rows.filter((item) => item.doctorName === params[1]);
        } else if (hasPatientCondition) {
          rows = rows.filter((item) => item.patientId === params[1]);
        }
      } else {
        let paramIndex = 0;
        if (hasDoctorCondition) {
          rows = rows.filter((item) => item.doctorName === params[paramIndex]);
          paramIndex += 1;
        }
        if (hasPatientCondition) {
          rows = rows.filter((item) => item.patientId === params[paramIndex]);
        }
      }

      rows.sort((a, b) => {
        if (b.updatedAt !== a.updatedAt) {
          return b.updatedAt - a.updatedAt;
        }
        return b.id - a.id;
      });

      if (sql.includes('LIMIT 1')) {
        return [[rows[0]].filter(Boolean)];
      }

      return [rows];
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
