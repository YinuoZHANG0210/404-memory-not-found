import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent } from 'react'
import {
  initialGameState,
  finalizeChoice,
  hasAllMessageClues,
  isEvidenceCorrect,
  isSolvedOrder,
  loadGame,
  recordPage,
  swapItems,
} from './game'
import type { Chapter, Ending, GameState, Language } from './game'

const STORAGE_KEY = 'memory-not-found-save'

const copy = {
  en: {
    chapterNames: ['PAGE NOT FOUND', 'FRAGMENTED IMAGE', 'HIDDEN MESSAGES', 'PREVIOUS VERSIONS', 'THE FINAL DECISION'],
    archive: 'ARCHIVE INDEX', hints: 'Ask the archive', restart: 'Restart / Clear Progress', sound: 'Sound',
    hint: 'HINT', close: 'CLOSE', next: 'CONTINUE', recovered: 'RECOVERED', locked: 'LOCKED',
    photoTitle: 'Mira’s camera roll', photoInstruction: 'Drag a fragment onto another to swap them. Or click two fragments.',
    moves: 'SWAPS', photoSolved: 'IMAGE RECONSTRUCTED', messages: 'message board / 2007',
    pathTitle: 'Reassemble the broken address', openFile: 'OPEN ARCHIVE PATH', versionTitle: 'A memory, three witnesses',
    evidenceTitle: 'Mark what the archive can actually prove', verified: 'VERIFIED RECORD', inferred: 'SYSTEM INFERENCE',
    check: 'CHECK EVIDENCE', decisionTitle: 'The archive is ready to be written.',
    decisionText: 'Each action leaves a different kind of absence. There is no neutral restore operation.',
    visitor: 'VISITOR RECORD CREATED', attempts: 'Restoration attempts', pages: 'Pages accessed', hintCount: 'Hints requested',
    localNotice: 'Fictional archive record. This session stays on this device; no identity or activity is sent anywhere.',
    endings: ['Restore Everything', 'Preserve Verified Fragments', 'Respect the Deletion'],
    restartRun: 'RESTART FROM 404', explore: 'EXPLORE ANOTHER ENDING', previous: 'RETURN TO THE CHOICE',
    language: '中文', toggleSound: 'SOUND OFF', toggleSoundOn: 'SOUND ON', solvedPath: 'PATH VERIFIED — PRIVATE REQUEST FOUND',
    chooseFragments: 'Select the fragments in the order they appear in the address.', notYet: 'The archive still finds contradictions.',
    progress: 'ARCHIVE FILES', introHint: 'Something on this broken page is still responding.', footer: 'a personal site by Mira · last indexed 2089',
  },
  zh: {
    chapterNames: ['页面未找到', '破碎的照片', '隐藏留言', '历史版本', '最终决定'],
    archive: '档案目录', hints: '询问档案', restart: '重新开始 / 清除进度', sound: '声音',
    hint: '提示', close: '关闭', next: '继续', recovered: '已恢复', locked: '未解锁',
    photoTitle: 'Mira 的相册', photoInstruction: '将碎片拖到另一块上交换；也可以依次点击两块。',
    moves: '次交换', photoSolved: '照片已重建', messages: '留言板 / 2007',
    pathTitle: '重新拼出损坏的网址', openFile: '打开档案路径', versionTitle: '一段记忆，三位见证者',
    evidenceTitle: '标记档案真正能够证明的内容', verified: '已验证记录', inferred: '系统推测',
    check: '核对证据', decisionTitle: '档案已经准备好被写入。',
    decisionText: '每种操作都会留下不同的空缺。恢复从来不是中立的。',
    visitor: '访客记录已建立', attempts: '恢复尝试', pages: '访问档案页', hintCount: '请求提示',
    localNotice: '虚构的档案记录。数据仅保存在本机；不会收集身份信息，也不会上传活动记录。',
    endings: ['恢复全部内容', '保留已验证片段', '尊重删除决定'],
    restartRun: '从 404 重新开始', explore: '探索其他结局', previous: '返回选择页面',
    language: 'EN', toggleSound: '声音关闭', toggleSoundOn: '声音开启', solvedPath: '路径已验证 — 找到私人删除请求',
    chooseFragments: '按网址中的顺序选择片段。', notYet: '档案中仍有无法解释的矛盾。',
    progress: '档案文件', introHint: '这个损坏页面上，还有什么仍在响应。', footer: 'Mira 的个人网站 · 最后索引于 2089 年',
  },
} as const

const hints: Record<Exclude<Chapter, 'ending'>, [string, string, string]> = {
  intro: ['The footer image is more than decoration.', 'Look for a broken link that reacts when opened.', 'Open the underlined “archive-recovery” link beside the missing thumbnail.'],
  photo: ['Each portrait fragment belongs in one of six positions.', 'Use Mira’s face, hair, and the window edge to align the fragments.', 'Swap until the row order reads 0, 1, 2 / 3, 4, 5.'],
  messages: ['Some text only exists when you interact with the damaged board.', 'Hover the ghosted line, click the corrupted star, then inspect the archive link.', 'Reveal all three clues; then arrange /users → /mira → /delete-request.'],
  versions: ['A plausible detail is not the same as a recorded detail.', 'The request has a dated receipt. The location appears only in the AI reconstruction.', 'Mark the deletion request VERIFIED and the Lisbon claim SYSTEM INFERENCE.'],
  decision: ['The archive can preserve, embellish, or stop recovering.', 'Read the visitor record: your actions have become part of this archive too.', 'Choose the outcome that matches what you want this system to retain.'],
}

const endingCopy: Record<Ending, { title: string; subtitle: string; text: string; image: string }> = {
  restore: {
    title: 'THE PERFECT ARCHIVE',
    subtitle: 'Everything is beautifully, plausibly in place.',
    text: 'The site blooms back into a complete little world: the guestbook, the photographs, a summer in Lisbon. The reconstruction feels intimate. One detail has no source. The archive labels it “probable” in a footnote almost nobody will open.',
    image: 'ending-perfect',
  },
  preserve: {
    title: 'THE INCOMPLETE TRUTH',
    subtitle: 'What can be proved remains. The gaps stay visible.',
    text: 'The dated request is preserved beside the fragments Mira left public. The invented summer is removed; its empty field is marked UNKNOWN. The page is less complete, and more honest about what it cannot know.',
    image: 'ending-truth',
  },
  release: {
    title: '404: MEMORY NOT FOUND',
    subtitle: 'The request is finally allowed to mean what it said.',
    text: 'The recovered pieces return to quiet. The private file is not opened again. In its place, the archive leaves one line for whoever arrives next: “Some absences are intentional.”',
    image: 'ending-release',
  },
}

const versionData = [
  {
    label: 'ORIGINAL ARCHIVE',
    stamp: 'CACHE COPY · 12 MAY 2087',
    text: 'Mira writes about the blue room and a late train. The destination field is blank. No location is recorded.',
  },
  {
    label: 'AI RECONSTRUCTED',
    stamp: 'MODEL PASS · CONFIDENCE 0.61',
    text: 'Mira leaves for Lisbon after the summer. The blue room appears beside the river. [No source file attached.]',
  },
  {
    label: 'DELETED VERSION',
    stamp: 'SIGNED REQUEST · 14 MAY 2087',
    text: '“Please remove the private entries and the location guesses. I am not lost. I am asking you to stop keeping this part.”',
  },
]

function playTone(kind: 'click' | 'success') {
  try {
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = kind === 'success' ? 660 : 440
    gain.gain.setValueAtTime(0.035, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.09)
    oscillator.onended = () => void context.close()
  } catch (error) {
    console.warn('Optional archive sound could not play.', error)
  }
}

function Portrait({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 360 240" role="img" aria-label="A worn, sunlit snapshot of Mira beside a window">
      <defs>
        <linearGradient id="room" x2="0" y2="1"><stop stopColor="#9ca9a0" /><stop offset="1" stopColor="#546874" /></linearGradient>
        <linearGradient id="shirt" x2="1" y2="1"><stop stopColor="#9adacb" /><stop offset="1" stopColor="#477c7e" /></linearGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 .13" /></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light" /></filter>
        <clipPath id="photoCut"><path d="M10 9h340v218H10z" /></clipPath>
      </defs>
      <g clipPath="url(#photoCut)">
        <path fill="url(#room)" d="M0 0h360v240H0z" />
        <path fill="#d5cbb4" opacity=".86" d="M27 18h109v134H27z" />
        <path fill="#96b6b5" d="M34 24h95v120H34z" />
        <path stroke="#e5d9bd" strokeWidth="6" d="M81 24v120M34 82h95" />
        <path fill="#425361" d="M138 0h11v240h-11zM0 182h360v58H0z" />
        <path fill="#d6c8a7" opacity=".65" d="M149 32h29v88h-29z" />
        <path fill="#b98971" d="M196 76c2-37 54-48 68-7l-7 63h-57z" />
        <path fill="#554841" d="M193 79c-4-36 29-55 58-39 18 10 20 30 12 46-8-13-19-22-36-25-7 16-17 26-34 32z" />
        <path fill="#ead2b7" d="M203 104c-1-21 8-39 25-42 18-3 31 13 31 35 0 22-12 39-28 39-14 0-27-13-28-32z" />
        <path fill="#453c39" d="M211 100h5m24-1h5" stroke="#453c39" strokeWidth="3" strokeLinecap="round" />
        <path fill="none" stroke="#a05f5a" strokeWidth="2" d="M221 119q10 6 19-1" />
        <path fill="url(#shirt)" d="M166 226c4-48 17-73 44-86l15 14 17-15c31 14 44 41 51 87z" />
        <path fill="#d88da6" opacity=".66" d="M34 156q25-22 53-1v28H34z" />
        <path fill="#f2dcae" opacity=".56" d="M16 171h72v4H16z" />
        <path fill="#e9e5d9" opacity=".17" d="M0 0h360v240H0z" filter="url(#grain)" />
        <path fill="#dbd7ce" opacity=".18" d="M18 18h54v2H18zM260 34h34v2h-34zM281 203h59v2h-59z" />
        <path fill="#d88da6" opacity=".24" d="M5 13h4v101H5z" />
        <path fill="#9adacb" opacity=".2" d="M339 82h5v72h-5z" />
      </g>
      <path fill="none" stroke="#e1d9c5" strokeOpacity=".65" d="M10.5 9.5h339v218h-339z" />
    </svg>
  )
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame)
  const [language, setLanguage] = useState<Language>('en')
  const [sound, setSound] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [hintOpen, setHintOpen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [dragTile, setDragTile] = useState<number | null>(null)
  const [pathSelected, setPathSelected] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [glitch, setGlitch] = useState(false)
  const [showIndex, setShowIndex] = useState(false)
  const [endPreview, setEndPreview] = useState<Ending | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const t = copy[language]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  const currentEnding = endPreview ?? game.ending
  const discoveredFiles = useMemo(() => [
    { id: 'photo', label: '07 / camera-roll', unlocked: game.photoSolved },
    { id: 'messages', label: '12 / guestbook', unlocked: game.pathSolved },
    { id: 'versions', label: '14 / deletion-request', unlocked: game.evidenceSolved },
  ], [game.photoSolved, game.pathSolved, game.evidenceSolved])

  function updateGame(updater: (previous: GameState) => GameState) {
    setGame((previous) => updater(previous))
  }

  function transition(chapter: Chapter) {
    setGlitch(true)
    window.setTimeout(() => setGlitch(false), 480)
    setMessage('')
    setHintLevel(0)
    updateGame((previous) => ({
      ...previous,
      chapter,
      pagesAccessed: recordPage(previous.pagesAccessed, chapter === 'photo' ? 'camera-roll' : chapter === 'messages' ? 'guestbook' : chapter === 'versions' ? 'history' : chapter === 'decision' ? 'control-room' : chapter),
    }))
    window.setTimeout(() => contentRef.current?.focus(), 30)
  }

  function resetGame() {
    localStorage.removeItem(STORAGE_KEY)
    setGame(initialGameState())
    setHintLevel(0)
    setHintOpen(false)
    setSelectedTile(null)
    setPathSelected(null)
    setMessage('')
    setEndPreview(null)
    setShowIndex(false)
  }

  function revealHint() {
    setHintLevel((level) => Math.min(level + 1, 3))
    setHintOpen(true)
    updateGame((previous) => ({ ...previous, hintsUsed: previous.hintsUsed + 1 }))
    if (sound) playTone('click')
  }

  function swapPhoto(first: number, second: number) {
    if (game.photoSolved) return
    const next = swapItems(game.photoTiles, first, second)
    const solved = isSolvedOrder(next)
    updateGame((previous) => ({
      ...previous,
      photoTiles: next,
      photoSolved: solved,
      restorationAttempts: previous.restorationAttempts + 1,
      pagesAccessed: solved ? recordPage(previous.pagesAccessed, 'recovered-photo') : previous.pagesAccessed,
    }))
    setSelectedTile(null)
    setMessage(solved ? 'A face emerges from the static. Mira, 18 June 2007.' : 'Fragments shifted. Keep following the edges.')
    if (solved && sound) playTone('success')
  }

  function selectPhoto(index: number) {
    if (selectedTile === null) setSelectedTile(index)
    else swapPhoto(selectedTile, index)
  }

  function onPhotoDrop(event: DragEvent<HTMLButtonElement>, target: number) {
    event.preventDefault()
    const source = dragTile ?? Number(event.dataTransfer.getData('text/plain'))
    if (Number.isInteger(source) && source >= 0 && source < 6) swapPhoto(source, target)
    setDragTile(null)
  }

  function updateClue(id: number) {
    updateGame((previous) => {
      const openedClues = previous.openedClues.includes(id) ? previous.openedClues : [...previous.openedClues, id]
      const pagesAccessed = recordPage(previous.pagesAccessed, `board-clue-${id}`)
      return { ...previous, openedClues, pagesAccessed }
    })
    if (sound) playTone('click')
  }

  function swapPath(first: number, second: number) {
    const order = swapItems(game.pathOrder, first, second)
    const solved = order.every((value, index) => value === index)
    updateGame((previous) => ({
      ...previous,
      pathOrder: order,
      pathSolved: solved,
      restorationAttempts: previous.restorationAttempts + 1,
      pagesAccessed: solved ? recordPage(previous.pagesAccessed, 'private-deletion-request') : previous.pagesAccessed,
    }))
    setPathSelected(null)
    setMessage(solved ? t.solvedPath : 'The address does not resolve. The board left a breadcrumb: ROOT → PERSON → REQUEST.')
    if (solved && sound) playTone('success')
  }

  function submitEvidence() {
    if (isEvidenceCorrect(game.evidenceAnswers)) {
      updateGame((previous) => ({
        ...previous,
        evidenceSolved: true,
        pagesAccessed: recordPage(previous.pagesAccessed, 'verified-history'),
      }))
      setMessage('Evidence reconciled. The deletion was intentional; the location was invented.')
      if (sound) playTone('success')
    } else {
      updateGame((previous) => ({ ...previous, restorationAttempts: previous.restorationAttempts + 1 }))
      setMessage(t.notYet)
    }
  }

  function makeDecision(ending: Ending) {
    updateGame((previous) => finalizeChoice(previous, ending))
    setEndPreview(null)
    setMessage('')
  }

  function renderIntro() {
    return (
      <div className="intro-page">
        <div className="site-brand"><span className="broken-mark">▧</span><span>mira&apos;s <del>little</del> place</span><sup>1999—2007</sup></div>
        <div className="intro-split">
          <div>
            <p className="eyebrow">HTTP STATUS: 404 · CACHE DATE: 2089/04/31</p>
            <h1>404<br /><span>MEMORY NOT FOUND</span></h1>
            <p className="intro-lede">The page you are looking for no longer exists.</p>
            <p className="muted-copy">The address may have changed, or the memory may have been removed.</p>
            <div className="dead-links">
              <a href="#missing" onClick={(event) => { event.preventDefault(); setMessage('This address was never indexed.') }}>guestbook.html</a>
              <a href="#missing" onClick={(event) => { event.preventDefault(); setMessage('The server returned an empty directory.') }}>pictures/</a>
              <a href="#missing" onClick={(event) => { event.preventDefault(); setMessage('Last response: 00:00:00 — tomorrow.') }}>about_me.htm</a>
            </div>
          </div>
          <div className="missing-photo" aria-label="Broken image, hover or open the archive recovery link">
            <div className="missing-img-symbol"><span>▧</span> image_06.jpg<br /><small>ERR_FILE_NOT_FOUND</small></div>
            <p className="photo-caption">[the image could not be loaded]</p>
            <a className="recovery-link" href="#archive-recovery" onClick={(event) => { event.preventDefault(); transition('photo') }}>
              <span aria-hidden="true">↳</span> archive-recovery <span className="link-note">[responding]</span>
            </a>
          </div>
        </div>
        <div className="not-found-bottom">
          <span className="corrupt-line">⟦ cache: 00:00:00 / 32.14.89 ⟧ <span className="scramble">reco▒ery̷_̵po̵i̷n̵t</span></span>
          <span>{t.introHint}</span>
        </div>
        <p className="micro-footer">© 2007 Mira / mirrored by a system that does not know when to let go</p>
      </div>
    )
  }

  function renderPhoto() {
    return (
      <div className="chapter-body">
        <div className="chapter-heading">
          <div><p className="eyebrow">DIRECTORY / IMAGES / 07</p><h1>{t.photoTitle}</h1></div>
          <span className="file-stamp">JPEG · PARTIAL RECOVERY</span>
        </div>
        <p className="instruction">{t.photoInstruction}</p>
        <div className={`puzzle-photo ${game.photoSolved ? 'puzzle-solved' : ''}`} aria-label="Six draggable pieces of a photograph">
          {game.photoTiles.map((tile, position) => (
            <button
              key={position}
              className={`photo-tile ${selectedTile === position ? 'selected' : ''} ${game.photoSolved ? 'tile-restored' : ''}`}
              style={{ backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 100}%` }}
              draggable={!game.photoSolved}
              aria-label={`Photo fragment in slot ${position + 1}, showing section ${tile + 1}`}
              onDragStart={(event) => { setDragTile(position); event.dataTransfer.setData('text/plain', String(position)); event.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onPhotoDrop(event, position)}
              onClick={() => selectPhoto(position)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPhoto(position) } }}
            />
          ))}
          {game.photoSolved && <div className="portrait-label"><span>MIRA</span><small>18 JUN 2007 · 16:42</small></div>}
        </div>
        <div className="puzzle-meta"><span>{game.photoSolved ? t.photoSolved : `${t.moves}: ${game.restorationAttempts}`}</span><span>IMG_0618.JPG</span></div>
        <p className={`status-line ${message.includes('Mira') ? 'success-text' : ''}`} aria-live="polite">{message || (game.photoSolved ? '“That was the last day before the site went quiet.”' : 'A contact sheet, scattered by a damaged index.')}</p>
        {game.photoSolved && <button className="text-button" onClick={() => transition('messages')}>OPEN GUESTBOOK ↗</button>}
      </div>
    )
  }

  function renderMessages() {
    const clues = [
      { id: 0, lead: 'mira_17: ', hidden: "I wasn't lost. I chose to disappear." },
      { id: 1, lead: 'mod_note: ', hidden: 'The request was signed. It was not a server error.' },
      { id: 2, lead: 'link_check: ', hidden: 'The route reads from broadest folder to private request.' },
    ]
    const pathParts = ['/users', '/mira', '/delete-request']
    const messagesRevealed = hasAllMessageClues(game.openedClues)
    return (
      <div className="chapter-body">
        <div className="chapter-heading">
          <div><p className="eyebrow">BOARD / ARCHIVE / 12</p><h1>{t.messages}</h1></div>
          <span className="file-stamp">3 POSTS · 2 DELETED</span>
        </div>
        <div className="board-paper" onMouseUp={() => { if ((window.getSelection()?.toString().trim().length ?? 0) > 4) updateClue(0) }}>
          <p className="board-date">Tuesday, 14 August 2007 — cached from a broken mirror</p>
          <p className="board-quote">“if you can still read this, maybe the links work better for you than they did for me.”</p>
          <div className="hidden-lines">
            {clues.map((clue) => (
              <button
                className={`hidden-line ${game.openedClues.includes(clue.id) ? 'revealed' : ''}`}
                key={clue.id}
                onMouseEnter={() => updateClue(clue.id)}
                onFocus={() => updateClue(clue.id)}
                onClick={() => updateClue(clue.id)}
                aria-label={game.openedClues.includes(clue.id) ? clue.hidden : `Reveal corrupted message ${clue.id + 1}`}
              >
                <span>{clue.lead}</span>
                <span>{game.openedClues.includes(clue.id) ? clue.hidden : '▒▒▓░░▒▓▒░░▒▓▒░░ [hover / open]'}</span>
              </button>
            ))}
          </div>
          <div className="board-corrupt" role="button" tabIndex={0} onClick={() => updateClue(1)} onKeyDown={(event) => { if (event.key === 'Enter') updateClue(1) }}>
            <span className="error-pink">✳</span> POST ARCHIVED — <span className="hover-reveal" onMouseEnter={() => updateClue(1)}>click the asterisk to inspect</span>
          </div>
        </div>
        <div className={`path-puzzle ${messagesRevealed ? '' : 'path-locked'}`}>
          <div className="path-top"><div><p className="eyebrow">BROKEN LINK / 03 PARTS</p><h2>{t.pathTitle}</h2></div><span className="tiny-lock">🔒 PRIVATE</span></div>
          <p className="instruction">{messagesRevealed ? <>{t.chooseFragments} <code>ROOT → PERSON → REQUEST</code></> : 'Recover the three message-board fragments before this private address can be handled.'}</p>
          <div className="path-parts" aria-label="Reorder the three path fragments">
            {game.pathOrder.map((part, position) => (
              <button
                className={`path-part ${pathSelected === position ? 'selected' : ''} ${game.pathSolved ? 'part-solved' : ''}`}
                key={position}
                disabled={!messagesRevealed || game.pathSolved}
                draggable={messagesRevealed && !game.pathSolved}
                onDragStart={(event) => { event.dataTransfer.setData('text/plain', String(position)); event.dataTransfer.effectAllowed = 'move' }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); const source = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(source)) swapPath(source, position) }}
                onClick={() => { if (pathSelected === null) setPathSelected(position); else swapPath(pathSelected, position) }}
                aria-label={messagesRevealed ? `Path fragment ${pathParts[part]}, position ${position + 1}` : 'Path fragment locked until all message-board clues are revealed'}
              >{pathParts[part]}</button>
            ))}
          </div>
          <div className="path-bottom"><span className="path-preview">/archive{game.pathSolved ? pathParts.join('') : '/▒▒▒/▒▒▒'}</span><button className="old-button" disabled={!game.pathSolved} onClick={() => transition('versions')}>{t.openFile} ↗</button></div>
        </div>
        <p className="status-line" aria-live="polite">{message || (game.openedClues.length > 0 ? `${game.openedClues.length} / 3 fragments of the board readable.` : 'The board is mostly empty. Something is under the noise.')}</p>
      </div>
    )
  }

  function renderVersions() {
    return (
      <div className="chapter-body">
        <div className="chapter-heading">
          <div><p className="eyebrow">ARCHIVE / VERSION HISTORY / 14</p><h1>{t.versionTitle}</h1></div>
          <span className="file-stamp">COMPARE MODE</span>
        </div>
        <p className="instruction">One afternoon, three versions. Select a file to compare what changed.</p>
        <div className="version-switcher" role="tablist" aria-label="Archive versions">
          {versionData.map((version, index) => (
            <button className={`version-tab ${game.version === index ? 'active' : ''}`} role="tab" aria-selected={game.version === index} key={version.label} onClick={() => updateGame((previous) => ({ ...previous, version: index }))}>
              <span className="tab-index">0{index + 1}</span>{version.label}
            </button>
          ))}
        </div>
        <div className={`version-document version-${game.version}`} role="tabpanel">
          <div className="document-top"><span>mira / notes-from-the-room.txt</span><span>{versionData[game.version].stamp}</span></div>
          <div className="document-body">
            <span className="document-mark">¶</span>
            <p>{versionData[game.version].text}</p>
            {game.version === 1 && <p className="source-warning">⚠ SOURCE NOT FOUND · generated detail has no original record</p>}
            {game.version === 2 && <p className="source-note">SIGNED BY MIRA · request retained in the public mirror</p>}
          </div>
        </div>
        <div className="evidence-check">
          <p className="eyebrow">TWO CLAIMS / ONE SOURCE FILE</p><h2>{t.evidenceTitle}</h2>
          <EvidenceClaim id="request" text="Mira asked for private entries and location guesses to be removed." value={game.evidenceAnswers.request} onChoose={(value) => updateGame((previous) => ({ ...previous, evidenceAnswers: { ...previous.evidenceAnswers, request: value } }))} />
          <EvidenceClaim id="location" text="Mira spent the summer in Lisbon, in the blue room by the river." value={game.evidenceAnswers.location} onChoose={(value) => updateGame((previous) => ({ ...previous, evidenceAnswers: { ...previous.evidenceAnswers, location: value } }))} />
          <div className="evidence-actions"><span className="clue-note">Clue: the signed request has a date; the Lisbon reconstruction has no source.</span><button className="old-button" onClick={submitEvidence} disabled={game.evidenceSolved}>{game.evidenceSolved ? 'EVIDENCE VERIFIED ✓' : t.check}</button></div>
        </div>
        <p className={`status-line ${game.evidenceSolved ? 'success-text' : ''}`} aria-live="polite">{message || (game.evidenceSolved ? 'Deletion request: verified. Lisbon: unsupported.' : 'The system once treated every deletion as a broken file.')}</p>
        {game.evidenceSolved && <button className="text-button" onClick={() => transition('decision')}>OPEN ARCHIVE CONTROL ROOM ↗</button>}
      </div>
    )
  }

  function renderDecision() {
    const endings: Ending[] = ['restore', 'preserve', 'release']
    return (
      <div className="chapter-body decision-page">
        <div className="chapter-heading"><div><p className="eyebrow">ARCHIVE CONTROL / FINAL WRITE</p><h1>{t.decisionTitle}</h1></div><span className="file-stamp">AWAITING OPERATOR</span></div>
        <p className="intro-lede decision-lede">{t.decisionText}</p>
        <div className="visitor-record">
          <div className="record-head"><span className="record-dot" />{t.visitor}<span className="record-tag">LOCAL SESSION</span></div>
          <div className="record-stats">
            <div><strong>{game.restorationAttempts}</strong><span>{t.attempts}</span></div>
            <div><strong>{game.pagesAccessed.length}</strong><span>{t.pages}</span></div>
            <div><strong>{game.hintsUsed}</strong><span>{t.hintCount}</span></div>
          </div>
          <p className="record-note">{t.localNotice}</p>
        </div>
        <div className="ending-options">
          {endings.map((ending, index) => (
            <button className={`ending-option ending-${ending}`} key={ending} onClick={() => makeDecision(ending)}>
              <span className="option-number">0{index + 1} / WRITE</span>
              <strong>{t.endings[index]}</strong>
              <span>{ending === 'restore' ? 'Includes the reconstruction, even where a source is missing.' : ending === 'preserve' ? 'Keep dated evidence. Mark unsupported details as unknown.' : 'Stop restoring private files named in the signed request.'}</span>
              <b aria-hidden="true">↗</b>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function renderEnding() {
    const ending = currentEnding
    if (!ending) return null
    const content = endingCopy[ending]
    const nextEnding: Ending = ending === 'restore' ? 'preserve' : ending === 'preserve' ? 'release' : 'restore'
    return (
      <div className={`chapter-body ending-page ${content.image}`}>
        <p className="eyebrow">WRITE COMPLETE / VISITOR RECORD UPDATED</p>
        <h1>{content.title}</h1>
        <p className="ending-subtitle">{content.subtitle}</p>
        <div className="ending-art">
          {ending === 'release' ? <div className="return-404">404<small>MEMORY NOT FOUND</small></div> : <><Portrait className="ending-portrait" /><div className="ending-art-caption">{ending === 'restore' ? 'mira_site / reconstructed snapshot' : 'mira_site / verified fragments only'}</div></>}
          {ending === 'restore' && <span className="ghost-note">LISBON · SUMMER 2007 <small>source: inferred</small></span>}
          {ending === 'preserve' && <span className="ghost-note">LOCATION: <small>UNKNOWN / NOT RESTORED</small></span>}
          {ending === 'release' && <span className="release-line">Some absences are intentional.</span>}
        </div>
        <p className="ending-text">{content.text}</p>
        <div className="ending-record"><span>YOUR DECISION</span><strong>{t.endings[['restore', 'preserve', 'release'].indexOf(game.ending ?? ending)]}</strong><span>RESTORATION ATTEMPTS: {game.restorationAttempts} · PAGES ACCESSED: {game.pagesAccessed.length}</span></div>
        <div className="ending-actions">
          <button className="old-button" onClick={resetGame}>{t.restartRun}</button>
          <button className="text-button" onClick={() => { setEndPreview(null); transition('decision') }}>{t.explore} ↗</button>
          <button className="quiet-link" onClick={() => { setEndPreview(nextEnding); updateGame((previous) => ({ ...previous, pagesAccessed: recordPage(previous.pagesAccessed, `ending-${nextEnding}-preview`) })) }}>{`PREVIEW ${endingCopy[nextEnding].title} →`}</button>
        </div>
      </div>
    )
  }

  const activeChapter = game.chapter === 'ending' ? 'ending' : game.chapter
  const chapterIndex = game.chapter === 'intro' ? 0 : game.chapter === 'photo' ? 1 : game.chapter === 'messages' ? 2 : game.chapter === 'versions' ? 3 : 4
  const canHint = game.chapter !== 'ending'
  const hintChapter = game.chapter === 'ending' ? 'decision' : game.chapter

  return (
    <main className={`desktop ${glitch ? 'glitch-transition' : ''}`}>
      <div className="ambient ambient-left" aria-hidden="true">ARCHIVE NODE 04<br />2089.04.31 / GMT-00:00<br /><span>NO REMOTE SYNC</span></div>
      <div className="ambient ambient-right" aria-hidden="true">SIGNAL: FRAGMENTED<br />CACHE: LOCAL<br />{game.chapter === 'intro' ? 'INDEX 00/00' : `INDEX 0${chapterIndex}/05`}</div>
      <div className="desktop-bar"><span>◉ ARCHIVE RECOVERY TERMINAL</span><span className="desktop-status"><i /> DISCONNECTED / LOCAL MIRROR</span></div>
      <div className="window browser-window">
        <div className="window-titlebar">
          <div className="window-controls" aria-hidden="true"><span className="close-dot" /><span /><span /></div>
          <span className="window-title">Mira&apos;s little place — Netscape Archive Reader</span>
          <span className="window-build">v.2.08.9</span>
        </div>
        <div className="browser-toolbar">
          <span className="toolbar-arrow">←</span><span className="toolbar-arrow disabled">→</span><span className="toolbar-arrow">↻</span>
          <div className="address-field"><span>⌕</span> http://mira-little-place.net/{game.chapter === 'intro' ? '▒▒▒▒▒' : game.chapter === 'photo' ? 'images/07' : game.chapter === 'messages' ? 'board/12' : game.chapter === 'versions' ? 'archive/history' : game.chapter === 'decision' ? 'sys/control' : '404'}<span className="address-lock">◇</span></div>
          <button className="language-toggle" onClick={() => setLanguage((current) => current === 'en' ? 'zh' : 'en')} aria-label="Switch language">{t.language}</button>
        </div>
        <div className="site-navigation">
          <button className="nav-logo" onClick={() => setShowIndex(!showIndex)} aria-label="Open archive index">m<span>i</span>ra*</button>
          <span className="nav-breadcrumb">PERSONAL WEBSPACE <b>/</b> {activeChapter === 'intro' ? 'UNRESOLVED' : activeChapter.toUpperCase()}</span>
          <button className="quiet-link nav-archive" onClick={() => setShowIndex(!showIndex)}>{t.archive} <span>▤</span></button>
        </div>
        {showIndex && <div className="archive-index">
          <div className="index-heading"><span>ARCHIVE DIRECTORY</span><button onClick={() => setShowIndex(false)} aria-label="Close archive index">×</button></div>
          {discoveredFiles.map((file) => <button key={file.id} disabled={!file.unlocked} onClick={() => { setShowIndex(false); transition(file.id === 'photo' ? 'photo' : file.id === 'messages' ? 'messages' : 'versions') }}>
            <span>{file.unlocked ? '▣' : '▧'}</span>{file.label}<small>{file.unlocked ? t.recovered : t.locked}</small>
          </button>)}
          <p>Each recovered file remains available from this directory.</p>
        </div>}
        <div className="browser-content" ref={contentRef} tabIndex={-1}>
          {game.chapter === 'intro' && renderIntro()}
          {game.chapter === 'photo' && renderPhoto()}
          {game.chapter === 'messages' && renderMessages()}
          {game.chapter === 'versions' && renderVersions()}
          {game.chapter === 'decision' && renderDecision()}
          {game.chapter === 'ending' && renderEnding()}
        </div>
        <div className="browser-statusbar"><span>◉ {game.chapter === 'intro' ? 'ready — waiting for a response' : game.chapter === 'ending' ? 'write complete — local archive only' : 'reading from damaged local cache'}</span><span>100% <i>▰▰▰▰▰▰▰▱</i></span></div>
      </div>
      <div className="side-window window">
        <div className="side-titlebar"><span>▤ {t.progress}</span><span>— □ ×</span></div>
        <div className="side-body">
          {t.chapterNames.map((name, index) => {
            const complete = index === 0 ? game.chapter !== 'intro' : index === 1 ? game.photoSolved : index === 2 ? game.pathSolved : index === 3 ? game.evidenceSolved : game.ending !== null
            return <div className={`chapter-file ${complete ? 'complete' : ''} ${index === chapterIndex ? 'current' : ''}`} key={name}><span className="file-icon">{complete ? '▣' : '▧'}</span><span>{`0${index} / ${name}`}</span><span className="file-state">{complete ? '✓' : index === chapterIndex ? '…' : '—'}</span></div>
          })}
          <div className="side-divider" />
          <div className="side-controls"><button onClick={() => setSound(!sound)}>{sound ? '♪' : '♫'} {sound ? t.toggleSoundOn : t.toggleSound}</button><button onClick={resetGame}>↺ {t.restart}</button></div>
          <p className="side-footer">{t.footer}</p>
        </div>
      </div>
      {canHint && <div className="hint-dock">
        {hintOpen && canHint && <div className="hint-paper"><button className="hint-close" onClick={() => setHintOpen(false)} aria-label="Close hint">×</button><span>ARCHIVE NOTE / {hintLevel}</span><p>{hints[hintChapter][Math.max(0, hintLevel - 1)]}</p></div>}
        <button className={`hint-button ${hintOpen ? 'hint-active' : ''}`} onClick={revealHint}><span>?</span>{t.hints}</button>
      </div>}
      <div className="ambient-bottom">JUST BECAUSE A MEMORY CAN BE RECOVERED, DOES IT MEAN IT SHOULD?</div>
      <div className="grain" aria-hidden="true" />
    </main>
  )
}

function EvidenceClaim({ id, text, value, onChoose }: { id: string; text: string; value?: string; onChoose: (value: string) => void }) {
  const t = copy.en
  return (
    <div className="claim-row">
      <p>{text}</p>
      <div className="claim-actions">
        {(['verified', 'inferred'] as const).map((choice) => (
          <button
            key={choice}
            className={`claim-button ${value === choice ? 'chosen' : ''}`}
            aria-pressed={value === choice}
            onClick={() => onChoose(choice)}
            onKeyDown={(event) => answerClaimKey(event, id, choice, onChoose)}
          >{choice === 'verified' ? t.verified : t.inferred}</button>
        ))}
      </div>
    </div>
  )
}

function answerClaimKey(event: KeyboardEvent<HTMLButtonElement>, _id: string, value: string, onChoose: (value: string) => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onChoose(value)
  }
}
