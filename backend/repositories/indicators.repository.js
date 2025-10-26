// backend/repositories/indicators.repository.js
// Repository สำหรับจัดการตัวชี้วัด (indicators)

const db = require('../db/knex');
const TABLE = 'indicators';

// ดึงทั้งหมด (เรียงตาม topic_id แล้วตาม id)
exports.findAll = async () => {
  return db(TABLE).select('*').orderBy('topic_id', 'asc').orderBy('id', 'asc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงตาม topic_id (เรียงตาม id)
exports.findByTopic = async (topicId) => {
  return db(TABLE).where({ topic_id: topicId }).orderBy('id', 'asc');
};

// ดึงตาม type
exports.findByType = async (type) => {
  return db(TABLE).where({ type }).orderBy('topic_id', 'asc').orderBy('id', 'asc');
};

// สร้างใหม่
exports.create = async (payload) => {
  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// แก้ไข
// ✨ แก้ไข: เพิ่ม code ใน update
exports.update = async (id, payload) => {
  const data = {};
  if (payload.topic_id !== undefined) data.topic_id = payload.topic_id;
  if (payload.code !== undefined) data.code = payload.code;        // ✨ เพิ่มบรรทัดนี้
  if (payload.name_th !== undefined) data.name_th = payload.name_th;
  if (payload.type !== undefined) data.type = payload.type;
  if (payload.weight !== undefined) data.weight = payload.weight;

  await db(TABLE).where({ id }).update(data);
  return exports.findById(id);
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};

// นับจำนวนใน topic
exports.countByTopic = async (topicId) => {
  const result = await db(TABLE).where({ topic_id: topicId }).count('* as count').first();
  return result.count;
};