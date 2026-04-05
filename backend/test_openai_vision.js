const { analyzeFoodImage } = require('./services/openaiService');
require('dotenv').config();

async function test() {
  console.log('Testing OpenAI Food Analysis...');
  try {
    // Create a dummy buffer (1x1 transparent pixel) or use a real path if available
    // But since I don't have a real image, I'll use a small buffer.
    const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const result = await analyzeFoodImage(dummyBuffer);
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Test Failed:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();
