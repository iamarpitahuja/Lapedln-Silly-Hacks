import { useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { springBouncy, easeOutQuint } from '../../../lib/motion';
import useBingoState from './useBingoState';
import styles from './BuzzwordBingo.module.css';

const CENTER = 12;

export default function BuzzwordBingo({ onWin }) {
  const {
    board,
    currentCall,
    calledWords,
    timeLeft,
    totalTime,
    started,
    won,
    lost,
    gameOver,
    winLine,
    start,
    toggleCell,
  } = useBingoState();

  const winFired = useRef(false);

  useEffect(() => {
    if (won && !winFired.current) {
      winFired.current = true;
      onWin?.();
    }
  }, [won, onWin]);

  const winSet = winLine ? new Set(winLine) : null;
  const timePct = (timeLeft / totalTime) * 100;

  return (
    <div>
      {/* Pre-start screen */}
      {!started && (
        <div className={styles.startScreen}>
          <p className={styles.rules}>
            Buzzwords are called every 4 seconds. Find and tap them on your board before time runs out. Complete a line to win.
          </p>
          <Motion.button
            className={styles.startBtn}
            onClick={start}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={springBouncy}
          >
            Start Game
          </Motion.button>
        </div>
      )}

      {/* Active game UI */}
      {started && (
        <>
          {/* Timer bar */}
          <div className={styles.timerWrap}>
            <div className={styles.timerBar}>
              <Motion.div
                className={styles.timerFill}
                animate={{ width: `${timePct}%` }}
                transition={{ duration: 0.4, ease: easeOutQuint }}
                style={{
                  background: timePct > 30 ? 'var(--neon)' : 'var(--accent-rose)',
                }}
              />
            </div>
            <span className={styles.timerText}>{timeLeft}s</span>
          </div>

          {/* Current call */}
          <AnimatePresence mode="wait">
            {currentCall && !gameOver && (
              <Motion.div
                key={currentCall}
                className={styles.callout}
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.25, ease: easeOutQuint }}
              >
                {currentCall}
              </Motion.div>
            )}
          </AnimatePresence>

          {/* Board */}
          <div className={styles.board}>
            {board.map((cell, i) => {
              const isFree = i === CENTER;
              const isWinCell = winSet?.has(i);
              const isCallable = !isFree && calledWords.has(cell.word) && !cell.marked;

              const cls = [
                styles.cell,
                cell.marked && styles.cellMarked,
                isFree && styles.cellFree,
                isWinCell && styles.cellWin,
                isCallable && styles.cellCallable,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <Motion.button
                  key={i}
                  className={cls}
                  onClick={() => toggleCell(i)}
                  whileTap={!gameOver && !isFree ? { scale: 0.88 } : undefined}
                  transition={springBouncy}
                  disabled={gameOver || isFree}
                >
                  {cell.word}
                </Motion.button>
              );
            })}
          </div>
        </>
      )}

      {/* Win */}
      <AnimatePresence>
        {won && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easeOutQuint }}
          >
            <div className={styles.winMsg}>BINGO!</div>
            <div className={styles.subtitle}>
              Corporate synergy achieved. HR has been notified.
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Loss */}
      <AnimatePresence>
        {lost && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easeOutQuint }}
          >
            <div className={styles.lossMsg}>Time's up!</div>
            <div className={styles.subtitle}>
              Your bandwidth was insufficient. Try again tomorrow.
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
