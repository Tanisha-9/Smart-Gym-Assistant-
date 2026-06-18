import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Flame, CheckCircle, Clock, Bell } from 'lucide-react';
import { habitAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function HabitsPage() {
  const { user } = useAppStore();
  const userId = user?._id || 'demo';
  const qc = useQueryClient();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [completed, setCompleted] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ['habit-analytics', userId, 30],
    queryFn: () => habitAPI.getAnalytics(userId, 30).then((r) => r.data),
  });

  const { data: streakData } = useQuery({
    queryKey: ['streak', userId],
    queryFn: () => habitAPI.getStreak(userId).then((r) => r.data),
  });

  const { data: prediction } = useQuery({
    queryKey: ['skip-prediction', userId],
    queryFn: () => habitAPI.predictSkip(userId).then((r) => r.data),
  });

  const logMutation = useMutation({
    mutationFn: () => habitAPI.logHabit(userId, {
      user_id: userId,
      date: new Date().toISOString(),
      workout_completed: completed,
      mood,
      energy_level: energy,
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['habit-analytics', userId]);
      qc.invalidateQueries(['streak', userId]);
      qc.invalidateQueries(['skip-prediction', userId]);
    },
  });

  const nudgeMutation = useMutation({
    mutationFn: () => habitAPI.sendNudge(userId).then((r) => r.data),
  });

  const chartData = analytics?.dates?.map((d, i) => ({
    date: d.slice(5),
    mood: analytics.mood[i],
    energy: analytics.energy[i],
    done: analytics.completed[i] * 5,
  })) || [];

  const riskColor =
    prediction?.skip_probability > 0.7
      ? 'text-red-400'
      : prediction?.skip_probability > 0.4
      ? 'text-yellow-400'
      : 'text-green-400';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Brain size={22} className="text-purple-400" /> Habit Tracker
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log today */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
          <h3 className="font-semibold">Log Today</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Workout completed?</label>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setCompleted(v)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    completed === v
                      ? v ? 'bg-green-600' : 'bg-red-600'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Mood: {mood}/5</label>
            <input type="range" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value))}
              className="w-full accent-purple-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Energy: {energy}/5</label>
            <input type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-indigo-500" />
          </div>

          <button
            onClick={() => logMutation.mutate()}
            disabled={logMutation.isPending}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {logMutation.isPending ? 'Saving...' : 'Save Today\'s Log'}
          </button>
        </div>

        {/* Streak + prediction */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Flame size={24} className="text-orange-400" />
              <div>
                <p className="text-2xl font-bold">{streakData?.streak ?? 0} days</p>
                <p className="text-sm text-gray-400">Current streak</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">{streakData?.total_workouts ?? 0} total workouts logged</p>
          </div>

          {streakData?.badges?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-sm text-gray-400 mb-2">Badges</p>
              <div className="flex flex-wrap gap-2">
                {streakData.badges.map((b) => (
                  <span key={b} className="text-sm px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-300">{b}</span>
                ))}
              </div>
            </div>
          )}

          {prediction && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm text-gray-400 mb-1">Skip Risk Today</p>
              <p className={`text-3xl font-bold mb-2 ${riskColor}`}>
                {Math.round((prediction.skip_probability || 0) * 100)}%
              </p>
              <p className="text-sm text-gray-300 mb-3">{prediction.recommended_nudge}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                Best time: {prediction.best_time_to_workout}
              </div>
            </div>
          )}

          <button
            onClick={() => nudgeMutation.mutate()}
            disabled={nudgeMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors"
          >
            <Bell size={16} />
            {nudgeMutation.data ? nudgeMutation.data.nudge.slice(0, 40) + '...' : 'Send Motivational Nudge'}
          </button>
        </div>

        {/* Analytics chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-medium text-sm text-gray-400 mb-4">30-Day Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="mood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Area type="monotone" dataKey="mood" stroke="#a855f7" fill="url(#mood)" strokeWidth={1.5} name="Mood" dot={false} />
              <Area type="monotone" dataKey="energy" stroke="#6366f1" fill="url(#energy)" strokeWidth={1.5} name="Energy" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-2 mt-3">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-sm text-gray-400">
              Completion rate: {Math.round((analytics?.completion_rate || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}