import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Star, Dumbbell, Trophy, CheckCircle } from 'lucide-react';
import { recommenderAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function RecommendPage() {
  const { user } = useAppStore();
  const userId = user?._id || 'demo';
  const [tab, setTab] = useState('gyms');
  const [location, setLocation] = useState(null);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) =>
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
  };

  const { data: gyms } = useQuery({
    queryKey: ['recommend-gyms', userId, location],
    queryFn: () => recommenderAPI.getGyms(userId, location.lat, location.lng).then((r) => r.data),
    enabled: !!location,
  });

  const { data: programs } = useQuery({
    queryKey: ['recommend-programs', userId],
    queryFn: () => recommenderAPI.getPrograms(userId).then((r) => r.data),
  });

  const { data: challenges } = useQuery({
    queryKey: ['recommend-challenges', userId],
    queryFn: () => recommenderAPI.getChallenges(userId).then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: (challengeId) => recommenderAPI.joinChallenge(userId, challengeId).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <MapPin size={22} className="text-pink-400" /> Discover
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {['gyms', 'programs', 'challenges'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-pink-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Gyms */}
      {tab === 'gyms' && (
        <div className="space-y-4">
          {!location ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <MapPin size={40} className="mx-auto mb-3 text-pink-400 opacity-60" />
              <p className="text-gray-400 mb-4">Allow location access to find nearby gyms</p>
              <button
                onClick={getLocation}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-xl text-sm font-medium transition-colors"
              >
                Share My Location
              </button>
            </div>
          ) : gyms?.gyms?.length > 0 ? (
            gyms.gyms.map((gym, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{gym.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star size={14} fill="currentColor" />
                    {gym.rating ?? '—'}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">{gym.address}</p>
                <p className="text-sm text-pink-400">{gym.distance_km?.toFixed(1)} km away</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">Searching for gyms near you...</p>
          )}
        </div>
      )}

      {/* Programs */}
      {tab === 'programs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programs?.programs?.map((prog, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <Dumbbell size={16} className="text-indigo-400" />
                </div>
                <h3 className="font-medium">{prog.title}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">{prog.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{prog.duration_weeks} weeks</span>
                <span className="capitalize px-2 py-0.5 bg-gray-800 rounded-full">{prog.difficulty}</span>
              </div>
            </div>
          )) || <p className="text-gray-500 text-sm col-span-2">No programs found. Complete your profile first.</p>}
        </div>
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {challenges?.challenges?.map((ch, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={18} className="text-yellow-400" />
                <h3 className="font-semibold">{ch.title}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">{ch.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{ch.duration_days} days</span>
                <button
                  onClick={() => joinMutation.mutate(ch.id)}
                  disabled={joinMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <CheckCircle size={12} />
                  Join Challenge
                </button>
              </div>
            </div>
          )) || <p className="text-gray-500 text-sm col-span-2">No challenges available right now.</p>}
        </div>
      )}
    </div>
  );
}