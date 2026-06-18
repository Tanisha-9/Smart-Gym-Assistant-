import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Dumbbell, Flame, Apple, Brain, TrendingUp, Target } from 'lucide-react';
import { habitAPI, buddyAPI, poseAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, streak, skipProbability, setStreak, setSkipPrediction } = useAppStore();
  const userId = user?._id || 'demo';

  const { data: habits } = useQuery({
    queryKey: ['habit-analytics', userId],
    queryFn: () => habitAPI.getAnalytics(userId, 14).then((r) => r.data),
  });

  const { data: streakData } = useQuery({
    queryKey: ['streak', userId],
    queryFn: () => habitAPI.getStreak(userId).then((r) => r.data),
    onSuccess: (d) => setStreak(d.streak, d.badges),
  });

  const { data: skipData } = useQuery({
    queryKey: ['skip-prediction', userId],
    queryFn: () => habitAPI.predictSkip(userId).then((r) => r.data),
    onSuccess: (d) => setSkipPrediction(d.skip_probability),
  });

  const { data: weeklyReport } = useQuery({
    queryKey: ['weekly-report', userId],
    queryFn: () => poseAPI.getWeeklyReport(userId).then((r) => r.data),
  });

  const chartData = habits?.dates?.map((d, i) => ({
    date: d ? d.slice(5) : '',
    mood: habits?.mood?.[i] || 0,
    energy: habits?.energy?.[i] || 0,
    completed: habits?.completed?.[i] || 0,
  })) || [];

  const isLoading = !habits || !streakData;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading your fitness data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skip risk alert */}
      {skipData && skipData.skip_probability > 0.6 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-4">
          <Flame className="text-orange-400 shrink-0" size={24} />
          <div>
            <p className="font-medium text-orange-300">High skip risk today</p>
            <p className="text-sm text-orange-400/80">{skipData.recommended_nudge}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Workout Streak"
          value={`${streakData?.streak ?? streak} days`}
          sub={`${streakData?.total_workouts ?? 0} total workouts`}
          color="bg-orange-500/20 text-orange-400"
        />
        <StatCard
          icon={Target}
          label="Skip Risk"
          value={skipData ? `${Math.round(skipData.skip_probability * 100)}%` : '—'}
          sub={skipData?.best_time_to_workout ? `Best time: ${skipData.best_time_to_workout}` : ''}
          color="bg-red-500/20 text-red-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Performance"
          value={weeklyReport?.avg_score ? `${weeklyReport.avg_score}/100` : '—'}
          sub="This week"
          color="bg-indigo-500/20 text-indigo-400"
        />
        <StatCard
          icon={Brain}
          label="Completion Rate"
          value={habits ? `${Math.round((habits.completion_rate || 0) * 100)}%` : '—'}
          sub="Last 14 days"
          color="bg-green-500/20 text-green-400"
        />
      </div>

      {/* Badges */}
      {streakData?.badges?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Badges Earned</h3>
          <div className="flex flex-wrap gap-2">
            {streakData.badges.map((b) => (
              <span key={b} className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Mood & Energy (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} dot={false} name="Mood" />
              <Line type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={2} dot={false} name="Energy" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Workout Completions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}