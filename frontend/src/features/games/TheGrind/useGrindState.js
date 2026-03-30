import { useState, useCallback } from 'react';
import { todaySeed } from '../data/dailySeed';
import { GRIND_ANSWERS } from '../data/wordLists';

const MAX_GUESSES = 6;

function scoreGuess(word, answer) {
  const results = Array(word.length).fill('absent');
  const answerChars = answer.split('');
  const remaining = [];

  // First pass: mark correct
  for (let i = 0; i < word.length; i++) {
    if (word[i] === answerChars[i]) {
      results[i] = 'correct';
      answerChars[i] = null;
    } else {
      remaining.push(i);
    }
  }

  // Second pass: mark present (handle duplicate letters)
  for (const i of remaining) {
    const idx = answerChars.indexOf(word[i]);
    if (idx !== -1) {
      results[i] = 'present';
      answerChars[idx] = null;
    }
  }

  return results;
}

const STATE_PRIORITY = { absent: 0, present: 1, correct: 2 };

function mergeLetterStates(existing, word, results) {
  const updated = { ...existing };
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const current = updated[ch];
    if (!current || STATE_PRIORITY[results[i]] > STATE_PRIORITY[current]) {
      updated[ch] = results[i];
    }
  }
  return updated;
}

export default function useGrindState(savedState) {
  const answer = GRIND_ANSWERS[Math.abs(todaySeed()) % GRIND_ANSWERS.length];

  const [guesses, setGuesses] = useState(savedState?.guesses ?? []);
  const [currentInput, setCurrentInput] = useState(savedState?.currentInput ?? '');
  const [gameOver, setGameOver] = useState(savedState?.gameOver ?? false);
  const [won, setWon] = useState(savedState?.won ?? false);
  const [letterStates, setLetterStates] = useState(savedState?.letterStates ?? {});

  const addLetter = useCallback(
    (char) => {
      if (gameOver) return;
      setCurrentInput((prev) =>
        prev.length < answer.length ? prev + char.toUpperCase() : prev,
      );
    },
    [gameOver, answer.length],
  );

  const removeLetter = useCallback(() => {
    if (gameOver) return;
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [gameOver]);

  const submitGuess = useCallback(() => {
    if (gameOver) return { valid: false };

    const word = currentInput.toUpperCase();
    if (word.length !== answer.length) return { valid: false, reason: 'short' };
    if (!/^[A-Z]+$/.test(word)) return { valid: false, reason: 'invalid' };

    const results = scoreGuess(word, answer);
    const guess = { word, results };

    const isWin = results.every((r) => r === 'correct');
    const isLoss = guesses.length + 1 >= MAX_GUESSES && !isWin;

    setGuesses((prev) => [...prev, guess]);
    setLetterStates((prev) => mergeLetterStates(prev, word, results));
    setCurrentInput('');

    if (isWin) {
      setWon(true);
      setGameOver(true);
    } else if (isLoss) {
      setGameOver(true);
    }

    return { valid: true };
  }, [gameOver, currentInput, answer, guesses.length]);

  return {
    answer,
    guesses,
    currentInput,
    gameOver,
    won,
    letterStates,
    addLetter,
    removeLetter,
    submitGuess,
  };
}
