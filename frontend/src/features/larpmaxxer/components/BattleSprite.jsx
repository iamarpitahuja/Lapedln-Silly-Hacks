import { useState } from 'react'
import styles from './BattleSprite.module.css'

export function BattleSprite({ characterId, talking = false, flip = false, animClass = '' }) {
  const [errored, setErrored] = useState(false)
  const frame = talking ? 'talk' : 'idle'
  const src = `/sprites/${characterId}_${frame}.png`

  return (
    <div className={`${styles.wrap} ${flip ? styles.flip : ''} ${animClass}`}>
      {!errored && (
        <img
          key={src}
          src={src}
          alt={characterId}
          className={styles.sprite}
          onError={() => setErrored(true)}
          draggable={false}
        />
      )}
    </div>
  )
}
