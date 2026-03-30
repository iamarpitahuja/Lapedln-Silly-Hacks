import { useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { springBouncy, springSnap } from '../../../lib/motion';
import useGrindState from './useGrindState';
import Keyboard from './Keyboard';
import styles from './TheGrind.module.css';

const MAX_GUESSES = 6;

const RESULT_CLASS = {
  correct: styles.cellCorrect,
  present: styles.cellPresent,
  absent: styles.cellAbsent,
};

export default function TheGrind({ onWin }) {
  const {
    answer,
    guesses,
    currentInput,
    gameOver,
    won,
    letterStates,
    addLetter,
    removeLetter,
    submitGuess,
  } = useGrindState();

  const [shakeRow, setShakeRow] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (won && onWin) onWin();
  }, [won, onWin]);

  const handleEnter = useCallback(() => {
    const result = submitGuess();
    if (!result.valid) {
      setShakeRow(true);
      setToast(result.reason === 'short' ? 'Not enough letters' : 'Invalid word');
      setTimeout(() => {
        setShakeRow(false);
        setToast(null);
      }, 1200);
    }
  }, [submitGuess]);

  const emptyRows = MAX_GUESSES - guesses.length - (gameOver ? 0 : 1);

  return (
    <div>
      <div className={styles.grid}>
        {/* Submitted guesses */}
        {guesses.map((guess, rowIdx) => (
          <Motion.div
            key={rowIdx}
            className={styles.guessRow}
            animate={
              won && rowIdx === guesses.length - 1
                ? { y: [0, -6, 0] }
                : undefined
            }
            transition={won && rowIdx === guesses.length - 1 ? springBouncy : undefined}
          >
            {guess.word.split('').map((ch, i) => (
              <Motion.div
                key={i}
                className={`${styles.cell} ${RESULT_CLASS[guess.results[i]]}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12, ...springSnap }}
              >
                {ch}
              </Motion.div>
            ))}
          </Motion.div>
        ))}

        {/* Current input row */}
        {!gameOver && (
          <Motion.div
            className={styles.guessRow}
            animate={shakeRow ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
            transition={shakeRow ? { duration: 0.4 } : undefined}
          >
            {Array.from({ length: answer.length }).map((_, i) => {
              const ch = currentInput[i] || '';
              return (
                <div
                  key={i}
                  className={`${styles.cell} ${ch ? styles.cellFilled : ''}`}
                >
                  {ch}
                </div>
              );
            })}
          </Motion.div>
        )}

        {/* Empty rows */}
        {Array.from({ length: Math.max(0, emptyRows) }).map((_, rowIdx) => (
          <div key={`empty-${rowIdx}`} className={styles.guessRow}>
            {Array.from({ length: answer.length }).map((_, i) => (
              <div key={i} className={styles.cell} />
            ))}
          </div>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {toast}
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <AnimatePresence>
        {won && (
          <Motion.div
            className={styles.message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnap}
          >
            Impressive.
          </Motion.div>
        )}
        {gameOver && !won && (
          <Motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnap}
          >
            <div className={styles.answer}>The answer was: {answer}</div>
          </Motion.div>
        )}
      </AnimatePresence>

      <Keyboard
        letterStates={letterStates}
        onKey={addLetter}
        onBackspace={removeLetter}
        onEnter={handleEnter}
      />
    </div>
  );
}
