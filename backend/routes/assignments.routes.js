// backend/routes/assignments.routes.js
// Routes สำหรับจัดการ assignments (การมอบหมายงานประเมิน)
// ✨ แก้ไข: เพิ่ม route GET /mine สำหรับดึงงานของตัวเอง

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignments.controller');
const auth = require('../middlewares/auth');

// ทุก route ต้อง login
router.use(auth());



// ============================================================
// ✨ ส่วนเพิ่มเติม: GET /api/assignments/mine
// ต้องอยู่ก่อน GET /:id เพื่อไม่ให้ "mine" ถูกจับเป็น id
// ============================================================
router.get('/mine', ctrl.getMine);

// GET /api/assignments/:id - ดึงรายการเดียว
router.get('/:id', ctrl.get);

// GET /api/assignments - ดึงทั้งหมด (admin only)
router.get('/', ctrl.list);

// POST /api/assignments/bulk - สร้างหลายรายการ (admin only)
router.post('/bulk', ctrl.createBulk);

// POST /api/assignments - สร้างใหม่ (admin only)
router.post('/', ctrl.create);

// DELETE /api/assignments/:id - ลบ (admin only)
router.delete('/:id', ctrl.remove);

module.exports = router;