import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // ── Auth ──────────────────────────────────────
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      // ── Theme ─────────────────────────────────────
      theme: localStorage.getItem('gymgenie_theme') || 'dark',
      setTheme: (theme) => {
        localStorage.setItem('gymgenie_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      // ── Active Workout ─────────────────────────────
      activeWorkout: null,
      workoutTimer: 0,
      repCount: 0,
      formScore: 0,
      corrections: [],
      setActiveWorkout: (workout) => set({ activeWorkout: workout, repCount: 0, formScore: 0 }),
      updatePoseFeedback: (feedback) => set({
        repCount: feedback.rep_count,
        formScore: feedback.form_score,
        corrections: feedback.corrections,
      }),
      clearWorkout: () => set({ activeWorkout: null, repCount: 0, formScore: 0, corrections: [] }),

      // ── Diet ──────────────────────────────────────
      currentDietPlan: null,
      dailyCaloriesConsumed: 0,
      setDietPlan: (plan) => set({ currentDietPlan: plan }),
      addCalories: (cal) => set((s) => ({ dailyCaloriesConsumed: s.dailyCaloriesConsumed + cal })),

      // ── Habit ─────────────────────────────────────
      streak: 0,
      badges: [],
      skipProbability: null,
      setStreak: (streak, badges) => set({ streak, badges }),
      setSkipPrediction: (prob) => set({ skipProbability: prob }),

      // ── Buddy / Chat ──────────────────────────────
      chatHistory: [],
      currentMood: 'positive',
      addChatMessage: (msg) => set((s) => ({
        chatHistory: [...s.chatHistory.slice(-50), msg],
        currentMood: msg.sentiment === 'POSITIVE' ? 'positive' : 'negative',
      })),

      // ── Notifications ─────────────────────────────
      notifications: [],
      addNotification: (n) => set((s) => ({
        notifications: [n, ...s.notifications.slice(0, 9)],
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'gymgenie-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        streak: state.streak,
        badges: state.badges,
        theme: state.theme,
      }),
    }
  )
);