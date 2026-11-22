import { useEffect, useState } from 'react'
import { api } from '../services/api'

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp'

function RequirementCard({ document, optional = false, uploading, disabled, onUpload }) {
  const inputId = `store-document-${document.key}`
  const selectFile = event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onUpload(document.key, file)
  }

  return (
    <article className="store-document-card">
      <div className="store-document-heading">
        <div>
          <h3>{document.label}</h3>
          <p>{document.hint}</p>
        </div>
        <span className={`store-document-status${document.uploaded ? ' complete' : ''}`}>
          {document.uploaded ? 'Photo received' : optional ? 'Optional' : 'Required'}
        </span>
      </div>
      {document.uploaded && <p className="store-document-file">{document.fileName}</p>}
      <label className={`store-document-upload${uploading ? ' is-uploading' : ''}${disabled ? ' is-disabled' : ''}`} htmlFor={inputId}>
        <span className="store-document-upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></svg>
        </span>
        <span className="store-document-upload-copy"><b>{uploading ? 'Uploading photo…' : document.uploaded ? 'Replace photo' : 'Add a document photo'}</b><small>JPG, PNG, or WebP · up to 10 MB</small></span>
        <span className="store-document-upload-action">{uploading ? 'Uploading' : 'Choose file'}</span>
        <input className="store-document-file-input" id={inputId} type="file" accept={ACCEPTED_IMAGES} capture="environment" onChange={selectFile} disabled={disabled} aria-label={`Upload ${document.label}`} />
      </label>
    </article>
  )
}

export function StoreAccessNotice({ section, onOpenRequirements }) {
  return (
    <section className="store-access-notice" role="status">
      <span className="store-verification-kicker">Store setup required</span>
      <h1>{section}</h1>
      <p>Upload photos of your required store documents to unlock this section. Your dashboard stays limited until setup is complete.</p>
      <button className="btn" type="button" onClick={onOpenRequirements}>View store requirements</button>
    </section>
  )
}

export default function StoreVerification({ user, onVerified }) {
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api('/store/verification')
      .then(result => setVerification(result.verification))
      .catch(issue => setError(issue.message))
      .finally(() => setLoading(false))
  }, [])

  const upload = async (documentType, photo) => {
    setUploading(documentType)
    setError('')
    const body = new FormData()
    body.append('document_type', documentType)
    body.append('photo', photo)

    try {
      const result = await api('/store/verification/documents', 'POST', body)
      setVerification(result.verification)
    } catch (issue) {
      setError(issue.message)
    } finally {
      setUploading('')
    }
  }

  if (loading) {
    return <div id="store-requirements" className="store-verification-loading" role="status">Loading store requirements…</div>
  }

  if (!verification) {
    return <section id="store-requirements" className="store-verification-error" role="alert"><h1>Store requirements unavailable</h1><p>{error || 'Try again later.'}</p></section>
  }

  return (
    <section className="store-verification" id="store-requirements">
      <header className="store-verification-header">
        <span className="store-verification-kicker">Store setup</span>
        <h1>Complete store requirements</h1>
        <p>{user.store} · {user.storeType?.replaceAll('_', ' ')}</p>
      </header>

      <section className="store-verification-progress" aria-label="Required document progress">
        <div className="store-verification-progress-heading">
          <strong>{verification.status === 'verified' ? 'Requirements complete' : 'Required photos'}</strong>
          <span>{verification.complete} of {verification.total}</span>
        </div>
        <div className="store-verification-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax={verification.total} aria-valuenow={verification.complete} aria-label={`${verification.complete} of ${verification.total} required photos uploaded`}>
          <span style={{ transform: `scaleX(${verification.total ? verification.complete / verification.total : 1})` }} />
        </div>
        <p>{verification.status === 'verified' ? 'Required photos received. Store access unlocked.' : 'Upload all required photos to unlock full sales history, monthly reports, stock movements, suppliers, expenses, and team tools.'}</p>
      </section>

      <p className="store-verification-auto-note"><strong>Temporary automatic approval:</strong> the app marks requirements complete after all required photos arrive. No one checks the images yet. Permit rules can vary by LGU.</p>

      {error && <p className="store-verification-error-message" role="alert">{error}</p>}

      <section className="store-verification-section">
        <div className="store-verification-section-heading">
          <h2>Required for every store</h2>
          <p>Clear photos only. JPG, PNG, or WebP, up to 10 MB each.</p>
        </div>
        <div className="store-document-list">
          {verification.required.map(document => (
            <RequirementCard key={document.key} document={document} uploading={uploading === document.key} disabled={Boolean(uploading)} onUpload={upload} />
          ))}
        </div>
      </section>

      {verification.optional.length > 0 && (
        <section className="store-verification-section">
          <div className="store-verification-section-heading">
            <h2>Other permits, if applicable</h2>
            <p>Optional here; upload when your business or LGU requires them.</p>
          </div>
          <div className="store-document-list">
            {verification.optional.map(document => (
              <RequirementCard key={document.key} document={document} optional uploading={uploading === document.key} disabled={Boolean(uploading)} onUpload={upload} />
            ))}
          </div>
        </section>
      )}
      {verification.status === 'verified' && <button className="btn store-verification-continue" type="button" onClick={onVerified}>Continue to your store</button>}
    </section>
  )
}
