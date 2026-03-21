const db = require('../config/database');
const axios = require('axios');

exports.getAllFoods = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM foods ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch foods' });
  }
};

exports.searchFoods = async (req, res) => {
  const { q } = req.query;
  try {
    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query: q,
        api_key: process.env.USDA_API_KEY,
        pageSize: 15
      }
    });

    const foods = response.data.foods.map(food => {
      const getNutrient = (name) => {
        const nutrient = food.foodNutrients.find(n => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
        return nutrient ? nutrient.value : 0;
      };

      return {
        id: food.fdcId,
        name: food.description,
        calories: Math.round(getNutrient('energy')),
        protein: Math.round(getNutrient('protein') * 10) / 10,
        carbs: Math.round(getNutrient('carbohydrate') * 10) / 10,
        fat: Math.round(getNutrient('lipid') * 10) / 10
      };
    });

    res.json({ foods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Search failed' });
  }
};
