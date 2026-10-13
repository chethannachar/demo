import { useState } from 'react'
import './App.css'

const apiUrl = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')
).replace(/\/+$/, '')

function requireApiUrl() {
  if (!apiUrl) {
    throw new Error(
      'VITE_API_URL is not configured. Set it in Vercel and redeploy the frontend.',
    )
  }
}

async function readResponse(response) {
  const payload = await response.json()

  if (!response.ok) {
    const detail = payload.detail
    throw new Error(
      typeof detail === 'string' ? detail : 'The request could not be completed.',
    )
  }

  return payload
}

function App() {
  const [saveUsername, setSaveUsername] = useState('')
  const [demoValue, setDemoValue] = useState('')
  const [retrieveUsername, setRetrieveUsername] = useState('')
  const [saveMessage, setSaveMessage] = useState(null)
  const [retrieveMessage, setRetrieveMessage] = useState(null)
  const [record, setRecord] = useState(null)
  const [saving, setSaving] = useState(false)
  const [retrieving, setRetrieving] = useState(false)

  async function saveRecord(event) {
    event.preventDefault()
    setSaving(true)
    setSaveMessage(null)

    try {
      requireApiUrl()
      const response = await fetch(`${apiUrl}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: saveUsername,
          demo_value: demoValue,
        }),
      })
      const saved = await readResponse(response)
      setSaveMessage({
        type: 'success',
        text: `Record saved for ${saved.username}.`,
      })
      setDemoValue('')
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Could not reach the API. Check that the backend is running.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function retrieveRecord(event) {
    event.preventDefault()
    setRetrieving(true)
    setRetrieveMessage(null)
    setRecord(null)

    try {
      requireApiUrl()
      const response = await fetch(
        `${apiUrl}/records/${encodeURIComponent(retrieveUsername.trim())}`,
      )
      const retrieved = await readResponse(response)
      setRecord(retrieved)
    } catch (error) {
      setRetrieveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Could not reach the API. Check that the backend is running.',
      })
    } finally {
      setRetrieving(false)
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="eyebrow">A tiny full-stack demo</span>
        <h1>Record Keeper</h1>
        <p>
          Save a demo value to PostgreSQ, then retrieve it by username.
          <br />
          This is a deployment tutorial—not an authentication system.
        </p>
      </header>

      <section className="cards" aria-label="Record actions">
        <form className="card" onSubmit={saveRecord}>
          <div className="card-heading">
            <span className="step">01</span>
            <div>
              <h2>Save a record</h2>
              <p>Store a username and a non-sensitive demo value.</p>
            </div>
          </div>

          <label htmlFor="save-username">Username</label>
          <input
            id="save-username"
            name="username"
            autoComplete="off"
            maxLength={80}
            placeholder="e.g. demo-user"
            required
            value={saveUsername}
            onChange={(event) => setSaveUsername(event.target.value)}
          />

          <label htmlFor="demo-value">Demo password / value</label>
          <input
            id="demo-value"
            name="demo_value"
            autoComplete="off"
            maxLength={500}
            placeholder="e.g. sample-value-123"
            required
            type="text"
            value={demoValue}
            onChange={(event) => setDemoValue(event.target.value)}
          />

          <button className="button button-primary" disabled={saving} type="submit">
            {saving ? 'Saving…' : 'Save Record'}
          </button>
          {saveMessage && (
            <p className={`message ${saveMessage.type}`} role="status">
              {saveMessage.text}
            </p>
          )}
        </form>

        <form className="card" onSubmit={retrieveRecord}>
          <div className="card-heading">
            <span className="step">02</span>
            <div>
              <h2>Retrieve a value</h2>
              <p>Look up the saved demo value using its username.</p>
            </div>
          </div>

          <label htmlFor="retrieve-username">Username</label>
          <input
            id="retrieve-username"
            name="username"
            autoComplete="off"
            maxLength={80}
            placeholder="e.g. demo-user"
            required
            value={retrieveUsername}
            onChange={(event) => setRetrieveUsername(event.target.value)}
          />

          <button
            className="button button-secondary"
            disabled={retrieving}
            type="submit"
          >
            {retrieving ? 'Retrieving…' : 'Retrieve Password'}
          </button>
          {retrieveMessage && (
            <p className="message error" role="alert">
              {retrieveMessage.text}
            </p>
          )}
          {record && (
            <div className="result" role="status">
              <span>Demo value for {record.username}</span>
              <strong>{record.demo_value}</strong>
            </div>
          )}
        </form>
      </section>

      <footer>
        React + Vite <span aria-hidden="true">·</span> FastAPI{' '}
        <span aria-hidden="true">·</span> PostgreSQL
      </footer>
    </main>
  )
}

export default App
