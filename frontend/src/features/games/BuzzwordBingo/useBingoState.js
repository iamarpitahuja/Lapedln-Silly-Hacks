import { useState, useCallback, useRef, useEffect } from 'react';
import { createRng, todaySeed, seededShuffle } from '../data/dailySeed';
import { BINGO_POOL } from '../data/wordLists';

const CENTER = 12;
const TOTAL_TIME = 60;

function buildBoard() {
  const rng = createRng(todaySeed());
  const words = seededShuffle(BINGO_POOL, rng).slice(0, 24);
  words.splice(CENTER, 0, 'FREE');
  return words.map((word, i) => ({ word, marked: i === CENTER }));
}

function buildCallList() {
  const rng = createRng(todaySeed() + 999);
  const pool = seededShuffle(BINGO_POOL, rng);
  return pool.slice(0, 40);
}

const LINES = [];
for (let r = 0; r < 5; r++) LINES.push([0, 1, 2, 3, 4].map(c => r * 5 + c));
for (let c = 0; c < 5; c++) LINES.push([0, 1, 2, 3, 4].map(r => r * 5 + c));
LINES.push([0, 6, 12, 18, 24]);
LINES.push([4, 8, 12, 16, 20]);

function checkWin(board) {
  for (const line of LINES) {
    if (line.every(i => board[i].marked)) return line;
  }
  return null;
}

export default function useBingoState() {
  const [board, setBoard] = useState(buildBoard);
  const [callList] = useState(buildCallList);
  const [calledWords, setCalledWords] = useState(new Set());
  const [currentCall, setCurrentCall] = useState(null);
  const [callIndex, setCallIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [winLine, setWinLine] = useState(null);
  const wonRef = useRef(false);
  const timerRef = useRef(null);
  const callTimerRef = useRef(null);

  const gameOver = won || lost;

  // Start the game
  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    setCallIndex(0);
    setCurrentCall(callList[0]);
    setCalledWords(new Set([callList[0]]));
  }, [started, callList]);

  // Timer countdown
  useEffect(() => {
    if (!started || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(callTimerRef.current);
          setLost(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, gameOver]);

  // Auto-advance calls every 4 seconds
  useEffect(() => {
    if (!started || gameOver) return;
    callTimerRef.current = setInterval(() => {
      setCallIndex(prev => {
        const next = prev + 1;
        if (next >= callList.length) {
          clearInterval(callTimerRef.current);
          return prev;
        }
        setCurrentCall(callList[next]);
        setCalledWords(s => new Set([...s, callList[next]]));
        return next;
      });
    }, 4000);
    return () => clearInterval(callTimerRef.current);
  }, [started, gameOver, callList]);

  // Tap a cell: only marks if that word has been called
  const toggleCell = useCallback((index) => {
    if (index === CENTER || wonRef.current || !started || lost) return;
    setBoard(prev => {
      const cell = prev[index];
      if (cell.marked) return prev; // can't unmark
      if (!calledWords.has(cell.word)) return prev; // word not called yet

      const next = prev.map((c, i) =>
        i === index ? { ...c, marked: true } : c
      );
      const line = checkWin(next);
      if (line) {
        wonRef.current = true;
        setWon(true);
        setWinLine(line);
        clearInterval(timerRef.current);
        clearInterval(callTimerRef.current);
      }
      return next;
    });
  }, [started, lost, calledWords]);

  return {
    board,
    currentCall,
    calledWords,
    timeLeft,
    totalTime: TOTAL_TIME,
    started,
    won,
    lost,
    gameOver,
    winLine,
    start,
    toggleCell,
  };
}
