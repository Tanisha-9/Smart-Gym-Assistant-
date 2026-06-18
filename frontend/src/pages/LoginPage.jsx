import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    age: 25, weight_kg: 70, height_cm: 175,
    fitness_goal: 'maintenance', diet_preference: 'none'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser, setToken, theme, setTheme } = useAppStore();
  const navigate = useNavigate();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const demoLogin = () => {
    setUser({
      name: 'Demo Athlete',
      email: 'demo@gymgenie.ai',
      age: 28,
      weight_kg: 75,
      height_cm: 178,
      fitness_goal: 'muscle_gain',
      diet_preference: 'none'
    });
    setToken('demo_token_' + Date.now());
    navigate('/');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await api.post('/users/register', form);
        setUser(res.data.user);
        setToken(res.data.token);
      } else {
        const res = await api.post('/users/login', {
          email: form.email, password: form.password
        });
        setUser(res.data.user);
        setToken(res.data.token);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  const field = (label, key, type = 'text', opts = {}) => (
    <div>
      <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
      {opts.options ? (
        <select
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {opts.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder={opts.placeholder || ''}
        />
      )}
    </div>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDark ? 'bg-gray-950' : 'bg-gray-100'
    }`}>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all z-50 ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-white hover:border-indigo-500'
            : 'bg-white border-gray-300 text-gray-800 hover:border-indigo-400'
        }`}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>GymGenie</h1>
          <p className={isDark ? 'text-gray-400 mt-1' : 'text-gray-500 mt-1'}>Your intelligent fitness companion</p>
        </div>

        {/* Card */}
        <div className={`border rounded-2xl p-6 space-y-4 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          {/* Tabs */}
          <div className={`flex gap-2 p-1 rounded-xl mb-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {['Login', 'Register'].map((t) => (
              <button
                key={t}
                onClick={() => setIsRegister(t === 'Register')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (t === 'Register') === isRegister
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {isRegister && field('Full Name', 'name', 'text', { placeholder: 'John Doe' })}
          {field('Email', 'email', 'email', { placeholder: 'you@example.com' })}
          {field('Password', 'password', 'password', { placeholder: '••••••••' })}

          {isRegister && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {field('Age', 'age', 'number')}
                {field('Weight (kg)', 'weight_kg', 'number')}
                {field('Height (cm)', 'height_cm', 'number')}
              </div>
              {field('Fitness Goal', 'fitness_goal', 'text', {
                options: [
                  { value: 'weight_loss', label: 'Weight Loss' },
                  { value: 'muscle_gain', label: 'Muscle Gain' },
                  { value: 'endurance',   label: 'Endurance' },
                  { value: 'flexibility', label: 'Flexibility' },
                  { value: 'maintenance', label: 'Maintenance' },
                ]
              })}
              {field('Diet Preference', 'diet_preference', 'text', {
                options: [
                  { value: 'none',       label: 'No preference' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'vegan',      label: 'Vegan' },
                  { value: 'keto',       label: 'Keto' },
                  { value: 'paleo',      label: 'Paleo' },
                ]
              })}
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          {/* Demo mode */}
          <p className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No backend?{' '}
            <button
              onClick={demoLogin}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Click here for Demo Mode
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}