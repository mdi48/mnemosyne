import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(initialView);

  // Reset view when modal opens or initialView changes
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="relative">
        {view === 'login' ? (
          <Login
            onSwitchToRegister={() => setView('register')}
            onClose={onClose}
          />
        ) : (
          <Register
            onSwitchToLogin={() => setView('login')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
