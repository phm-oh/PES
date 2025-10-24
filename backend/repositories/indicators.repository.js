// repositories/indicators.repository.js
const db = require('../db/knex');
const TABLE = 'indicators';

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE).select('*').orderBy('topic_id', 'asc').orderBy('order', 'asc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงตาม topic_id
exports.findByTopic = async (topicId) => {
  return db(TABLE).where({ topic_id: topicId }).orderBy('order', 'asc');
};

// ดึงตาม type
exports.findByType = async (type) => {
  return db(TABLE).where({ type }).orderBy('topic_id', 'asc').orderBy('order', 'asc');
};

// สร้างใหม่
exports.create = async (payload) => {
  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// แก้ไข
exports.update = async (id, payload) => {
  const data = {};
  if (payload.topic_id !== undefined) data.topic_id = payload.topic_id;
  if (payload.name_th !== undefined) data.name_th = payload.name_th;
  if (payload.type !== undefined) data.type = payload.type;
  if (payload.weight !== undefined) data.weight = payload.weight;
  if (payload.order !== undefined) data.order = payload.order;

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