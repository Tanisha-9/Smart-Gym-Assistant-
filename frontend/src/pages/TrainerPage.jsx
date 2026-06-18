import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAppStore } from '../store/useAppStore';
import { trainerAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Play, Square, Dumbbell, AlertCircle, CheckCircle } from 'lucide-react';

const EXERCISES = [
  { id: 'squat',       label: 'Squat' },
  { id: 'bicep_curl',  label: 'Bicep Curl' },
  { id: 'push_up',     label: 'Push Up' },
  { id: 'lunge',       label: 'Lunge' },
  { id: 'deadlift',    label: 'Deadlift' },
];

export default function TrainerPage() {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const { user, repCount, formScore, corrections, updatePoseFeedback } = useAppStore();
  const userId = user?._id || 'demo';

  const [isActive, setIsActive] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [sessionTime, setSessionTime] = useState(0);

  // Fetch workout plan
  const { data: plan, refetch: generatePlan, isLoading: planLoading } = useQuery({
    queryKey: ['workout-plan', userId],
    queryFn: () => trainerAPI.generatePlan(userId).then((r) => r.data),
    enabled: false,
  });

  // Timer
  useEffect(() => {
    let timer;
    if (isActive) {
      timer = setInterval(() => setSessionTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isActive]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startSession = useCallback(() => {
    const WS_URL = `ws://localhost:8000/api/v1/trainer/ws/live-session/${userId}/${selectedExercise}`;
    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onmessage = (e) => {
      const feedback = JSON.parse(e.data);
      updatePoseFeedback(feedback);
    };

    wsRef.current.onopen = () => {
      setIsActive(true);
      setSessionTime(0);

      // Send frames every 200ms
      intervalRef.current = setInterval(() => {
        if (webcamRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          const canvas = webcamRef.current.getCanvas();
          if (!canvas) return;
          canvas.toBlob((blob) => {
            blob?.arrayBuffer().then((buf) => wsRef.current.send(buf));
          }, 'image/jpeg', 0.7);
        }
      }, 200);
    };
  }, [userId, selectedExercise, updatePoseFeedback]);

  const stopSession = useCallback(() => {
    clearInterval(intervalRef.current);
    wsRef.current?.close();
    setIsActive(false);
  }, []);

  const formColor = formScore >= 80 ? 'text-green-400' : formScore >= 60 ? 'text-yellow-400' : 'text-red-400';
  const formBg    = formScore >= 80 ? 'bg-green-500' : formScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Dumbbell size={22} className="text-indigo-400" /> AI Trainer
        </h2>
        <button
          onClick={() => generatePlan()}
          disabled={planLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {planLoading ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webcam + controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full"
              mirrored
              videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
            />
          </div>

          {/* Exercise picker */}
          <div className="flex gap-2 flex-wrap">
            {EXERCISES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExercise(ex.id)}
                disabled={isActive}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedExercise === ex.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Start/stop */}
          <button
            onClick={isActive ? stopSession : startSession}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
              isActive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isActive ? <><Square size={18} /> Stop Session</> : <><Play size={18} /> Start Session</>}
          </button>
        </div>

        {/* Live feedback panel */}
        <div className="space-y-4">
          {/* Timer */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Session Time</p>
            <p className="text-4xl font-mono font-bold">{formatTime(sessionTime)}</p>
          </div>

          {/* Rep counter */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Reps</p>
            <p className="text-5xl font-bold text-indigo-400">{repCount}</p>
          </div>

          {/* Form score */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Form Score</p>
              <p className={`text-xl font-bold ${formColor}`}>{formScore}/100</p>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${formBg}`}
                style={{ width: `${formScore}%` }}
              />
            </div>
          </div>

          {/* Corrections */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-3">Form Feedback</p>
            {corrections.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm">Great form! Keep it up.</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {corrections.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-yellow-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Workout plan */}
      {plan && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-1">{plan.title}</h3>
          <p className="text-sm text-gray-400 mb-4">
            {plan.difficulty} · {plan.estimated_duration_mins} min
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plan.exercises?.map((ex, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3">
                <p className="font-medium text-sm">{ex.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {ex.sets} sets × {ex.reps} reps
                  {ex.duration_secs ? ` · ${ex.duration_secs}s` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Rest: {ex.rest_secs}s</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}