
import axios from 'axios';

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export async function getMLRecommendations(payload) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/recommendations`,
      payload,
      { timeout: 30000 }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      const mlError = new Error(
        error.response.data?.detail
          ? JSON.stringify(error.response.data.detail)
          : 'ML service returned an error'
      );

      mlError.status = error.response.status;
      throw mlError;
    }

    const connectionError = new Error(
      'Could not connect to the Python ML service. Check that it is running on port 8000.'
    );

    connectionError.status = 503;
    throw connectionError;
  }
}
