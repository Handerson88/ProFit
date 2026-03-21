require('dotenv').config();
const { generateWorkoutStructuredPlan } = require('../services/openaiService');

async function test() {
  try {
    console.log("Testing Workout Generation...");
    const goal = "ganhar massa";
    const level = "iniciante";
    const days = "4 dias";
    const location = "academia";
    const duration = "45 minutos";
    const history = [];

    const plan = await generateWorkoutStructuredPlan(goal, level, days, location, duration, history);
    console.log("SUCCESS!");
    console.log(JSON.stringify(plan, null, 2));
  } catch (error) {
    console.error("FAILED!");
    console.error(error.message);
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
