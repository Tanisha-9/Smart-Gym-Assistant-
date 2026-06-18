import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Utensils, Plus, ShoppingCart, Send } from 'lucide-react';
import { dietAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const MACRO_COLORS = ['#6366f1', '#22c55e', '#f59e0b'];

export default function DietPage() {
  const { user } = useAppStore();
  const userId = user?._id || 'demo';
  const qc = useQueryClient();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const { data: plan, refetch: genPlan, isLoading: planLoading } = useQuery({
    queryKey: ['diet-plan', userId],
    queryFn: () => dietAPI.generatePlan(userId).then((r) => r.data),
    enabled: false,
  });

  const { data: nutrition } = useQuery({
    queryKey: ['nutrition-summary', userId],
    queryFn: () => dietAPI.getNutritionSummary(userId).then((r) => r.data),
  });

  const { data: grocery } = useQuery({
    queryKey: ['grocery-list', userId],
    queryFn: () => dietAPI.getGroceryList(userId).then((r) => r.data),
    enabled: !!plan,
  });

  const chatMutation = useMutation({
    mutationFn: (msg) => dietAPI.chat(userId, msg).then((r) => r.data),
    onSuccess: (data, variables) => {
      setChatMessages((m) => [
        ...m,
        { role: 'user', text: variables },
        { role: 'ai', text: data.reply },
      ]);
    },
  });

  const macroData = plan?.meals?.length
    ? [
        { name: 'Protein', value: plan.meals.reduce((a, m) => a + m.protein_g, 0) },
        { name: 'Carbs',   value: plan.meals.reduce((a, m) => a + m.carbs_g, 0) },
        { name: 'Fats',    value: plan.meals.reduce((a, m) => a + m.fats_g, 0) },
      ]
    : [];

  const totalCal = plan?.meals?.reduce((a, m) => a + m.calories, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Utensils size={22} className="text-green-400" /> AI Dietician
        </h2>
        <button
          onClick={() => genPlan()}
          disabled={planLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {planLoading ? 'Generating...' : 'Generate Diet Plan'}
        </button>
      </div>

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meals */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Today's Meal Plan</h3>
              <span className="text-sm text-gray-400">{totalCal} kcal target</span>
            </div>
            {plan.meals.map((meal, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{meal.name}</h4>
                  <span className="text-sm text-green-400">{meal.calories} kcal</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mb-2">
                  <span>P: {meal.protein_g}g</span>
                  <span>C: {meal.carbs_g}g</span>
                  <span>F: {meal.fats_g}g</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meal.ingredients.map((ing) => (
                    <span key={ing} className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-400">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Macro chart + grocery */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-medium text-sm text-gray-400 mb-3">Macro Split</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {macroData.map((_, i) => (
                      <Cell key={i} fill={MACRO_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}g`} contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {macroData.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: MACRO_COLORS[i] }} />
                    {m.name}
                  </div>
                ))}
              </div>
            </div>

            {grocery && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-medium text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <ShoppingCart size={14} /> Grocery List
                </h3>
                <ul className="space-y-1.5">
                  {grocery.grocery_list.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diet chatbot */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold mb-4">Ask the Dietician</h3>
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {chatMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-xl text-sm max-w-sm ${
                m.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-200'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && chatInput.trim()) {
                chatMutation.mutate(chatInput.trim());
                setChatInput('');
              }
            }}
            placeholder="Ask about nutrition, recipes, calories..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 text-white placeholder-gray-500"
          />
          <button
            onClick={() => { chatMutation.mutate(chatInput.trim()); setChatInput(''); }}
            disabled={!chatInput.trim()}
            className="p-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}