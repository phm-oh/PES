// backend/routes/comments.routes.js
// Routes สำหรับจัดการความคิดเห็นกรรมการ
const router = require('express').Router();
const ctrl = require('../controllers/comments.controller');
const auth = require('../middlewares/auth');

// ทุก route ต้อง login
router.use(auth());

// Routes (เรียงตาม path ที่เฉพาะเจาะจงก่อน)
router.get('/evaluatee/:evaluateeId/period/:periodId', ctrl.getByEvaluateeAndPeriod);
router.get('/evaluator/:evaluatorId', ctrl.getByEvaluator);
router.get('/period/:periodId', ctrl.getByPeriod);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;