import { useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { springBouncy } from '../../../lib/motion';
import useConnectionsState from './useConnectionsState';
import s from './ThoughtLeadership.module.css';

const DIFF_CLASS = ['diff0', 'diff1', 'diff2', 'diff3'];

const shakeAnimation = {
  x: [0, -6, 6, -6, 6, 0],
  transition: { duration: 0.4 },
};

export default function ThoughtLeadership({ onWin }) {
  const {
    words,
    selected,
    solvedGroups,
    mistakes,
    gameOver,
    won,
    lastResult,
    toggleWord,
    submitGuess,
    deselectAll,
  } = useConnectionsState();

  const calledWin = useRef(false);

  useEffect(() => {
    if (won && !calledWin.current) {
      calledWin.current = true;
      onWin?.();
    }
  }, [won, onWin]);

  return (
    <div>
      {/* Solved groups */}
      <div className={s.solvedGroups}>
        <AnimatePresence>
          {solvedGroups.map((group) => (
            <Motion.div
              key={group.label}
              className={`${s.solvedGroup} ${s[DIFF_CLASS[group.difficulty]]}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springBouncy}
            >
              <div className={s.solvedGroupLabel}>{group.label}</div>
              <div className={s.solvedGroupWords}>{group.words.join(', ')}</div>
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Word grid */}
      {words.length > 0 && (
        <Motion.div
          className={s.grid}
          animate={
            lastResult === 'wrong' || lastResult === 'one-away'
              ? shakeAnimation
              : { x: 0 }
          }
        >
          {words.map((word) => (
            <Motion.button
              key={word}
              className={`${s.word} ${selected.has(word) ? s.wordSelected : ''}`}
              onClick={() => toggleWord(word)}
              whileTap={{ scale: 0.94 }}
              transition={springBouncy}
            >
              {word}
            </Motion.button>
          ))}
        </Motion.div>
      )}

      {/* Mistake dots */}
      <div className={s.mistakes}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`${s.dot} ${i < mistakes ? s.dotUsed : ''}`}
          />
        ))}
      </div>

      {/* Action buttons */}
      {!gameOver && (
        <div className={s.actions}>
          <button
            className={s.deselectBtn}
            onClick={deselectAll}
            disabled={selected.size === 0}
          >
            Deselect All
          </button>
          <button
            className={s.submitBtn}
            onClick={submitGuess}
            disabled={selected.size !== 4}
          >
            Submit
          </button>
        </div>
      )}

      {/* One-away toast */}
      <AnimatePresence>
        {lastResult === 'one-away' && (
          <Motion.div
            className={s.toast}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            One away!
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Win message */}
      {won && <div className={s.winMsg}>Thought Leader!</div>}

      {/* Loss message */}
      {gameOver && !won && (
        <div className={s.lossMsg}>Better luck tomorrow</div>
      )}
    </div>
  );
}
