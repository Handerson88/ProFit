const routes = [
  './routes/authRoutes',
  './routes/foodRoutes',
  './routes/mealRoutes',
  './routes/userRoutes',
  './routes/notificationRoutes',
  './routes/workoutRoutes',
  './routes/adminRoutes',
  './routes/aiRoutes'
];

routes.forEach(route => {
  try {
    console.log(`Testing ${route} loading...`);
    require(route);
    console.log(`${route} loaded successfully!`);
  } catch (err) {
    console.error(`FAILED to load ${route}:`);
    console.error(err);
    process.exit(1);
  }
});
