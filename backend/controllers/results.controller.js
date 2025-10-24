// controllers/results.controller.js
const repo = require('../repositories/results.repository');

// GET /api/results
exports.list = async (req, res, next) => {
  try {
    const items = await repo.findAll();
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/:id
exports.get = async (req, res, next) => {
  try {
    const item = await repo.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/me/:periodId
exports.getMyResults = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const items = await repo.findByEvaluateePeriod(userId, req.params.periodId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/evaluatee/:evaluateeId/:periodId
exports.getByEvaluatee = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    const items = await repo.findByEvaluateePeriod(evaluateeId, periodId);
    res.json({ success: true, items, total: items.length });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/self
exports.saveSelf = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { indicator_id, period_id, score } = req.body;
    if (!indicator_id) return res.status(400).json({ success: false, message: 'indicator_id required' });
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (score === undefined) return res.status(400).json({ success: false, message: 'score required' });

    const result = await repo.saveSelf(userId, indicator_id, period_id, score);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/self/bulk
exports.saveSelfBulk = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period_id, items } = req.body;
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

    const result = await repo.saveBulk(userId, period_id, items, 'self_score');
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/evaluate
exports.evaluate = async (req, res, next) => {
  try {
    const { evaluatee_id, indicator_id, period_id, score } = req.body;
    if (!evaluatee_id) return res.status(400).json({ success: false, message: 'evaluatee_id required' });
    if (!indicator_id) return res.status(400).json({ success: false, message: 'indicator_id required' });
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (score === undefined) return res.status(400).json({ success: false, message: 'score required' });

    const result = await repo.saveEvaluator(evaluatee_id, indicator_id, period_id, score);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// POST /api/results/evaluate/bulk
exports.evaluateBulk = async (req, res, next) => {
  try {
    const { evaluatee_id, period_id, items } = req.body;
    if (!evaluatee_id) return res.status(400).json({ success: false, message: 'evaluatee_id required' });
    if (!period_id) return res.status(400).json({ success: false, message: 'period_id required' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

    const result = await repo.saveBulk(evaluatee_id, period_id, items, 'evaluator_score');
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

// GET /api/results/summary/:evaluateeId/:periodId
exports.getSummary = async (req, res, next) => {
  try {
    const { evaluateeId, periodId } = req.params;
    const summary = await repo.calculateFinal(evaluateeId, periodId);
    res.json({ success: true, data: summary });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/results/:id
exports.remove = async (req, res, next) => {
  try {
    const deleted = await repo.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
};