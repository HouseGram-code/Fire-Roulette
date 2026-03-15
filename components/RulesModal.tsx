'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, X, Info, ShieldCheck, HelpCircle } from 'lucide-react';

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800 z-10"
        aria-label="О приложении"
      >
        <MoreVertical className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">О приложении</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Info className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Что это дает?</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Анонимное голосовое общение со случайными собеседниками. Вы можете найти новых друзей или просто приятно провести время за разговором.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Безопасность</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Ваши разговоры не записываются и не сохраняются на серверах. Соединение происходит напрямую между пользователями (P2P), что гарантирует максимальную приватность.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Как пользоваться?</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Авторизуйтесь через Google, нажмите «Начать поиск» и разрешите доступ к микрофону. Система автоматически подберет вам собеседника.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="mt-8 w-full py-3 bg-neutral-800 text-white rounded-xl font-medium hover:bg-neutral-700 transition-colors"
              >
                Понятно
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
