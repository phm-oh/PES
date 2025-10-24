// repositories/assignments.js
const db = require('../db/knex');
const TABLE = 'assignments';

// ยืนยันว่า evaluatee อยู่ในงวดนั้น (ไม่ผูก evaluator)
exports.hasEvaluateeInPeriod = async ({ period_id, evaluatee_id }) => {
  const row = await db(TABLE).where({ period_id, evaluatee_id }).first();
  return !!row;
};

// ยืนยันสิทธิ evaluator ต่อ evaluatee ในงวดนั้น
exports.hasPairInPeriod = async ({ period_id, evaluator_id, evaluatee_id }) => {
  const row = await db(TABLE)
    .where({ period_id, evaluator_id, evaluatee_id })
    .first();
  return !!row;
};


// ============================================================
// ✅ FUNCTIONS ใหม่ (CRUD + เพิ่มเติม)
// ============================================================

// ดึงทั้งหมด
exports.findAll = async () => {
  return db(TABLE).select('*').orderBy('created_at', 'desc');
};

// ดึงรายการเดียว
exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

// ดึงงานที่กรรมการได้รับมอบหมาย
exports.findByEvaluator = async (evaluatorId) => {
  return db(TABLE)
    .where({ evaluator_id: evaluatorId })
    .orderBy('created_at', 'desc');
};

// ดึงตาม period
exports.findByPeriod = async (periodId) => {
  return db(TABLE)
    .where({ period_id: periodId })
    .orderBy('created_at', 'desc');
};

// สร้างใหม่
exports.create = async (payload) => {
  // ตรวจสอบซ้ำด้วย hasPairInPeriod (ใช้ฟังก์ชันเดิม)
  const exists = await exports.hasPairInPeriod({
    period_id: payload.period_id,
    evaluator_id: payload.evaluator_id,
    evaluatee_id: payload.evaluatee_id
  });
  if (exists) throw new Error('Assignment already exists');

  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

// สร้างหลายรายการ
exports.createBulk = async (items) => {
  // ตรวจสอบซ้ำทั้งหมด
  for (const item of items) {
    const exists = await exports.hasPairInPeriod({
      period_id: item.period_id,
      evaluator_id: item.evaluator_id,
      evaluatee_id: item.evaluatee_id
    });
    if (exists) {
      throw new Error(`Assignment exists: evaluator ${item.evaluator_id} → evaluatee ${item.evaluatee_id}`);
    }
  }

  await db(TABLE).insert(items);
  return { created: items.length };
};

// ลบ
exports.remove = async (id) => {
  return db(TABLE).where({ id }).del();
};

// ลบทั้งหมดใน period
exports.removeByPeriod = async (periodId) => {
  return db(TABLE).where({ period_id: periodId }).del();
};