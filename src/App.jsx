import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Notifications from './pages/Notifications';
import Nutrition from './pages/Nutrition';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="lich-trinh" element={<Schedule />} />
        <Route path="thong-bao" element={<Notifications />} />
        <Route path="dinh-duong" element={<Nutrition />} />
        <Route path="ho-so" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
