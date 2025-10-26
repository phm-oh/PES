// routes/periods.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/periods.controller');
const auth = require('../middlewares/auth');

// ทุก route ต้อง login (auth() = ทุก role ผ่าน)
router.use(auth());

// Routes
router.get('/', ctrl.list);
// เพิ่ม route นี้ก่อน /:id
router.get('/active', ctrl.listActive);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;