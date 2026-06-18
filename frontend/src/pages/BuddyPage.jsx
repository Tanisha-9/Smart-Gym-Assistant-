import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Smile, Frown, Meh } from 'lucide-react';
import { buddyAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation } from '@tanstack/react-query';

function MoodIcon({ emotion }) {
  if (emotion === 'energized' || emotion === 'positive') return <Smile size={14} className="text-green-400" />;
  if (emotion === 'discouraged' || emotion === 'fatigued') return <Frown size={14} className="text-red-400" />;
  return <Meh size={14} className="text-yellow-400" />;
}

export default function BuddyPage() {
  const { user, chatHistory, addChatMessage } = useAppStore();
  const userId = user?._id || 'demo';
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  const { data: motivation } = useQuery({
    queryKey: ['daily-motivation', userId],
    queryFn: () => buddyAPI.getDailyMotivation(userId).then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: (msg) => buddyAPI.chat(userId, msg).then((r) => r.data),
    onSuccess: (data, variables) => {
      addChatMessage({ role: 'user', text: variables });
      addChatMessage({
        role: 'ai',
        text: data.response,
        sentiment: data.sentiment,
        emotion: data.emotion,
      });
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(input.trim());
    setInput('');
  };

  const quickPrompts = [
    "I don't feel like working out today",
    "I just completed a tough session!",
    "What should I do for active recovery?",
    "I'm feeling really sore",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h2 className="font-bold">Alex — Your Gym Buddy</h2>
          <p className="text-xs text-gray-400">AI companion · Always here for you</p>
        </div>
      </div>

      {/* Daily motivation banner */}
      {motivation?.motivation && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 mb-4">
          <p className="text-sm text-indigo-300">
            <span className="font-medium">Today's motivation: </span>
            {motivation.motivation}
          </p>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p>Say hello to Alex! He's here to motivate and guide you.</p>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-100 rounded-bl-sm'
              }`}
            >
              {msg.text}
              {msg.emotion && (
                <div className="flex items-center gap-1 mt-1.5 opacity-70">
                  <MoodIcon emotion={msg.emotion} />
                  <span className="text-xs capitalize">{msg.emotion}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Talk to Alex..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={sendMutation.isPending || !input.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}