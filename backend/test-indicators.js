// backend/test-indicators.js
// Script ทดสอบว่า repository ดึงข้อมูลได้ครบหรือไม่

const db = require('./db/knex');

async function testIndicators() {
  try {
    console.log('🔍 Testing indicators query...\n');
    
    // Test 1: ดึงข้อมูลแบบง่าย
    const simple = await db('indicators').select('*').limit(1);
    console.log('✅ Simple query (indicators.*):', simple[0]);
    console.log('');
    
    // Test 2: ดึงข้อมูลพร้อม JOIN
    const withJoin = await db('indicators')
      .select(
        'indicators.id',
        'indicators.topic_id',
        'indicators.code',
        'indicators.name_th',
        'indicators.description',
        'indicators.type',
        'indicators.weight',
        'indicators.min_score',
        'indicators.max_score',
        'indicators.active',
        'indicators.created_at',
        'indicators.updated_at',
        'evaluation_topics.title_th as topic_name'
      )
      .leftJoin('evaluation_topics', 'indicators.topic_id', 'evaluation_topics.id')
      .limit(1);
    console.log('✅ With JOIN query:', withJoin[0]);
    console.log('');
    
    // Test 3: เช็คว่ามี weight และ active หรือไม่
    if (withJoin[0]) {
      console.log('📊 Fields check:');
      console.log('   - weight:', withJoin[0].weight);
      console.log('   - active:', withJoin[0].active);
      console.log('   - topic_name:', withJoin[0].topic_name);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testIndicators();