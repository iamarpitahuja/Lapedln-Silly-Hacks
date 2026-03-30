import { useState, useCallback } from 'react'
import { useMockData } from '../../../context/MockDataContext'
import { claimGameReward } from '../../../services/api'
import GamesWidget from './GamesWidget/GamesWidget'
import GameModal from '../../games/GameModal/GameModal'
import BuzzwordBingo from '../../games/BuzzwordBingo/BuzzwordBingo'
import TheGrind from '../../games/TheGrind/TheGrind'
import ThoughtLeadership from '../../games/ThoughtLeadership/ThoughtLeadership'
import styles from './RightRail.module.css'

const GAME_TITLES = {
  bingo: 'Buzzword Bingo',
  grind: 'The Grind',
  connections: 'Thought Leadership',
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export default function RightRail() {
  const { trendingDelusions, buzzwords } = useMockData()
  const [activeGame, setActiveGame] = useState(null)

  const handleWin = useCallback((gameKey) => {
    const claimedKey = `larp-games-claimed-${getTodayKey()}`
    try {
      const claimed = JSON.parse(localStorage.getItem(claimedKey) || '{}')
      if (!claimed[gameKey]) {
        claimed[gameKey] = true
        localStorage.setItem(claimedKey, JSON.stringify(claimed))
        claimGameReward(gameKey).catch(() => {})
        window.dispatchEvent(new Event('storage'))
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <div className={styles.rail}>
      {/* Trending Delusions */}
      <div className={styles.card}>
        <h3 className={styles.title}>Trending Delusions</h3>
        <ol className={styles.list}>
          {trendingDelusions.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <span className={styles.listNum}>{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <button className={styles.seeMore}>see more</button>
      </div>

      {/* Today's Buzzwords */}
      <div className={styles.card}>
        <h3 className={styles.title}>Today&apos;s Buzzwords</h3>
        <ul className={styles.buzzList}>
          {buzzwords.slice(0, 2).map((bw, i) => (
            <li key={i} className={styles.buzzItem}>{bw}</li>
          ))}
        </ul>
        <button className={styles.seeMore}>see more</button>
      </div>

      {/* Daily Games */}
      <div className={styles.card}>
        <GamesWidget onPlay={setActiveGame} />
      </div>

      {/* Game Modal */}
      <GameModal
        isOpen={!!activeGame}
        onClose={() => setActiveGame(null)}
        title={activeGame ? GAME_TITLES[activeGame] : ''}
      >
        {activeGame === 'bingo' && (
          <BuzzwordBingo onWin={() => handleWin('bingo')} />
        )}
        {activeGame === 'grind' && (
          <TheGrind onWin={() => handleWin('grind')} />
        )}
        {activeGame === 'connections' && (
          <ThoughtLeadership onWin={() => handleWin('connections')} />
        )}
      </GameModal>
    </div>
  )
}
