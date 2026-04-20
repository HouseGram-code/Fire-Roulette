'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, RotateCcw, Users, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FireRoulette() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'ended'>('idle');
  const [partnerFound, setPartnerFound] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startSearching = () => {
    setStatus('searching');
    setPartnerFound(false);
    setError(null);
    
    // Simulate connection progress
    const progressInterval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setPartnerFound(true);
          setStatus('connected');
          setDuration(0);
          startTimer();
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const endConnection = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus('ended');
    
    // Show result for 1 second then go back to idle
    setTimeout(() => {
      setStatus('idle');
      setDuration(0);
      setConnectionProgress(0);
    }, 1000);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Status Card */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Status Header */}
          <div className="mb-6 text-center">
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-orange-400">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-xl font-bold">Готов к общению</span>
                  </div>
                  <p className="text-neutral-400 text-sm">Нажмите кнопку, чтобы найти собеседника</p>
                </motion.div>
              )}
              
              {status === 'searching' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <Users className="w-6 h-6" />
                    <span className="text-xl font-bold">Поиск собеседника...</span>
                  </div>
                  <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${connectionProgress}%` }}
                    />
                  </div>
                  <p className="text-neutral-400 text-sm">
                    {connectionProgress < 100 
                      ? 'Подключение к сети...' 
                      : 'Найден случайный собеседник!'}
                  </p>
                </motion.div>
              )}
              
              {status === 'connected' && (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xl font-bold">Связаны!</span>
                  </div>
                  <p className="text-neutral-400 text-sm">Осталось времени: {formatTime(duration)}</p>
                  <div className="text-4xl font-black text-white mt-2">{formatTime(duration)}</div>
                </motion.div>
              )}
              
              {status === 'ended' && (
                <motion.div
                  key="ended"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-red-400">
                    <PhoneOff className="w-6 h-6" />
                    <span className="text-xl font-bold">Соединение завершено</span>
                  </div>
                  <p className="text-neutral-400 text-sm">Время разговора: {formatTime(duration)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-4 w-full justify-center">
            {status === 'idle' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startSearching}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
              >
                <Users className="w-8 h-8 text-white" />
              </motion.button>
            )}
            
            {status === 'connected' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {/* Toggle mute */}}
                  className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                >
                  <MicOff className="w-6 h-6 text-neutral-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {/* Like partner */}}
                  className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                >
                  <Heart className="w-6 h-6 text-rose-500" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endConnection}
                  className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center hover:bg-red-500/30 transition-all"
                >
                  <PhoneOff className="w-8 h-8 text-red-500" />
                </motion.button>
              </>
            )}
            
            {status === 'ended' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatus('idle')}
                className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
              >
                <RotateCcw className="w-6 h-6 text-neutral-400" />
              </motion.button>
            )}
          </div>
          
          {/* Additional info */}
          <div className="mt-6 flex gap-6 text-neutral-500">
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-neutral-300">0</div>
              <div className="text-xs">Собеседники</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-neutral-300">0%</div>
              <div className="text-xs">Жалоб</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rules reminder */}
      <div className="mt-4 text-center">
        <p className="text-neutral-500 text-xs">
          Используя сервис, вы соглашаетесь с правилами использования
        </p>
      </div>
    </div>
  );
}