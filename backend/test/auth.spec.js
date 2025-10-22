// ============================================================
//  วิชา: Software Testing & DevOps Integration
//  หัวข้อ: Integration Test ด้วย Vitest + Supertest
//  ตัวอย่างทดสอบ API /api/auth/login ของระบบ Backend จริง
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'  // ใช้ยิง HTTP Request จำลองโดยไม่ต้อง start server

// ------------------------------------------------------------
// 🔹 ขั้นตอนเตรียม Environment ก่อนทุก Test (Arrange ระดับ Global)
// ------------------------------------------------------------
beforeEach(() => {
  // ตั้งค่าตัวแปรสภาพแวดล้อมให้คงที่
  // เพื่อไม่ต้องพึ่ง .env ของระบบจริง (ทำให้ผลลัพธ์แน่นอนทุกครั้ง)
  process.env.JWT_SECRET = 'test-secret'
})

// ------------------------------------------------------------
// 🔹 Mock Repository: จำลองฐานข้อมูล (DB Layer)
// ------------------------------------------------------------
// การ mock ช่วยให้เทสท์ไม่ต้องต่อ MySQL จริง แต่ยังตรวจ logic ได้
vi.mock('../repositories/users', () => ({
  findByEmail: vi.fn(async (email) => {
    // จำลองข้อมูลผู้ใช้ที่มีอยู่ในระบบ (กรณีทดสอบ login สำเร็จ)
    if (email === 't.it01@ccollege.ac.th') {
      return {
        id: 4,
        email,
        name_th: 'ครูไอที 01',
        role: 'evaluatee',        // role ตาม ENUM จริงใน schema.sql
        password_hash: '$2b$10$dummy' // mock hash เพื่อให้ bcrypt.compare ใช้งานได้
      }
    }
    // ถ้าอีเมลไม่ตรง ให้คืน null เพื่อจำลอง “ไม่พบผู้ใช้”
    return null
  })
}))

// ------------------------------------------------------------
// 🔹 Mock bcrypt: จำลองการตรวจรหัสผ่าน
// ------------------------------------------------------------
// จริง ๆ bcrypt.compare จะ hash แล้วเทียบค่า แต่เราทำให้มันตอบ true/false ตรง ๆ
vi.mock('bcrypt', () => ({
  default: {
    compare: async (plain) => plain === 'password123' // ถูกต้องเมื่อรหัสผ่านเป็น "password123"
  }
}))

// ------------------------------------------------------------
// 🔹 นำเข้า Express App จริง (แต่ไม่ start server)
// ------------------------------------------------------------
import app from '../app'
// supertest จะจำลอง request ผ่าน app ได้โดยตรง เช่น request(app).post(...)

// ============================================================
// 🔸 เริ่มต้นชุดทดสอบ (Integration Test)
// ============================================================
describe('POST /api/auth/login', () => {

  // ----------------------------------------------------------
  // 🧩 CASE 1: ไม่ส่ง email/password → ควรได้ 400 Bad Request
  // ----------------------------------------------------------
  it('400 when email/password missing', async () => {
    // 🔹 Arrange: (เตรียมพร้อม) — mock และ env ถูก set แล้ว
    // 🔹 Act: ยิง request โดยไม่ส่ง body
    const r = await request(app).post('/api/auth/login').send({})
    // 🔹 Assert: ตรวจว่าระบบตอบ 400
    expect(r.status).toBe(400)
  })

  // ----------------------------------------------------------
  // 🧩 CASE 2: อีเมลไม่อยู่ในระบบ → 401 Unauthorized
  // ----------------------------------------------------------
  it('401 when email not found', async () => {
    const r = await request(app).post('/api/auth/login')
      .send({ email: 't.it01@ccollege.ac.th', password: 'password123' })
    expect(r.status).toBe(401)
  })

  // ----------------------------------------------------------
  // 🧩 CASE 3: อีเมลถูก แต่รหัสผ่านผิด → 401 Unauthorized
  // ----------------------------------------------------------
  it('401 when wrong password', async () => {
    const r = await request(app).post('/api/auth/login')
      .send({ email: 't.it01@ccollege.ac.th', password: 'password123' })
    expect(r.status).toBe(401)
  })

  // ----------------------------------------------------------
  // 🧩 CASE 4: ข้อมูลถูกต้อง → 200 OK + JWT Token + User Info
  // ----------------------------------------------------------
  it('200 returns accessToken and user', async () => {
    const r = await request(app).post('/api/auth/login')
      .send({ email: 't.it01@ccollege.ac.th', password: 'password123' })

    // ตรวจสอบผลลัพธ์ (Assert)
    expect(r.status).toBe(200)                 // สถานะ HTTP ต้องเป็น 200
    expect(r.body.success).toBe(true)          // success flag ต้องเป็น true
    expect(r.body).toHaveProperty('accessToken') // ต้องมี accessToken
    // ตรวจสอบข้อมูล user ว่ามีค่าตรงตาม mock ที่เตรียมไว้
    expect(r.body.user).toMatchObject({
      id: 4,
      email: 't.it01@ccollege.ac.th',
      role: 'evaluatee'
    })
  })
})
