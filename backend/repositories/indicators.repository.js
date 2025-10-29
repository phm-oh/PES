// backend/repositories/indicators.repository.js
// Repository สำหรับจัดการตัวชี้วัด (indicators)
// ⭐ แก้ไข: ระบุฟิลด์ชัดเจน ไม่ใช้ * เพื่อให้แน่ใจว่าได้ weight + active

const db = require('../db/knex');
const TABLE = 'indicators';

// ดึงทั้งหมด พร้อม JOIN topics - แสดงทุกรายการไม่กรอง active
exports.findAll = async () => {
  return db(TABLE)
    .select(
      'indicators.id',
      'indicators.topic_id',
      'indicators.code',
      'indicators.name_th',
      'indicators.description',
      'indicators.type',
      'indicators.weight',
      'indicators.min_score',
      'indicators.max_score',
      'indicators.active',
      'indicators.created_at',
      'indicators.updated_at',
      'evaluation_topics.title_th as topic_name'
    )
    .leftJoin('evaluation_topics', 'indicators.topic_id', 'evaluation_topics.id')
    .orderBy('indicators.topic_id', 'asc')
    .orderBy('indicators.id', 'asc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงตาม topic_id พร้อม JOIN
exports.findByTopic = async (topicId) => {
  return db(TABLE)
    .select(
      'indicators.id',
      'indicators.topic_id',
      'indicators.code',
      'indicators.name_th',
      'indicators.description',
      'indicators.type',
      'indicators.weight',
      'indicators.min_score',
      'indicators.max_score',
      'indicators.active',
      'indicators.created_at',
      'indicators.updated_at',
      'evaluation_topics.title_th as topic_name'
    )
    .leftJoin('evaluation_topics', 'indicators.topic_id', 'evaluation_topics.id')
    .where('indicators.topic_id', topicId)
    .orderBy('indicators.id', 'asc');
};

// ดึงตาม type พร้อม JOIN
exports.findByType = async (type) => {
  return db(TABLE)
    .select(
      'indicators.id',
      'indicators.topic_id',
      'indicators.code',
      'indicators.name_th',
      'indicators.description',
      'indicators.type',
      'indicators.weight',
      'indicators.min_score',
      'indicators.max_score',
      'indicators.active',
      'indicators.created_at',
      'indicators.updated_at',
      'evaluation_topics.title_th as topic_name'
    )
    .leftJoin('evaluation_topics', 'indicators.topic_id', 'evaluation_topics.id')
    .where('indicators.type', type)
    .orderBy('indicators.topic_id', 'asc')
    .orderBy('indicators.id', 'asc');
};

// สร้างใหม่
exports.create = async (payload) => {
  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// แก้ไข - รองรับ active field
exports.update = async (id, payload) => {
  const data = {};
  if (payload.topic_id !== undefined) data.topic_id = payload.topic_id;
  if (payload.code !== undefined) data.code = payload.code;
  if (payload.name_th !== undefined) data.name_th = payload.name_th;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.type !== undefined) data.type = payload.type;
  if (payload.weight !== undefined) data.weight = payload.weight;
  if (payload.min_score !== undefined) data.min_score = payload.min_score;
  if (payload.max_score !== undefined) data.max_score = payload.max_score;
  if (payload.active !== undefined) data.active = payload.active;

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