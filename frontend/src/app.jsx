import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TrainerPage from './pages/TrainerPage';
import DietPage from './pages/DietPage';
import HabitsPage from './pages/HabitsPage';
import BuddyPage from './pages/BuddyPage';
import PerformancePage from './pages/PerformancePage';
import RecommendPage from './pages/RecommendPage';
import IoTPage from './pages/IoTPage';
import LoginPage from './pages/LoginPage';
import { useAppStore } from './store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function PrivateRoute({ children }) {
  const token = useAppStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="trainer"     element={<TrainerPage />} />
            <Route path="diet"        element={<DietPage />} />
            <Route path="habits"      element={<HabitsPage />} />
            <Route path="buddy"       element={<BuddyPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="recommend"   element={<RecommendPage />} />
            <Route path="iot"         element={<IoTPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}