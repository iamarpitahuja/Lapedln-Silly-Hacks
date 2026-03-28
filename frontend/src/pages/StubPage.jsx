import styles from './StubPage.module.css'

export default function StubPage({ title }) {
  return (
    <div className={styles.stub}>
      <h2>{title}</h2>
      <p>This feature is still being larped.</p>
    </div>
  )
}
