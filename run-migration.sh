#!/bin/bash
# สคริปต์สำหรับรัน database migration เพื่อเพิ่ม phone และ position fields

echo "🚀 กำลังเพิ่ม phone และ position columns ลงใน users table..."

# รัน SQL migration ผ่าน Docker
docker exec -i pes-db-1 mysql -uroot -proot_password pes < add-user-fields.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration สำเร็จ! profile editing ควรทำงานได้แล้ว"
  echo "📝 ทดสอบโดย: login แล้วกดแก้ไข profile"
else
  echo "❌ Migration ล้มเหลว กรุณาตรวจสอบ Docker container"
  echo "💡 ลองรันคำสั่งนี้: docker ps | grep pes-db"
fi
