// routes/results.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/results.controller');
const requireAuth = require('../middlewares/requireAuth');

router.get('/me/:periodId', requireAuth, ctrl.getMyResults);
router.get('/evaluatee/:evaluateeId/:periodId', requireAuth, ctrl.getByEvaluatee);
router.get('/summary/:evaluateeId/:periodId', requireAuth, ctrl.getSummary);
router.post('/self/bulk', requireAuth, ctrl.saveSelfBulk);
router.post('/self', requireAuth, ctrl.saveSelf);
router.post('/evaluate/bulk', requireAuth, ctrl.evaluateBulk);
router.post('/evaluate', requireAuth, ctrl.evaluate);
router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.get);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;