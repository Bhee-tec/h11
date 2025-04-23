'use client';

import { useState, useEffect } from "react";
import type { FC } from "react";

interface GameDataProps {
  score: number;
  currentMoves: number;
  totalMoves: number;
}

const GameData: FC<GameDataProps> = ({ 
  score = 0, 
  currentMoves = 0, 
  totalMoves = 30 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const movesPercentage = (currentMoves / totalMoves) * 100;

  useEffect(() => {
    if (score > 0 || currentMoves > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [score, currentMoves]);

  return (
    <div className="max-w-2xl mx-auto mt-12 mb-6 px-4">
      <div className="relative group">
        <div 
          className="absolute inset-0 bg-purple-500/30 blur-3xl animate-pulse"
          aria-hidden="true"
        />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-purple-300/50 transition-all duration-300 hover:shadow-purple-500/30">
          
          {/* Score Section */}
          <div className="text-center mb-4 sm:mb-0 z-10 w-full sm:w-auto">
            <div className="text-sm text-purple-100 font-medium mb-1">
              SCORE
            </div>
            <div 
              className={`text-3xl font-bold bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent transition-all ${
                isAnimating ? 'animate-soft-bounce' : ''
              }`}
              aria-live="polite"
            >
              {score.toLocaleString()}
            </div>
          </div>
          
          {/* Moves Section */}
          <div className="text-center z-10 w-full sm:w-auto">
            <div className="text-sm text-purple-100 font-medium mb-1">
              MOVES LEFT
            </div>
            <div 
              className="text-3xl font-bold text-white flex items-center justify-center gap-2"
              aria-live="polite"
            >
              <span className="text-2xl">🎯</span>
              <span className="bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">
                {currentMoves}
              </span>
              <span className="text-white/70 text-lg">/ {totalMoves}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 bg-purple-900/20 rounded-b-2xl overflow-hidden"
            role="progressbar"
            aria-valuenow={currentMoves}
            aria-valuemin={0}
            aria-valuemax={totalMoves}
          >
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500 ease-out"
              style={{ width: `${movesPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes soft-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-soft-bounce {
          animation: soft-bounce 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GameData;