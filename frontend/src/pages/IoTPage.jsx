import { useQuery, useMutation } from '@tanstack/react-query';
import { Cpu, Activity, Zap, Clock } from 'lucide-react';
import { iotAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const EQUIPMENT_ICONS = {
  treadmill: '🏃',
  bike: '🚴',
  weights: '🏋️',
  rowing: '🚣',
  elliptical: '⚡',
};

export default function IoTPage() {
  const { user } = useAppStore();
  const userId = user?._id || 'demo';
  const gymId = 'demo-gym';

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment-status', gymId],
    queryFn: () => iotAPI.getEquipmentStatus(gymId).then((r) => r.data),
    refetchInterval: 5000,  // Poll every 5 seconds
  });

  const { data: restRec } = useQuery({
    queryKey: ['recommend-rest', userId],
    queryFn: () => iotAPI.recommendRest(userId).then((r) => r.data),
  });

  const metricColor = (metric, value) => {
    if (metric === 'heart_rate') {
      if (value > 160) return 'text-red-400';
      if (value > 130) return 'text-yellow-400';
      return 'text-green-400';
    }
    return 'text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Cpu size={22} className="text-cyan-400" /> Smart Gym
        </h2>
        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live MQTT Feed
        </div>
      </div>

      {/* Rest recommendation */}
      {restRec && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-cyan-400 shrink-0" />
            <div>
              <p className="font-medium text-cyan-300">Rest Recommendation</p>
              <p className="text-sm text-cyan-400/80">
                {restRec.message || `Rest for ${restRec.recommended_rest_secs ?? 60}s before your next set`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Equipment grid */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Live Equipment Status</h3>
        {isLoading ? (
          <p className="text-gray-500 text-sm">Connecting to sensors...</p>
        ) : equipment?.equipment?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.equipment.map((eq, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{EQUIPMENT_ICONS[eq.equipment_type] || '⚙️'}</span>
                  <div>
                    <p className="font-medium capitalize">{eq.equipment_type}</p>
                    <p className="text-xs text-gray-500">ID: {eq.device_id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Activity size={12} />
                      {eq.metric}
                    </span>
                    <span className={`text-lg font-bold ${metricColor(eq.metric, eq.value)}`}>
                      {eq.value} <span className="text-xs font-normal text-gray-500">{eq.unit}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-600">
                    Updated: {new Date(eq.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <Cpu size={40} className="mx-auto mb-3 text-cyan-400 opacity-30" />
            <p className="text-gray-400 text-sm">No IoT devices connected yet.</p>
            <p className="text-gray-600 text-xs mt-1">
              Connect your gym equipment via MQTT to see live data here.
            </p>
          </div>
        )}
      </div>

      {/* MQTT connection info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" /> Device Setup
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          Publish IoT readings to this MQTT topic structure:
        </p>
        <code className="block bg-gray-800 rounded-lg p-3 text-xs text-cyan-300 font-mono">
          Topic: gym/equipment/&#123;device_id&#125;<br />
          Payload: {JSON.stringify({
            device_id: "treadmill-01",
            equipment_type: "treadmill",
            metric: "speed",
            value: 8.5,
            unit: "km/h",
            gym_id: "demo-gym",
            user_id: userId
          }, null, 2)}
        </code>
      </div>
    </div>
  );
}