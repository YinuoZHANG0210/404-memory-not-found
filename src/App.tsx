import { useEffect, useState } from 'react'
import {
  finalizeChoice,
  hasAllMessageClues,
  initialGameState,
  isEvidenceCorrect,
  isSolvedOrder,
  recordPage,
  swapItems,
} from './game'
import type { Chapter, Ending, GameState } from './game'

const STORAGE_KEY = 'memory-not-found-save-v2'
const portraitAsset = `${import.meta.env.BASE_URL}mira-portrait.svg`

const steps: Array<{ chapter: Exclude<Chapter, 'intro' | 'ending'>; number: string; label: string }> = [
  { chapter: 'photo', number: '01', label: 'IMAGE' },
  { chapter: 'messages', number: '02', label: 'MESSAGES' },
  { chapter: 'versions', number: '03', label: 'EVIDENCE' },
  { chapter: 'decision', number: '04', label: 'CHOICE' },
]

const messages = [
  { sender: 'MIRA_17', time: '17.06.2007', hidden: 'I was not lost.', revealed: 'I chose to disappear.' },
  { sender: 'SYSTEM_NOTE', time: '18.06.2007', hidden: 'This was not an error.', revealed: 'The deletion request was signed.' },
  { sender: 'LINK_CHECK', time: '18.06.2007', hidden: 'A private file remains.', revealed: 'It asks the archive to stop guessing.' },
]

const endings: Record<Ending, { label: string; title: string; text: string; tone: string }> = {
  restore: {
    label: 'RESTORE EVERYTHING',
    title: 'THE PERFECT ARCHIVE',
    text: 'The missing site returns complete and convincing. It also keeps a beautiful summer in Lisbon that no record can prove.',
    tone: 'pink',
  },
  preserve: {
    label: 'PRESERVE VERIFIED FRAGMENTS',
    title: 'THE INCOMPLETE TRUTH',
    text: 'The signed request and public fragments remain. The gaps stay visible, because the archive refuses to make them up.',
    tone: 'mint',
  },
  release: {
    label: 'RESPECT THE DELETION',
    title: '404: MEMORY NOT FOUND',
    text: 'The file is released. The archive records only that someone chose not to turn absence into a story.',
    tone: 'paper',
  },
}

function loadSession(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialGameState()
    const parsed = JSON.parse(saved) as Partial<GameState>
    const validChapters: Chapter[] = ['intro', 'photo', 'messages', 'versions', 'decision', 'ending']
    if (!validChapters.includes(parsed.chapter as Chapter)) return initialGameState()
    return { ...initialGameState(), ...parsed }
  } catch {
    return initialGameState()
  }
}

function App() {
  const [game, setGame] = useState<GameState>(loadSession)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  const activeStep = steps.findIndex((step) => step.chapter === game.chapter)
  const updateGame = (next: GameState) => setGame(next)
  const goTo = (chapter: Chapter) => updateGame({ ...game, chapter, pagesAccessed: recordPage(game.pagesAccessed, chapter) })

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedTile(null)
    setNotice('New recovery session started.')
    setGame(initialGameState())
  }

  const selectTile = (position: number) => {
    if (game.photoSolved) return
    if (selectedTile === null) {
      setSelectedTile(position)
      setNotice('Choose one more fragment to swap.')
      return
    }
    if (selectedTile === position) {
      setSelectedTile(null)
      setNotice('Selection cleared.')
      return
    }
    const photoTiles = swapItems(game.photoTiles, selectedTile, position)
    const photoSolved = isSolvedOrder(photoTiles)
    updateGame({ ...game, photoTiles, photoSolved, restorationAttempts: game.restorationAttempts + 1 })
    setSelectedTile(null)
    setNotice(photoSolved ? 'Image recovered. Open the messages.' : 'Fragments swapped. Keep looking for Mira’s face and the window edge.')
  }

  const revealMessage = (index: number) => {
    if (game.openedClues.includes(index)) return
    const openedClues = [...game.openedClues, index]
    updateGame({ ...game, openedClues })
    setNotice(hasAllMessageClues(openedClues) ? 'All messages recovered. Check the evidence.' : 'Message recovered. Two more remain.')
  }

  const answer = (claim: 'request' | 'location', value: 'verified' | 'inferred') => {
    updateGame({ ...game, evidenceAnswers: { ...game.evidenceAnswers, [claim]: value } })
    setNotice('Choice recorded. Compare it with the source files.')
  }

  const checkEvidence = () => {
    const evidenceSolved = isEvidenceCorrect(game.evidenceAnswers)
    updateGame({ ...game, evidenceSolved })
    setNotice(evidenceSolved ? 'Evidence verified. You can now choose the archive outcome.' : 'Not quite. One claim is evidence; the other is an inference.')
  }

  const chooseEnding = (ending: Ending) => updateGame(finalizeChoice(game, ending))

  return (
    <main className="game-shell">
      <header className="topbar">
        <button className="wordmark" type="button" onClick={restart} aria-label="Restart 404 Memory Not Found">
          <span>404</span> MEMORY NOT FOUND
        </button>
        <div className="progress" aria-label="Recovery progress">
          {steps.map((step, index) => (
            <div className={`progress-step ${index <= activeStep ? 'is-active' : ''}`} key={step.chapter}>
              <span>{step.number}</span><small>{step.label}</small>
            </div>
          ))}
        </div>
        <button className="text-button" type="button" onClick={restart}>RESTART</button>
      </header>

      {game.chapter === 'intro' && (
        <section className="screen intro-screen">
          <div className="intro-copy">
            <p className="eyebrow">RECOVERY SESSION / 2089</p>
            <h1>Someone deleted<br />their memory.</h1>
            <p className="lede">You found a damaged personal archive. Recover only what the files can actually tell you — then decide what should remain.</p>
            <div className="how-to">
              <span>HOW TO PLAY</span>
              <p>Complete four small recovery tasks. Every screen tells you exactly what to do.</p>
            </div>
            <button className="action-button" type="button" onClick={() => goTo('photo')}>BEGIN RECOVERY <span>→</span></button>
          </div>
          <div className="lost-file" aria-hidden="true">
            <div className="file-tab">MIRA_17 / LAST FOUND</div>
            <div className="portrait-wrap"><Portrait /></div>
            <p>image_preview.jpg</p>
            <b>FILE DAMAGED</b>
          </div>
        </section>
      )}

      {game.chapter === 'photo' && (
        <section className="screen task-screen">
          <StepHeading number="01" title="Rebuild the photograph" instruction="Click one fragment, then another, to swap their positions." />
          <div className={`puzzle-board ${game.photoSolved ? 'is-solved' : ''}`} aria-label="Photo fragment puzzle">
            {game.photoTiles.map((tile, position) => (
              <button
                className={`photo-piece ${selectedTile === position ? 'is-selected' : ''}`}
                type="button"
                onClick={() => selectTile(position)}
                key={`${tile}-${position}`}
                aria-label={`Photo fragment ${position + 1}${selectedTile === position ? ', selected' : ''}`}
                style={{ backgroundImage: `url(${portraitAsset})`, backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 100}%` }}
              />
            ))}
          </div>
          <StatusLine message={notice || 'Six fragments. One missing portrait.'} />
          {game.photoSolved && <button className="action-button" type="button" onClick={() => goTo('messages')}>OPEN RECOVERED MESSAGES <span>→</span></button>}
        </section>
      )}

      {game.chapter === 'messages' && (
        <section className="screen task-screen">
          <StepHeading number="02" title="Open the hidden messages" instruction="Open every message. The recovered lines explain why the archive broke." />
          <div className="message-grid">
            {messages.map((message, index) => {
              const opened = game.openedClues.includes(index)
              return <button className={`message-card ${opened ? 'is-open' : ''}`} type="button" onClick={() => revealMessage(index)} key={message.sender}>
                <span>{message.sender} <i>{message.time}</i></span>
                <strong>{opened ? message.revealed : message.hidden}</strong>
                <em>{opened ? 'RECOVERED' : 'CLICK TO OPEN'}</em>
              </button>
            })}
          </div>
          <StatusLine message={notice || `${game.openedClues.length}/3 messages opened`} />
          {hasAllMessageClues(game.openedClues) && <button className="action-button" type="button" onClick={() => goTo('versions')}>CHECK THE EVIDENCE <span>→</span></button>}
        </section>
      )}

      {game.chapter === 'versions' && (
        <section className="screen task-screen evidence-screen">
          <StepHeading number="03" title="Separate fact from fiction" instruction="Use the two source files, then classify both claims." />
          <div className="source-files">
            <article><span>FILE_01 / SIGNED_REQUEST.PDF</span><p>18.06.2007 — “Please delete my profile and private records.”</p><b>PRIMARY SOURCE</b></article>
            <article><span>FILE_02 / AUTO_RECONSTRUCTION.LOG</span><p>“Mira probably spent a summer in Lisbon.” No original source attached.</p><b>SYSTEM GUESS</b></article>
          </div>
          <div className="claims">
            <Claim text="Mira asked for her private records to be deleted." value={game.evidenceAnswers.request} onChoose={(value) => answer('request', value)} />
            <Claim text="Mira spent a summer in Lisbon." value={game.evidenceAnswers.location} onChoose={(value) => answer('location', value)} />
          </div>
          <button className="check-button" type="button" onClick={checkEvidence}>CHECK MY ANSWERS</button>
          <StatusLine message={notice || 'A convincing story is not always evidence.'} />
          {game.evidenceSolved && <button className="action-button" type="button" onClick={() => goTo('decision')}>MAKE THE FINAL CHOICE <span>→</span></button>}
        </section>
      )}

      {game.chapter === 'decision' && (
        <section className="screen task-screen decision-screen">
          <StepHeading number="04" title="Choose what the archive becomes" instruction="There is no correct ending. Pick the responsibility you want the archive to take." />
          <div className="choice-grid">
            {(Object.keys(endings) as Ending[]).map((ending) => <Choice key={ending} ending={ending} onChoose={chooseEnding} />)}
          </div>
        </section>
      )}

      {game.chapter === 'ending' && game.ending && (
        <section className={`screen ending-screen ending-${endings[game.ending].tone}`}>
          <p className="eyebrow">ARCHIVE OUTCOME / SAVED LOCALLY</p>
          <div className="ending-mark">{game.ending === 'release' ? '404' : '✓'}</div>
          <h1>{endings[game.ending].title}</h1>
          <p className="lede">{endings[game.ending].text}</p>
          <div className="ending-actions">
            <button className="action-button" type="button" onClick={restart}>PLAY AGAIN <span>↺</span></button>
            <button className="text-button" type="button" onClick={() => goTo('decision')}>SEE OTHER OUTCOMES</button>
          </div>
        </section>
      )}

      <footer>FICTIONAL PERSONAL ARCHIVE · NO DATA LEAVES THIS DEVICE</footer>
    </main>
  )
}

function StepHeading({ number, title, instruction }: { number: string; title: string; instruction: string }) {
  return <div className="step-heading"><p className="eyebrow">TASK {number} / 04</p><h1>{title}</h1><p className="lede">{instruction}</p></div>
}

function StatusLine({ message }: { message: string }) {
  return <p className="status-line" role="status"><span>ARCHIVE STATUS</span>{message}</p>
}

function Claim({ text, value, onChoose }: { text: string; value?: string; onChoose: (value: 'verified' | 'inferred') => void }) {
  return <article className="claim"><p>{text}</p><div><button className={value === 'verified' ? 'selected' : ''} type="button" onClick={() => onChoose('verified')}>CAN PROVE</button><button className={value === 'inferred' ? 'selected' : ''} type="button" onClick={() => onChoose('inferred')}>CANNOT PROVE</button></div></article>
}

function Choice({ ending, onChoose }: { ending: Ending; onChoose: (ending: Ending) => void }) {
  const entry = endings[ending]
  return <button className={`choice-card choice-${entry.tone}`} type="button" onClick={() => onChoose(ending)}><span>{ending === 'restore' ? '01' : ending === 'preserve' ? '02' : '03'}</span><strong>{entry.label}</strong><p>{entry.text}</p><em>CHOOSE →</em></button>
}

function Portrait() {
  return <svg viewBox="0 0 300 360" role="img" aria-label="A fragmented portrait preview"><rect width="300" height="360" fill="#283344" /><circle cx="150" cy="146" r="72" fill="#74899e" /><path d="M73 319c10-93 46-132 77-132s67 39 77 132" fill="#9adacb" /><path d="M82 148c0-66 30-102 70-102s69 34 69 102c-18-22-39-32-70-32s-51 10-69 32Z" fill="#10151f" /><circle cx="124" cy="148" r="5" fill="#10151f" /><circle cx="176" cy="148" r="5" fill="#10151f" /><path d="M130 180c12 9 28 9 40 0" fill="none" stroke="#10151f" strokeWidth="5" /><path d="M0 62h300M0 250h300" stroke="#d88da6" strokeDasharray="8 11" strokeWidth="3" opacity=".8" /></svg>
}

export default App
