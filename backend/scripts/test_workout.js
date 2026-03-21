require('dotenv').config();
const { generateWorkoutPlanText } = require('../services/openaiService');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function testGeneration() {
  console.log('--- DIAGNOSTIC TEST ---');
  console.log('Testing OpenAI Key:', process.env.OPENAI_API_KEY ? 'Present (sk-proj...)' : 'MISSING');
  
  try {
    console.log('Calling generateWorkoutPlanText...');
    const plan = await generateWorkoutPlanText('ganhar massa', 'intermediário', '3 dias', 'academia', '60 minutos');
    console.log('✅ OpenAI Success! Plan length:', plan.length);
    console.log('Plan Preview:', plan.substring(0, 100) + '...');
    
    console.log('Testing Database Write...');
    // We'll use a dummy UUID for user_id just to test the table
    // But wait, it needs a valid user_id if we have FK constraints.
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
       console.log('⚠️ No users found in DB, skipping database write test.');
    } else {
       const userId = userRes.rows[0].id;
       await db.query(
         `INSERT INTO workout_plans (id, user_id, goal, level, days_per_week, location, duration, plan_text)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
         [uuidv4(), userId, 'test', 'test', 'test', 'test', 'test', 'Test plan content']
       );
       console.log('✅ Database Write Success!');
       
       // Cleanup test data
       await db.query("DELETE FROM workout_plans WHERE goal = 'test'");
       console.log('✅ Database Cleanup Success!');
    }
    
    console.log('--- DIAGNOSTIC COMPLETE: ALL SYSTEMS NOMINAL ---');
  } catch (err) {
    console.error('❌ DIAGNOSTIC FAILED:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

testGeneration();
