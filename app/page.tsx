import FireRoulette from '@/components/FireRoulette';
import RulesModal from '@/components/RulesModal';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
      <RulesModal />
      
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase">
            v1.0 beta
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 text-transparent bg-clip-text drop-shadow-sm">
            Огненная Рулетка
          </h1>
          <p className="text-neutral-400 font-medium text-lg">
            Случайные голосовые знакомства
          </p>
        </div>
        
        <FireRoulette />
      </div>
    </main>
  );
}
