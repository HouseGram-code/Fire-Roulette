'use client';

import { useState, useEffect, useRef } from 'react';

interface FireRouletteProps {
  onDisconnect?: () => void;
}

export default function FireRoulette({ onDisconnect }: FireRouletteProps) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'ended'>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = () => {
    setStatus('searching');
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setStatus('connected');
      setDuration(0);
    }, 2000);
  };

  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('ended');
    setTimeout(() => {
      setStatus('idle');
      setDuration(0);
      if (onDisconnect) onDisconnect();
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl p-1 shadow-2xl">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-2xl opacity-75 blur-sm animate-pulse"></div>
        
        <div className="relative bg-gray-900 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center">
          {/* Status Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {status === 'idle' && 'Огненная Рулетка'}
              {status === 'searching' && 'Поиск собеседника...'}
              {status === 'connected' && `Все в порядке! (${formatTime(duration)})`}
              {status === 'ended' && 'Соединение завершено'}
            </h2>
            <p className="text-gray-400 text-sm">
              {status === 'idle' && 'Найди собеседника для анонимного общения'}
              {status === 'searching' && 'Ищем подходящего человека для вас...'}
              {status === 'connected' && 'Вы общаетесь с анонимным собеседником'}
              {status === 'ended' && 'Нажмите кнопку, чтобы начать снова'}
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {status === 'idle' && (
              <div className="text-center space-y-6 w-full">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mx-auto flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-4xl">🔥</span>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30"
                >
                  Найти собеседника
                </button>
              </div>
            )}

            {status === 'searching' && (
              <div className="text-center space-y-6 w-full">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-12 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full border-4 border-purple-500 rounded-full animate-spin opacity-30"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-purple-400 text-sm">Найдено {Math.floor(Math.random() * 100)} подходящих пользователей</p>
                </div>
              </div>
            )}

            {status === 'connected' && (
              <div className="text-center space-y-8 w-full">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-4xl">🤝</span>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                      isMuted 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/30' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg'
                    }`}
                  >
                    <span>🎤</span>
                    <span>{isMuted ? 'Микрофон выкл' : 'Микрофон вкл'}</span>
                  </button>
                  
                  <button
                    onClick={handleEndCall}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30"
                  >
                    <span>🛑</span>
                    <span>Закончить</span>
                  </button>
                </div>
              </div>
            )}

            {status === 'ended' && (
              <div className="text-center space-y-6 w-full">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                    <span className="text-4xl">👋</span>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30"
                >
                  Начать снова
                </button>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-400 space-y-2">
            <p>Правила: Уважайте собеседника, не используйте нецензурные слова</p>
            <p className="text-xs opacity-70">Анонимный чат • Защита персональных данных</p>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}