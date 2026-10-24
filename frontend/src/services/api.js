import axios from 'axios';
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', timeout: 15000 });
export const api = {
  health: async () => (await client.get('/health')).data,
  getDatasetSummary: async () => (await client.get('/datasets/summary')).data,
  rankRecommendations: async (payload) => (await client.post('/recommendations/rank', payload)).data,
  saveExperiment: async (payload) => (await client.post('/experiments', payload)).data,
};
export default client;