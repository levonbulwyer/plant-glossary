import { useState, useEffect, useMemo } from 'react'
import { INITIAL_TERMS } from './data'
import styles from './App.module.css'

const STORAGE_KEY = 'plant-glossary-words'
const STATUS_CYCLE = { todo: 'learning', learning: 'learned', learned: 'todo' }
const STATUS_LABELS = { todo: 'To Do', learning: 'Learning', learned: 'Learned' }

function loadWords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return INITIAL_TERMS.map(([term, question], i) => ({
    id: i, term, question, status: 'todo'
  }))
}

function saveWords(words) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(words)) } catch {}
}

export default function App() {
  const [words, setWords]       = useState(loadWords)
  const [filter, setFilter]     = useState('all')
  const [query, setQuery]       = useState('')
  const [expandedId, setExpId]  = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [newTerm, setNewTerm]   = useState('')
  const [newQ, setNewQ]         = useState('')

  useEffect(() => { saveWords(words) }, [words])

  const counts = useMemo(() => ({
    learned:  words.filter(w => w.status === 'learned').length,
    learning: words.filter(w => w.status === 'learning').length,
    todo:     words.filter(w => w.status === 'todo').length,
    total:    words.length,
  }), [words])

  const pct = counts.total ? Math.round((counts.learned / counts.total) * 100) : 0

  const visible = useMemo(() => {
    const q = query.toLowerCase()
    return words
      .filter(w => (filter === 'all' || w.status === filter) &&
                   (!q || w.term.toLowerCase().includes(q) ||
                         w.question?.toLowerCase().includes(q)))
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [words, filter, query])

  function updateStatus(id, status) {
    setWords(ws => ws.map(w => w.id === id
      ? { ...w, status: w.status === status ? 'todo' : status }
      : w))
  }

  function cycleStatus(id) {
    setWords(ws => ws.map(w => w.id === id
      ? { ...w, status: STATUS_CYCLE[w.status] }
      : w))
  }

  function deleteWord(id) {
    setWords(ws => ws.filter(w => w.id !== id))
    if (expandedId === id) setExpId(null)
  }

  function addWord() {
    if (!newTerm.trim()) return
    const id = words.length > 0 ? Math.max(...words.map(w => w.id)) + 1 : 0
    setWords(ws => [...ws, { id, term: newTerm.trim(), question: newQ.trim(), status: 'todo' }])
    setNewTerm('')
    setNewQ('')
    setShowAdd(false)
  }

  function toggle(id) { setExpId(x => x === id ? null : id) }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>🌿</div>
          <div>
            <h1 className={styles.title}>Plant Biology Glossary</h1>
            <p className={styles.subtitle}>Study tool — track your progress term by term</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { key: 'learned',  label: 'Learned',  color: '#2E7D32' },
            { key: 'learning', label: 'Learning',  color: '#F57F17' },
            { key: 'todo',     label: 'To Do',     color: '#757575' },
            { key: 'total',    label: 'Total',     color: '#1A237E' },
          ].map(({ key, label, color }) => (
            <div key={key} className={styles.statCard}>
              <div className={styles.statNum} style={{ color }}>{counts[key]}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: pct + '%' }} />
          </div>
          <span className={styles.progressLabel}>{pct}% learned</span>
        </div>

        {/* Search + filter */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search terms or questions…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          <div className={styles.filters}>
            {['all','todo','learning','learned'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Add new term */}
        <button
          className={styles.addToggle}
          onClick={() => { setShowAdd(s => !s); setNewTerm(''); setNewQ('') }}
        >
          {showAdd ? '✕ Cancel' : '+ Add a new term'}
        </button>

        {showAdd && (
          <div className={styles.addForm}>
            <input
              className={styles.addInput}
              type="text"
              placeholder="Term (required)"
              value={newTerm}
              onChange={e => setNewTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWord()}
              autoFocus
            />
            <textarea
              className={styles.addTextarea}
              placeholder="Quiz question (optional)"
              value={newQ}
              onChange={e => setNewQ(e.target.value)}
              rows={3}
            />
            <button className={styles.addBtn} onClick={addWord}>Add term</button>
          </div>
        )}

        {/* Count */}
        <p className={styles.countLabel}>
          Showing {visible.length} of {words.length} terms
        </p>

        {/* List */}
        <div className={styles.list}>
          {visible.length === 0 && (
            <div className={styles.empty}>No terms match your search.</div>
          )}
          {visible.map(w => {
            const exp = expandedId === w.id
            return (
              <div
                key={w.id}
                className={`${styles.card} ${styles['card_' + w.status]} ${exp ? styles.cardExpanded : ''}`}
                onClick={() => toggle(w.id)}
              >
                <button
                  className={`${styles.dot} ${styles['dot_' + w.status]}`}
                  title="Click to cycle status"
                  onClick={e => { e.stopPropagation(); cycleStatus(w.id) }}
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span className={styles.term}>{w.term}</span>
                    {w.status !== 'todo' && (
                      <span className={`${styles.badge} ${styles['badge_' + w.status]}`}>
                        {STATUS_LABELS[w.status]}
                      </span>
                    )}
                    <span className={styles.chevron}>{exp ? '▲' : '▼'}</span>
                  </div>

                  {exp && (
                    <>
                      {w.question && (
                        <p className={styles.question}>{w.question}</p>
                      )}
                      <div className={styles.actions}>
                        {['todo','learning','learned'].map(s => (
                          <button
                            key={s}
                            className={`${styles.actionBtn} ${w.status === s ? styles['actionActive_' + s] : ''}`}
                            onClick={e => { e.stopPropagation(); updateStatus(w.id, s) }}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                        <button
                          className={styles.deleteBtn}
                          onClick={e => { e.stopPropagation(); deleteWord(w.id) }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
