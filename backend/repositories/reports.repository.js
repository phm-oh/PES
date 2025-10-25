// backend/repositories/reports.repository.js
// Repository สำหรับจัดการรายงานสรุปผลการประเมิน
const db = require('../db/knex');

// สรุปผลรายบุคคล (รายละเอียดครบ)
exports.getIndividualSummary = async (evaluateeId, periodId) => {
  // ข้อมูลพื้นฐาน
  const evaluatee = await db('users')
    .select('id', 'name_th', 'email', 'department_id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .select('departments.name_th as department_name')
    .where('users.id', evaluateeId)
    .first();

  if (!evaluatee) return null;

  // ข้อมูลรอบประเมิน
  const period = await db('evaluation_periods')
    .select('id', 'name_th', 'start_date', 'end_date')
    .where('id', periodId)
    .first();

  // ผลการประเมินแต่ละตัวชี้วัด
  const results = await db('evaluation_results as er')
    .select(
      'er.*',
      'i.name_th as indicator_name',
      'i.type as indicator_type',
      'i.weight as indicator_weight',
      't.title_th as topic_name',
      't.weight as topic_weight',
      'evaluator.name_th as evaluator_name'
    )
    .leftJoin('indicators as i', 'er.indicator_id', 'i.id')
    .leftJoin('evaluation_topics as t', 'i.topic_id', 't.id')
    .leftJoin('users as evaluator', 'er.evaluator_id', 'evaluator.id')
    .where('er.evaluatee_id', evaluateeId)
    .where('er.period_id', periodId)
    .orderBy('t.id', 'asc')
    .orderBy('i.id', 'asc');

  // ความคิดเห็นจากกรรมการ
  const comments = await db('evaluator_comments')
    .select(
      'evaluator_comments.*',
      'users.name_th as evaluator_name'
    )
    .leftJoin('users', 'evaluator_comments.evaluator_id', 'users.id')
    .where('evaluator_comments.evaluatee_id', evaluateeId)
    .where('evaluator_comments.period_id', periodId)
    .orderBy('evaluator_comments.created_at', 'desc');

  // ลายเซ็นกรรมการ
  const signatures = await db('signatures')
    .select(
      'signatures.*',
      'users.name_th as evaluator_name',
      'er.indicator_id'
    )
    .leftJoin('users', 'signatures.evaluator_id', 'users.id')
    .leftJoin('evaluation_results as er', 'signatures.result_id', 'er.id')
    .where('er.evaluatee_id', evaluateeId)
    .where('er.period_id', periodId)
    .groupBy('signatures.evaluator_id');

  // คำนวณคะแนนรวม
  const totalSelfScore = results.reduce((sum, r) => sum + (parseFloat(r.self_score) || 0), 0);
  const totalEvaluatorScore = results.reduce((sum, r) => sum + (parseFloat(r.evaluator_score) || 0), 0);
  const totalWeight = results.reduce((sum, r) => sum + (parseFloat(r.indicator_weight) || 0), 0);

  return {
    evaluatee,
    period,
    results,
    comments,
    signatures,
    summary: {
      total_indicators: results.length,
      total_self_score: totalSelfScore,
      total_evaluator_score: totalEvaluatorScore,
      total_weight: totalWeight,
      avg_self_score: results.length > 0 ? (totalSelfScore / results.length).toFixed(2) : 0,
      avg_evaluator_score: results.length > 0 ? (totalEvaluatorScore / results.length).toFixed(2) : 0
    }
  };
};

// สรุปผลรวมทั้งหมด (ภาพรวม)
exports.getOverallSummary = async (periodId) => {
  const summary = await db('evaluation_results as er')
    .select(
      'u.id as evaluatee_id',
      'u.name_th as evaluatee_name',
      'd.name_th as department_name'
    )
    .count('er.id as total_indicators')
    .avg('er.self_score as avg_self_score')
    .avg('er.evaluator_score as avg_evaluator_score')
    .sum('i.weight as total_weight')
    .leftJoin('users as u', 'er.evaluatee_id', 'u.id')
    .leftJoin('departments as d', 'u.department_id', 'd.id')
    .leftJoin('indicators as i', 'er.indicator_id', 'i.id')
    .where('er.period_id', periodId)
    .groupBy('u.id', 'u.name_th', 'd.name_th')
    .orderBy('u.name_th', 'asc');

  return summary;
};

// สรุปตามแผนก
exports.getDepartmentSummary = async (departmentId, periodId) => {
  const summary = await db('evaluation_results as er')
    .select(
      'u.id as evaluatee_id',
      'u.name_th as evaluatee_name',
      'u.email'
    )
    .count('er.id as total_indicators')
    .avg('er.self_score as avg_self_score')
    .avg('er.evaluator_score as avg_evaluator_score')
    .leftJoin('users as u', 'er.evaluatee_id', 'u.id')
    .where('u.department_id', departmentId)
    .where('er.period_id', periodId)
    .groupBy('u.id', 'u.name_th', 'u.email')
    .orderBy('u.name_th', 'asc');

  return summary;
};

// สรุปตามหัวข้อการประเมิน
exports.getTopicSummary = async (periodId) => {
  const summary = await db('evaluation_results as er')
    .select(
      't.id as topic_id',
      't.title_th as topic_name',
      't.weight as topic_weight'
    )
    .count('er.id as total_results')
    .avg('er.self_score as avg_self_score')
    .avg('er.evaluator_score as avg_evaluator_score')
    .leftJoin('indicators as i', 'er.indicator_id', 'i.id')
    .leftJoin('evaluation_topics as t', 'i.topic_id', 't.id')
    .where('er.period_id', periodId)
    .groupBy('t.id', 't.title_th', 't.weight')
    .orderBy('t.id', 'asc');

  return summary;
};

// ข้อมูลสำหรับ Export PDF
exports.getExportData = async (evaluateeId, periodId) => {
  return exports.getIndividualSummary(evaluateeId, periodId);
};