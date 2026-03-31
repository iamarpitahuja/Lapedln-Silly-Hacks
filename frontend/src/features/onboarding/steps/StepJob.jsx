import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { springBouncy } from '../../../lib/motion'
import { fetchJobOptions } from '../../../services/api'
import StepShell from '../components/StepShell'
import styles from './steps.module.css'
import jobStyles from './StepJob.module.css'

function normalizeJobOptions(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.options)) return response.options
  return []
}

export default function StepJob({ onNext }) {
  const [jobs, setJobs] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const options = await fetchJobOptions()
      setJobs(normalizeJobOptions(options))
    } catch {
      setError('Failed to load job titles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!selected) return
    onNext({ job: selected })
  }

  return (
    <StepShell heading="Choose your corporate identity." stepNumber={1} totalSteps={5} skippable={false}>
      {loading && <p className={jobStyles.loading}>Generating your destiny...</p>}
      {error && (
        <div className={jobStyles.errorBox}>
          <p>{error}</p>
          <button className={styles.nextBtn} onClick={load} type="button">Retry</button>
        </div>
      )}
      {!loading && !error && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={jobStyles.grid}>
            {jobs.map((job, i) => (
              <motion.button
                key={job}
                type="button"
                className={`${jobStyles.card} ${selected === job ? jobStyles.cardSelected : ''}`}
                onClick={() => setSelected(job)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springBouncy, delay: i * 0.03 }}
                whileTap={{ scale: selected === job ? 1 : 1.04 }}
              >
                {job}
              </motion.button>
            ))}
          </div>
          <button type="submit" className={styles.nextBtn} disabled={!selected}>
            Next →
          </button>
        </form>
      )}
    </StepShell>
  )
}
