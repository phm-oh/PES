// backend/repositories/signatures.repository.js
// Repository สำหรับจัดการลายเซ็นดิจิทัล
const db = require('../db/knex');
const TABLE = 'signatures';

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE)
    .select('signatures.*', 'users.name_th as evaluator_name')
    .leftJoin('users', 'signatures.evaluator_id', 'users.id')
    .orderBy('signatures.signed_at', 'desc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE)
    .select('signatures.*', 'users.name_th as evaluator_name')
    .leftJoin('users', 'signatures.evaluator_id', 'users.id')
    .where('signatures.id', id)
    .first();
};

// ดึงตาม result_id
exports.findByResult = async (resultId) => {
  return db(TABLE)
    .select('signatures.*', 'users.name_th as evaluator_name')
    .leftJoin('users', 'signatures.evaluator_id', 'users.id')
    .where('signatures.result_id', resultId)
    .orderBy('signatures.signed_at', 'desc');
};

// ดึงตาม evaluator_id
exports.findByEvaluator = async (evaluatorId) => {
  return db(TABLE)
    .select('signatures.*')
    .where({ evaluator_id: evaluatorId })
    .orderBy('signed_at', 'desc');
};

// ตรวจสอบว่ามีลายเซ็นแล้วหรือไม่
exports.exists = async (resultId, evaluatorId) => {
  const row = await db(TABLE)
    .where({ result_id: resultId, evaluator_id: evaluatorId })
    .first();
  return !!row;
};

// สร้างใหม่
exports.create = async (payload) => {
  // ตรวจสอบว่ามีลายเซ็นแล้วหรือไม่
  const exists = await exports.exists(payload.result_id, payload.evaluator_id);
  if (exists) {
    throw new Error('Signature already exists for this result and evaluator');
  }

  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};

// ลบตาม result_id (สำหรับกรณีต้องการลบทั้งหมด)
exports.removeByResult = async (resultId) => {
  return db(TABLE).where({ result_id: resultId }).del();
};