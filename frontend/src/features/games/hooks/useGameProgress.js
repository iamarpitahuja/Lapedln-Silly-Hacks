import { useState, useCallback } from 'react';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function cleanupOldKeys() {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('larp-')) continue;

    const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;

    const keyDate = new Date(dateMatch[1] + 'T00:00:00').getTime();
    if (now - keyDate > sevenDays) {
      localStorage.removeItem(key);
    }
  }
}

export default function useGameProgress(gameKey) {
  const today = getTodayKey();
  const storageKey = `larp-${gameKey}-${today}`;
  const claimedKey = `larp-games-claimed-${today}`;

  const [savedState] = useState(() => {
    cleanupOldKeys();

    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const saveState = useCallback(
    (state) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // storage full or unavailable
      }
    },
    [storageKey],
  );

  const hasClaimedReward = useCallback(() => {
    try {
      const raw = localStorage.getItem(claimedKey);
      const claimed = raw ? JSON.parse(raw) : {};
      return !!claimed[gameKey];
    } catch {
      return false;
    }
  }, [claimedKey, gameKey]);

  const markRewardClaimed = useCallback(() => {
    try {
      const raw = localStorage.getItem(claimedKey);
      const claimed = raw ? JSON.parse(raw) : {};
      claimed[gameKey] = true;
      localStorage.setItem(claimedKey, JSON.stringify(claimed));
    } catch {
      // storage full or unavailable
    }
  }, [claimedKey, gameKey]);

  return { savedState, saveState, hasClaimedReward, markRewardClaimed };
}
