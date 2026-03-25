const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testFlow() {
  console.log('--- Starting Auth Flow Test ---');
  
  const testUser = {
    name: 'Test Athlete',
    email: `test_${Date.now()}@example.com`,
    password: 'password123'
  };

  try {
    // 1. Register
    console.log(`1. Registering user: ${testUser.email}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    const { token, user } = regRes.data;
    console.log('SUCCESS: User registered. ID:', user.id);

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('SUCCESS: Login successful.');

    const authToken = token;

    // 3. Submit Quiz (Onboarding)
    console.log('3. Submitting quiz data...');
    const quizData = {
      age: 25,
      gender: 'male',
      height: 180,
      current_weight: 80,
      goal: 'Ganhar massa',
      activity_level: 'Moderadamente ativo',
      target_weight: 85,
      daily_calorie_target: 3000
    };

    const quizRes = await axios.post(`${API_URL}/user/quiz`, quizData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('SUCCESS: Quiz submitted. Calorie target:', quizRes.data.daily_calorie_target);

    // 4. Verify Profile
    console.log('4. Verifying final profile state...');
    const profileRes = await axios.get(`${API_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const finalUser = profileRes.data;
    
    if (finalUser.onboarding_completed) {
      console.log('SUCCESS: onboarding_completed is TRUE');
    } else {
      console.error('FAILED: onboarding_completed is still FALSE');
    }

    if (Number(finalUser.daily_calorie_target) === 3000) {
       console.log('SUCCESS: daily_calorie_target is 3000');
    } else {
       console.error('FAILED: daily_calorie_target mismatch:', finalUser.daily_calorie_target);
    }

    console.log('--- AUTH FLOW TEST COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('--- TEST FAILED ---');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

testFlow();
