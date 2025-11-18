import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkAuth, ClerkSignUp } from './components/auth/ClerkAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { Institutions } from './pages/Institutions';
import { Curricula } from './pages/Curricula';
import { Jobs } from './pages/Jobs';
import { Analytics } from './pages/Analytics';
import { Analysis } from './pages/Analysis';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in/*" element={<ClerkAuth />} />
        <Route path="/sign-up/*" element={<ClerkSignUp />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="institutions" element={<Institutions />} />
          <Route path="curricula" element={<Curricula />} />
          <Route path="analysis/:id" element={<Analysis />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
