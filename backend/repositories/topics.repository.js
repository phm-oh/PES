// backend/repositories/topics.repository.js
// Repository สำหรับจัดการหัวข้อการประเมิน (evaluation_topics)
const db = require('../db/knex');
const TABLE = 'evaluation_topics';

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE).select('*').orderBy('id', 'asc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงเฉพาะที่ active
exports.findActive = async () => {
  return db(TABLE).where({ active: 1 }).orderBy('id', 'asc');
};

// สร้างใหม่
exports.create = async (payload) => {
  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// แก้ไข
exports.update = async (id, payload) => {
  const data = {};
  if (payload.code !== undefined) data.code = payload.code;
  if (payload.title_th !== undefined) data.title_th = payload.title_th;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.weight !== undefined) data.weight = payload.weight;
  if (payload.active !== undefined) data.active = payload.active;

  await db(TABLE).where({ id }).update(data);
  return exports.findById(id);
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};

// นับจำนวน indicators ในหัวข้อ (สำหรับตรวจสอบก่อนลบ)
exports.countIndicators = async (topicId) => {
  const result = await db('indicators')
    .where({ topic_id: topicId })
    .count('* as count')
    .first();
  return result.count;
};