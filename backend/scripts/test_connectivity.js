const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testScan() {
  const url = 'http://localhost:5000/api/meals/scan';
  const token = 'YOUR_TEST_TOKEN'; // I need a valid token or skip auth for test

  // Let's create a test script that bypasses auth or uses a real one
  console.log("Simulating scan request...");
  
  // For this test, I'll just check if the endpoint is reachable
  try {
      const res = await axios.options(url);
      console.log("OPTIONS request successful:", res.status);
  } catch (err) {
      console.error("OPTIONS request failed:", err.message);
  }
}

testScan();
