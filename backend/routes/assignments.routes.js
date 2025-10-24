// routes/assignments.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignments.controller');
const requireAuth = require('../middlewares/requireAuth');

router.get('/mine', requireAuth, ctrl.getMine);
router.post('/bulk', requireAuth, ctrl.createBulk);
router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.get);
router.post('/', requireAuth, ctrl.create);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;