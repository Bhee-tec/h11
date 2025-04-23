'use client';
import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { WebApp } from '@twa-dev/types';

interface UserData {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  points: number;
  flxPoints: number;
}

const Header: FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  const balance = useMemo(() => {
    const flxPoints = user?.flxPoints ?? 0;
    return Number((flxPoints / 100).toFixed(2));
  }, [user?.flxPoints]); // Proper dependency array

  useEffect(() => {
    if (user?.flxPoints !== undefined) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.flxPoints]); // Specific dependency

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchUserData = async () => {
      try {
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
          throw new Error('Please open this app in Telegram');
        }

        const tg = window.Telegram.WebApp;
        await tg.ready();

        const { user: initUser } = tg.initDataUnsafe;
        if (!initUser?.id) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`/api/user?id=${initUser.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData: UserData = await response.json();
        setUser(userData);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load user data');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-purple-500 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <header className="px-2 sm:px-4" aria-label="User profile header">
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch mt-4 mb-4">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl px-4 py-3 flex items-center flex-1 min-w-0 group relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 bg-yellow-400/80 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          
          <div className="flex items-center gap-3 min-w-0 z-10">
            <span className={`text-2xl ${animate ? 'animate-bounce' : ''}`} aria-hidden="true">
              ⚡
            </span>
            <div className="flex flex-col min-w-0">
              <h1 className="font-semibold text-white text-sm md:text-base truncate" aria-label="User name">
                {user?.firstName || 'Telegram User'}
              </h1>
              <p className="font-semibold text-yellow-300 text-sm md:text-base flex items-center truncate" aria-label="FLX balance">
                <span className="mr-1" aria-hidden="true">🪙</span>
                {balance}
                <span className="ml-1 text-purple-200">$FLX</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 2.5s ease-in forwards;
        }
        .animate-bounce {
          animation: bounce 0.5s ease-in-out;
        }
      `}</style>
    </header>
  );
};

export default Header;