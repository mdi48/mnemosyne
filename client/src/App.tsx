import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import ProfilePageRoute from './pages/ProfilePageRoute';
import ActivityPage from './pages/ActivityPage';
import ManagePage from './pages/ManagePage';
import DiscoverPage from './pages/DiscoverPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:userId" element={<ProfilePageRoute />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
