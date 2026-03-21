require('dotenv').config();
const { analyzeFoodImage } = require('./services/openaiService');
const fs = require('fs');
const path = require('path');

async function testAnalysis() {
  console.log('Testing OpenAI Analysis...');
  console.log('API KEY prefix:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) : 'MISSING');
  
  // Create a dummy small image if none exists for testing
  const testImagePath = path.join(__dirname, 'test_image.jpg');
  if (!fs.existsSync(testImagePath)) {
    console.log('Test image not found. Please provide one.');
    return;
  }

  try {
    const result = await analyzeFoodImage(testImagePath);
    console.log('Analysis Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

testAnalysis();
