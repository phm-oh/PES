    const router = require('express').Router();
    // routes/users.routes.js
    const auth = require('../middlewares/auth');
    const ctrl = require('../controllers/users.controller');
 
    
// หมายเหตุเพื่อการสอน:
// - list/listServer/get: ให้ทุกบทบาทที่ล็อกอินแล้วเรียกได้ (admin/evaluator/evaluatee)
// - create/update/delete: ตัวอย่างนี้จำกัด admin (นักเรียนจะเห็นการควบคุมสิทธิ์ชัดเจน)

router.get('/server', auth('admin','evaluator','evaluatee'), ctrl.listServer);
// เพิ่ม 2 บรรทัดนี้หลัง router.get('/server', ...) 
// และก่อน router.get('/', ...)
router.get('/me', auth('admin','evaluator','evaluatee'), ctrl.getMe);
router.get('/role/:role', auth('admin','evaluator','evaluatee'), ctrl.getByRole);
router.get('/',       auth('admin','evaluator','evaluatee'), ctrl.list);
router.get('/:id',    auth('admin','evaluator','evaluatee'), ctrl.get);

router.post('/',      auth('admin'), ctrl.create);
// router.post('/',  ctrl.create);
router.put('/:id',    auth('admin'), ctrl.update);
router.delete('/:id', auth('admin'), ctrl.remove);

module.exports = router;








    module.exports = router;
