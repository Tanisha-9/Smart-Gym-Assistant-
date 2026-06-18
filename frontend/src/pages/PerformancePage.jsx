import { useQuery } from '@tanstack/react-query';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { BarChart2, Trophy, Lightbulb } from 'lucide-react';
import { poseAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';

const EXERCISES = ['squat', 'bicep_curl', 'push_up', 'lunge', 'deadlift'];

export default function PerformancePage() {
  const { user } = useAppStore();
  const userId = user?._id || 'demo';
  const [selectedEx, setSelectedEx] = useState('squat');

  const { data: report } = useQuery({
    queryKey: ['weekly-report', userId],
    queryFn: () => poseAPI.getWeeklyReport(userId).then((r) => r.data),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', selectedEx],
    queryFn: () => poseAPI.getLeaderboard(selectedEx).then((r) => r.data),
  });

  const { data: tips } = useQuery({
    queryKey: ['improvement-tips', userId, selectedEx],
    queryFn: () => poseAPI.getImprovementTips(userId, selectedEx).then((r) => r.data),
  });

  const radarData = report?.by_exercise?.map((ex) => ({
    exercise: ex.name.replace('_', ' '),
    score: ex.avg_score,
  })) || [];

  const trendData = report?.trend?.map((t) => ({
    week: t.week,
    score: t.avg_score,
  })) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart2 size={22} className="text-blue-400" /> Performance Analyzer
      </h2>

      {/* Score overview */}
      {report && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Overall Score</p>
            <p className="text-4xl font-bold text-blue-400">{report.avg_score ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">out of 100</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Best Exercise</p>
            <p className="text-lg font-bold capitalize">{report.best_exercise?.replace('_', ' ') ?? '—'}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Sessions This Week</p>
            <p className="text-4xl font-bold text-indigo-400">{report.session_count ?? '—'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        {radarData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-medium text-sm text-gray-400 mb-4">Score by Exercise</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="exercise" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend */}
        {trendData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-medium text-sm text-gray-400 mb-4">Weekly Score Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Exercise selector + leaderboard + tips */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold mb-4">Exercise Deep Dive</h3>
        <div className="flex gap-2 flex-wrap mb-5">
          {EXERCISES.map((ex) => (
            <button
              key={ex}
              onClick={() => setSelectedEx(ex)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                selectedEx === ex ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {ex.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-yellow-400" /> Leaderboard
            </h4>
            {leaderboard?.leaderboard?.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.leaderboard.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-300">{entry._id?.slice(0, 8)}...</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-400">{Math.round(entry.avg_score)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No leaderboard data yet.</p>
            )}
          </div>

          {/* Tips */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-yellow-400" /> Improvement Tips
            </h4>
            {tips?.tips?.length > 0 ? (
              <ul className="space-y-2">
                {tips.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 shrink-0 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Complete a session to get personalized tips.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}