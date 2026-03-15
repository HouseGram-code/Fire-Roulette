'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, X } from 'lucide-react';

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800 z-10"
        aria-label="Правила"
      >
        <MoreVertical className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">Правила рулетки</h2>
              
              <ul className="space-y-4 text-neutral-300">
                <li className="flex gap-3">
                  <span className="text-orange-500 font-bold">1.</span>
                  <span>Уважайте других собеседников.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-bold">2.</span>
                  <span>Запрещены оскорбления, угрозы и нецензурная брань.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-bold">3.</span>
                  <span>Не передавайте свои личные данные незнакомцам.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-bold">4.</span>
                  <span>Можно использовать до 12-15 лет (чат-рулетка безопасна).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-bold">5.</span>
                  <span>При нарушении правил ваш доступ может быть ограничен.</span>
                </li>
              </ul>

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
