'use client';
import { useState, useEffect, useCallback } from 'react';
import GameData from '@/components/ui/GameData';
import Header from '@/components/ui/Header';

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500'] as const;
type Color = typeof COLORS[number];

export default function Game() {
  const [tiles, setTiles] = useState<Color[]>([]);
  const [score, setScore] = useState(0);
  const [flxPoints, setFlxPoints] = useState(0);
  const [moves, setMoves] = useState(30);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<{ id: number; points: number; x: number; y: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);

  // Telegram WebApp initialization
  useEffect(() => {
    const { Telegram } = window;
    if (Telegram?.WebApp) {
      Telegram.WebApp.ready();
      const userId = Telegram.WebApp.initDataUnsafe.user?.id;
      if (userId) setTelegramUserId(userId);
    }
  }, []);

  // Game logic functions
  const checkValidSwap = (index1: number, index2: number) => {
    const row1 = Math.floor(index1 / 8);
    const col1 = index1 % 8;
    const row2 = Math.floor(index2 / 8);
    const col2 = index2 % 8;
    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) || 
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
  };

  const findMatches = useCallback((tileArray: Color[]) => {
    const matched = new Set<number>();
    
    // Check horizontal matches
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        const index = row * 8 + col;
        if (tileArray[index] === tileArray[index + 1] && 
            tileArray[index] === tileArray[index + 2]) {
          matched.add(index);
          matched.add(index + 1);
          matched.add(index + 2);
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 6; row++) {
        const index = row * 8 + col;
        if (tileArray[index] === tileArray[index + 8] && 
            tileArray[index] === tileArray[index + 16]) {
          matched.add(index);
          matched.add(index + 8);
          matched.add(index + 16);
        }
      }
    }
    return matched;
  }, []);

  const handleMatches = useCallback(async (matched: Set<number>) => {
    const pointsEarned = matched.size * 50;
    setScore(prev => prev + pointsEarned);

    // Show notification
    const firstIndex = Array.from(matched)[0];
    const tileElement = document.getElementById(`tile-${firstIndex}`);
    if (tileElement) {
      const rect = tileElement.getBoundingClientRect();
      setNotifications(prev => [
        ...prev,
        { id: Date.now(), points: pointsEarned, x: rect.left + rect.width/2, y: rect.top + rect.height/2 }
      ]);
    }

    // Update tiles
    setTiles(prev => prev.map((color, index) => 
      matched.has(index) ? COLORS[Math.floor(Math.random() * COLORS.length)] : color
    ));

    // Check for new matches
    await new Promise(resolve => setTimeout(resolve, 300));
    const newMatches = findMatches(tiles);
    if (newMatches.size > 0) await handleMatches(newMatches);
  }, [findMatches, tiles]);

  const hasPossibleMoves = useCallback((tileArray: Color[]) => {
    for (let i = 0; i < tileArray.length; i++) {
      if ((i % 8 < 7 && testSwap(i, i + 1, tileArray)) ||
          (i < 56 && testSwap(i, i + 8, tileArray))) {
        return true;
      }
    }
    return false;
  }, []);

  const testSwap = useCallback((a: number, b: number, arr: Color[]) => {
    const temp = [...arr];
    [temp[a], temp[b]] = [temp[b], temp[a]];
    return findMatches(temp).size > 0;
  }, [findMatches]);

  const createBoard = useCallback(() => {
    let newTiles: Color[];
    do {
      newTiles = Array.from({ length: 64 }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
    } while (findMatches(newTiles).size > 0 || !hasPossibleMoves(newTiles));
    setTiles(newTiles);
  }, [findMatches, hasPossibleMoves]);

  // Game actions
  const swapTiles = useCallback(async (index1: number, index2: number) => {
    setIsProcessing(true);
    setMoves(prev => prev - 1);

    const newTiles = [...tiles];
    [newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
    setTiles(newTiles);

    await new Promise(resolve => setTimeout(resolve, 300));
    
    const matches = findMatches(newTiles);
    if (matches.size > 0) {
      await handleMatches(matches);
    } else {
      setTiles(prev => {
        const reverted = [...prev];
        [reverted[index1], reverted[index2]] = [reverted[index2], reverted[index1]];
        return reverted;
      });
    }
    setIsProcessing(false);
  }, [tiles, findMatches, handleMatches]);

  const handleTileClick = useCallback((index: number) => {
    if (isProcessing || moves <= 0) return;
    
    setSelectedIndex(prev => {
      if (prev === null) return index;
      if (checkValidSwap(prev, index)) swapTiles(prev, index);
      return null;
    });
  }, [isProcessing, moves, swapTiles]);

  // Data persistence
  const loadGameState = useCallback(async () => {
    try {
      if (!telegramUserId) return;
      
      const response = await fetch(`/api/game/state?telegramId=${telegramUserId}`);
      if (!response.ok) throw new Error('Failed to load game state');
      
      const data = await response.json();
      setScore(data.score);
      setFlxPoints(data.flxPoints);
      setMoves(data.currentMoves);
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }, [telegramUserId]);

  const saveGameProgress = useCallback(async (finalScore: number) => {
    try {
      if (!telegramUserId) return;

      const response = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          score: finalScore,
          telegramId: telegramUserId
        })
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      const data = await response.json();
      setFlxPoints(data.newFlxPoints);
      setMoves(30);  // Reset moves after successful save
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [telegramUserId]);

  // Game initialization
  useEffect(() => {
    if (telegramUserId) {
      loadGameState();
      createBoard();
    }
  }, [telegramUserId, loadGameState, createBoard]);

  // Save progress when moves reach 0
  useEffect(() => {
    if (moves === 0) {
      saveGameProgress(score);
    }
  }, [moves, score, saveGameProgress]);

  // Save on window close
  useEffect(() => {
    const handler = () => {
      if (score > 0) {
        saveGameProgress(score);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [score, saveGameProgress]);

  // Notification cleanup
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  useEffect(() => {
    if (moves === 0) {
      saveGameProgress(score);
      setMoves(30);
    }
  }, [moves, saveGameProgress, score])

  return (
    <div className="max-w-md mx-auto mt-6 mb-6 relative">
      <Header />
      <GameData score={score} currentMoves={moves} totalMoves={30} />

      <div className="grid grid-cols-8 gap-1 bg-white p-2 rounded-xl shadow-xl touch-pan-y">
        {tiles.map((color, index) => (
          <button
            key={index}
            id={`tile-${index}`}
            onClick={() => handleTileClick(index)}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTileClick(index);
            }}
            disabled={isProcessing || moves <= 0}
            className={`aspect-square rounded-lg transition-all duration-300 ${color}
              ${selectedIndex === index ? 'ring-4 ring-white scale-110' : ''}
              ${isProcessing || moves <= 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          />
        ))}
      </div>

      {notifications.map(({ id, points, x, y }) => (
        <div
          key={id}
          className="fixed text-yellow-400 font-bold text-lg animate-float pointer-events-none"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          +{points}
          <div className="absolute inset-0 bg-yellow-400/20 blur-sm rounded-full -z-10" />
        </div>
      ))}

      <style jsx global>{`
        @keyframes float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
        .animate-float {
          animation: float 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}