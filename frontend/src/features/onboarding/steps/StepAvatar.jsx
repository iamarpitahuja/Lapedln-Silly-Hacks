import { useRef, useState } from 'react'
import StepShell from '../components/StepShell'
import { getInitials } from '../../../utils/strings'
import styles from './steps.module.css'
import avatarStyles from './StepAvatar.module.css'

export default function StepAvatar({ onNext, onSkip, displayName = '' }) {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploading(true)
    setUploadError(null)
    try {
      const token = localStorage.getItem('larpedin.access_token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/me/avatar', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Upload failed')
      }

      const { url } = await res.json()
      setPreview(url)
    } catch (err) {
      setUploadError(`Upload failed: ${err.message}. You can skip and set your avatar later.`)
    } finally {
      setUploading(false)
    }
  }

  function handleNext() {
    onNext(preview ? { avatar_url: preview } : {})
  }

  return (
    <StepShell heading="Upload your professional headshot." stepNumber={2} totalSteps={5} skippable onSkip={onSkip}>
      <div className={avatarStyles.avatarArea}>
        {preview ? (
          <img src={preview} alt="Avatar preview" className={avatarStyles.preview} />
        ) : (
          <div className={avatarStyles.placeholder}>
            {getInitials(displayName) || '?'}
          </div>
        )}
        <label className={avatarStyles.uploadLabel} aria-label="Upload profile photo">
          {uploading ? 'Uploading...' : 'Choose photo'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={avatarStyles.hiddenInput}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {uploadError && <p className={avatarStyles.error}>{uploadError}</p>}
      </div>
      <div className={styles.form}>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={uploading}
        >
          Next →
        </button>
      </div>
    </StepShell>
  )
}
