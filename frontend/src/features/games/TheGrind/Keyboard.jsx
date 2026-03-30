import { useEffect, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import styles from './Keyboard.module.css';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

function getKeyClass(letter, letterStates) {
  const state = letterStates[letter];
  if (state === 'correct') return styles.keyCorrect;
  if (state === 'present') return styles.keyPresent;
  if (state === 'absent') return styles.keyAbsent;
  return '';
}

export default function Keyboard({ letterStates, onKey, onBackspace, onEnter }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        onEnter();
      } else if (key === 'BACKSPACE') {
        onBackspace();
      } else if (/^[A-Z]$/.test(key)) {
        onKey(key);
      }
    },
    [onKey, onBackspace, onEnter],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={styles.row}>
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === 'DEL';
            const stateClass = !isWide ? getKeyClass(key, letterStates) : '';

            return (
              <Motion.button
                key={key}
                className={`${styles.key} ${isWide ? styles.keyWide : ''} ${stateClass}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (key === 'ENTER') onEnter();
                  else if (key === 'DEL') onBackspace();
                  else onKey(key);
                }}
              >
                {key}
              </Motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
