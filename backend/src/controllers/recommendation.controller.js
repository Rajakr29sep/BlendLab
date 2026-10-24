
import { getMLRecommendations } from '../services/ml.service.js';

export async function rankRecommendations(req, res) {
  try {
    const {
      productName = 'Plant-based Chicken Keema',
      material = 'Plant_Poultry_Matrix',
      textureTargets = {},
      preferredIngredients = [],
      excludedIngredients = [],
      topK = 3,
    } = req.body ?? {};

    if (
      typeof productName !== 'string' ||
      !productName.trim()
    ) {
      return res.status(400).json({
        message: 'productName must be a non-empty string.',
      });
    }

    if (
      !textureTargets ||
      typeof textureTargets !== 'object' ||
      Array.isArray(textureTargets)
    ) {
      return res.status(400).json({
        message: 'textureTargets must be an object.',
      });
    }

    if (
      !Number.isInteger(topK) ||
      topK < 1 ||
      topK > 10
    ) {
      return res.status(400).json({
        message: 'topK must be an integer between 1 and 10.',
      });
    }

    const result = await getMLRecommendations({
      productName: productName.trim(),
      material,
      textureTargets,
      preferredIngredients,
      excludedIngredients,
      topK,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Recommendation error:', error.message);

    return res.status(error.status || 503).json({
      message: 'Could not generate recommendations.',
      error: error.message,
    });
  }
}
