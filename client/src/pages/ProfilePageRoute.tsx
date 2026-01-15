import { useParams, useNavigate } from 'react-router-dom';
import ProfilePage from '../components/ProfilePage';
import { ThemeToggle } from '../components/ThemeToggle';

export default function ProfilePageRoute() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            ← Back to Quotes
          </button>
          <ThemeToggle />
        </div>
      </div>
      <ProfilePage 
        userId={userId}
        onUserClick={(userId) => navigate(`/profile/${userId}`)}
      />
    </div>
  );
}
