import axios from 'axios';

const API_PORT = 8080;
const BASE_URL = `http://${window.location.hostname}:${API_PORT}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Trainer ──────────────────────────────────────────
export const trainerAPI = {
  generatePlan: (userId) => api.post(`/trainer/generate-plan/${userId}`),
  getHistory: (userId) => api.get(`/trainer/history/${userId}`),
  analyzeFrame: (userId, exercise, formData) =>
    api.post(`/trainer/analyze-frame?exercise=${exercise}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Dietician ─────────────────────────────────────────
export const dietAPI = {
  generatePlan: (userId) => api.post(`/dietician/generate-plan/${userId}`),
  logMeal: (userId, meal) => api.post(`/dietician/log-meal/${userId}`, meal),
  getGroceryList: (userId) => api.get(`/dietician/grocery-list/${userId}`),
  chat: (userId, message) =>
    api.post(`/dietician/chat?user_id=${userId}&message=${encodeURIComponent(message)}`),
  getNutritionSummary: (userId) => api.get(`/dietician/nutrition-summary/${userId}`),
};

// ── Habit Tracker ─────────────────────────────────────
export const habitAPI = {
  logHabit: (userId, log) => api.post(`/habits/log/${userId}`, log),
  predictSkip: (userId) => api.get(`/habits/predict-skip/${userId}`),
  sendNudge: (userId) => api.post(`/habits/send-nudge/${userId}`),
  getStreak: (userId) => api.get(`/habits/streak/${userId}`),
  getAnalytics: (userId, days = 30) => api.get(`/habits/analytics/${userId}?days=${days}`),
  adjustSchedule: (userId) => api.put(`/habits/adjust-schedule/${userId}`),
};

// ── Virtual Buddy ─────────────────────────────────────
export const buddyAPI = {
  chat: (userId, message) =>
    api.post(`/buddy/chat/${userId}?message=${encodeURIComponent(message)}`),
  getMoodHistory: (userId, days = 7) => api.get(`/buddy/mood-history/${userId}?days=${days}`),
  getDailyMotivation: (userId) => api.post(`/buddy/daily-motivation/${userId}`),
};

// ── Pose Analyzer ─────────────────────────────────────
export const poseAPI = {
  getWeeklyReport: (userId) => api.get(`/pose/weekly-report/${userId}`),
  getLeaderboard: (exercise) => api.get(`/pose/leaderboard?exercise=${exercise}`),
  getImprovementTips: (userId, exercise) =>
    api.get(`/pose/improvement-tips/${userId}/${exercise}`),
};

// ── Recommender ───────────────────────────────────────
export const recommenderAPI = {
  getGyms: (userId, lat, lng) =>
    api.get(`/recommend/gyms?user_id=${userId}&lat=${lat}&lng=${lng}`),
  getPrograms: (userId) => api.get(`/recommend/programs/${userId}`),
  getChallenges: (userId) => api.get(`/recommend/challenges/${userId}`),
  joinChallenge: (userId, challengeId) =>
    api.post(`/recommend/join-challenge/${userId}/${challengeId}`),
};

// ── IoT ───────────────────────────────────────────────
export const iotAPI = {
  getEquipmentStatus: (gymId) => api.get(`/iot/equipment-status/${gymId}`),
  recommendRest: (userId) => api.get(`/iot/recommend-rest/${userId}`),
};

export default api;