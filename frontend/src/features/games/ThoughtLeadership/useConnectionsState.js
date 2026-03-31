import { useState, useMemo, useCallback } from 'react';
import { createRng, todaySeed, seededShuffle } from '../data/dailySeed';
import { CONNECTIONS_PUZZLES } from '../data/wordLists';

export default function useConnectionsState(savedState) {
  const puzzle = useMemo(
    () => CONNECTIONS_PUZZLES[Math.abs(todaySeed()) % CONNECTIONS_PUZZLES.length],
    [],
  );

  const lookup = useMemo(() => {
    const map = {};
    puzzle.groups.forEach((g, groupIndex) => {
      g.words.forEach((w) => {
        map[w] = { groupIndex, label: g.label, difficulty: g.difficulty };
      });
    });
    return map;
  }, [puzzle]);

  const initialWords = useMemo(() => {
    const all = puzzle.groups.flatMap((g) => g.words);
    const rng = createRng(todaySeed());
    return seededShuffle(all, rng);
  }, [puzzle]);

  const [words, setWords] = useState(
    savedState?.words ?? initialWords,
  );
  const [selected, setSelected] = useState(
    () => new Set(savedState?.selected ?? []),
  );
  const [solvedGroups, setSolvedGroups] = useState(
    savedState?.solvedGroups ?? [],
  );
  const [mistakes, setMistakes] = useState(savedState?.mistakes ?? 0);
  const [gameOver, setGameOver] = useState(savedState?.gameOver ?? false);
  const [won, setWon] = useState(savedState?.won ?? false);
  const [lastResult, setLastResult] = useState(null);

  const toggleWord = useCallback(
    (word) => {
      if (gameOver) return;
      setLastResult(null);
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(word)) {
          next.delete(word);
        } else if (next.size < 4) {
          next.add(word);
        }
        return next;
      });
    },
    [gameOver],
  );

  const deselectAll = useCallback(() => {
    setLastResult(null);
    setSelected(new Set());
  }, []);

  const submitGuess = useCallback(() => {
    if (selected.size !== 4 || gameOver) return;

    const picks = [...selected];
    const groupCounts = {};
    picks.forEach((w) => {
      const gi = lookup[w].groupIndex;
      groupCounts[gi] = (groupCounts[gi] || 0) + 1;
    });

    const maxGroup = Object.entries(groupCounts).reduce(
      (best, [gi, count]) => (count > best.count ? { gi: Number(gi), count } : best),
      { gi: -1, count: 0 },
    );

    if (maxGroup.count === 4) {
      const group = puzzle.groups[maxGroup.gi];
      const solved = {
        label: group.label,
        words: group.words,
        difficulty: group.difficulty,
      };
      const newSolved = [...solvedGroups, solved];
      setSolvedGroups(newSolved);
      setWords((prev) => prev.filter((w) => !selected.has(w)));
      setSelected(new Set());
      setLastResult('correct');
      setTimeout(() => setLastResult(null), 1500);

      if (newSolved.length === 4) {
        setWon(true);
        setGameOver(true);
      }
    } else if (maxGroup.count === 3) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setSelected(new Set());
      setLastResult('one-away');
      setTimeout(() => setLastResult(null), 1500);

      if (newMistakes >= 4) {
        revealRemaining(solvedGroups);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setSelected(new Set());
      setLastResult('wrong');
      setTimeout(() => setLastResult(null), 1500);

      if (newMistakes >= 4) {
        revealRemaining(solvedGroups);
      }
    }

    function revealRemaining(currentSolved) {
      const alreadySolved = new Set(currentSolved.map((g) => g.label));
      const remaining = puzzle.groups
        .filter((g) => !alreadySolved.has(g.label))
        .map((g) => ({
          label: g.label,
          words: g.words,
          difficulty: g.difficulty,
        }));
      setSolvedGroups((prev) => [...prev, ...remaining]);
      setWords([]);
      setGameOver(true);
    }
  }, [selected, gameOver, lookup, puzzle, solvedGroups, mistakes]);

  return {
    puzzle,
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
  };
}
