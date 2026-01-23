import React, { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
}

interface SnowfallProps {
  isActive: boolean;
}

const Snowfall: React.FC<SnowfallProps> = ({ isActive }) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    if (!isActive) {
      setSnowflakes([]);
      return;
    }

    // 創建雪花
    const createSnowflakes = () => {
      const flakes: Snowflake[] = [];
      for (let i = 0; i < 50; i++) {
        flakes.push({
          id: i,
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 5,
          opacity: 0.4 + Math.random() * 0.6,
          size: 4 + Math.random() * 8,
        });
      }
      setSnowflakes(flakes);
    };

    createSnowflakes();

    // 持續添加新雪花
    const interval = setInterval(() => {
      setSnowflakes(prev => {
        const newFlake: Snowflake = {
          id: Date.now(),
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 5,
          opacity: 0.4 + Math.random() * 0.6,
          size: 4 + Math.random() * 8,
        };
        // 保持最多 80 個雪花
        const updated = [...prev, newFlake];
        if (updated.length > 80) {
          return updated.slice(-80);
        }
        return updated;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-snowfall"
          style={{
            left: `${flake.left}%`,
            top: '-20px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.animationDuration}s`,
          }}
        >
          ❄️
        </div>
      ))}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-snowfall {
          animation: snowfall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Snowfall;
