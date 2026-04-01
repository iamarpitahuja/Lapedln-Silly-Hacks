import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springBouncy } from '../../../../lib/motion';
import { localDateStr } from '../../../games/data/dailySeed';
import s from './GamesWidget.module.css';

const GAMES = [
  { key: 'bingo', name: 'Buzzword Bingo', tagline: 'Spot the corporate yap' },
  { key: 'grind', name: 'The Grind', tagline: 'Wordle but make it LinkedIn' },
  { key: 'connections', name: 'Thought Leadership', tagline: 'Group the brainrot' },
];

function getTodayKey() {
  return localDateStr();
}

function getClaimedGames() {
  try {
    const raw = localStorage.getItem(`larp-games-claimed-${getTodayKey()}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const BingoIcon = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="4.5" height="4.5" rx="0.5" />
    <rect x="6.75" y="1" width="4.5" height="4.5" rx="0.5" />
    <rect x="12.5" y="1" width="4.5" height="4.5" rx="0.5" />
    <rect x="1" y="6.75" width="4.5" height="4.5" rx="0.5" />
    <rect x="6.75" y="6.75" width="4.5" height="4.5" rx="0.5" />
    <rect x="12.5" y="6.75" width="4.5" height="4.5" rx="0.5" />
    <rect x="1" y="12.5" width="4.5" height="4.5" rx="0.5" />
    <rect x="6.75" y="12.5" width="4.5" height="4.5" rx="0.5" />
    <rect x="12.5" y="12.5" width="4.5" height="4.5" rx="0.5" />
  </svg>
);

const GrindIcon = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="4" width="7" height="10" rx="1.5" />
    <text x="4.5" y="11.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="700" fontFamily="sans-serif">A</text>
    <rect x="10" y="4" width="7" height="10" rx="1.5" />
    <text x="13.5" y="11.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="700" fontFamily="sans-serif">B</text>
  </svg>
);

const ConnectionsIcon = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="4" cy="4" r="2" />
    <circle cx="14" cy="4" r="2" />
    <circle cx="4" cy="14" r="2" />
    <circle cx="14" cy="14" r="2" />
    <line x1="6" y1="4" x2="12" y2="4" />
    <line x1="4" y1="6" x2="4" y2="12" />
    <line x1="14" y1="6" x2="14" y2="12" />
    <line x1="6" y1="14" x2="12" y2="14" />
  </svg>
);

const ICONS = {
  bingo: BingoIcon,
  grind: GrindIcon,
  connections: ConnectionsIcon,
};

export default function GamesWidget({ onPlay }) {
  const [claimed, setClaimed] = useState(getClaimedGames);

  useEffect(() => {
    const handle = () => setClaimed(getClaimedGames());
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, []);

  return (
    <div data-tour="daily-games">
      <div className={s.title}>Daily Games</div>
      <div className={s.tiles}>
        {GAMES.map((game) => {
          const Icon = ICONS[game.key];
          const won = !!claimed[game.key];
          return (
            <motion.button
              key={game.key}
              className={s.tile}
              onClick={() => onPlay(game.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={springBouncy}
            >
              <div className={s.tileIcon}>
                <Icon />
              </div>
              <div className={s.tileInfo}>
                <div className={s.tileName}>{game.name}</div>
                <div className={s.tileTagline}>{game.tagline}</div>
              </div>
              <div className={won ? `${s.tileStatus} ${s.tileDone}` : s.tileStatus}>
                {won ? '\u2713' : 'Play'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
