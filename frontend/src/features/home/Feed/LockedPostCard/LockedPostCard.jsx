import { useMemo } from 'react'
import Icon from '../../../../components/Icon/Icon'
import styles from './LockedPostCard.module.css'

const LOCK_MESSAGES = [
  { main: "this post is built different. ur aura ain't there yet.", sub: "grind ur LarpRating and maybe u'll see it fr." },
  { main: "content too elite for ur current tier. tragic.", sub: "post harder. the algorithm believes in upward mobility." },
  { main: "u don't have the clearance for this thought leadership.", sub: "ur LARP Rating said 'not today bestie.'" },
  { main: "this post exists on a higher plane of corporate consciousness.", sub: "manifest a better score and come back." },
  { main: "imagine not being able to see this post. oh wait.", sub: "skill issue tbh. go grind." },
  { main: "the elite are posting and u can't even spectate.", sub: "this is what a caste system feels like. get used to it." },
  { main: "this content is above ur pay grade (which is $0).", sub: "ur LarpRating is giving unpaid intern energy." },
  { main: "POV: u brought vibes but not enough clout.", sub: "the velvet rope is real. keep larping." },
]

function pickMessage(postId) {
  let hash = 0
  const str = postId || ''
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return LOCK_MESSAGES[Math.abs(hash) % LOCK_MESSAGES.length]
}

export default function LockedPostCard({ post }) {
  const author = post?.author
  const msg = useMemo(() => pickMessage(post?.id), [post?.id])
  return (
    <div className={styles.card}>
      <div className={styles.blurLayer}>
        <div className={styles.header}>
          <div className={styles.avatarWrap}>
            {author?.avatar
              ? <img src={author.avatar} alt="" className={styles.realAvatar} />
              : <div className={styles.fakeAvatar} />
            }
          </div>
          <div className={styles.fakeLines}>
            {author?.name
              ? <div className={styles.realName}>{author.name}</div>
              : <div className={`${styles.fakeLine} ${styles.lineWide}`} />
            }
            {author?.headline
              ? <div className={styles.realHeadline}>{author.headline}</div>
              : <div className={`${styles.fakeLine} ${styles.lineMid}`} />
            }
          </div>
        </div>
        <div className={styles.fakeBody}>
          <div className={`${styles.fakePara} ${styles.paraFull}`} />
          <div className={`${styles.fakePara} ${styles.paraFull}`} />
          <div className={`${styles.fakePara} ${styles.paraNarrow}`} />
        </div>
        <div className={styles.fakeActions}>
          <div className={`${styles.fakeLine} ${styles.lineAction}`} />
          <div className={`${styles.fakeLine} ${styles.lineAction}`} />
          <div className={`${styles.fakeLine} ${styles.lineAction}`} />
        </div>
      </div>
      <div className={styles.overlay}>
        <span className={styles.lockIcon}><Icon name="lock" size={32} /></span>
        <p className={styles.lockMessage}>{msg.main}</p>
        <p className={styles.lockSub}>{msg.sub}</p>
      </div>
    </div>
  )
}
