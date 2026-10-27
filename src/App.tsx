import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
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

type Locale = 'en' | 'zh'

const STORAGE_KEY = 'memory-not-found-save-v2'
const LOCALE_KEY = 'memory-not-found-locale'
const portraitAsset = `${import.meta.env.BASE_URL}mira-portrait.svg`

const copy = {
  en: {
    progress: ['IMAGE', 'MESSAGES', 'EVIDENCE', 'CHOICE'],
    restart: 'RESTART', language: '中文', languageLabel: '切换为中文',
    session: 'RECOVERY SESSION / 2089', introTitle: <>Someone deleted<br />their memory.</>,
    intro: 'Mira asked for her private archive to disappear. A broken system kept traces anyway. Recover only what the files can truly prove, then decide whether her request should be honoured.',
    howTo: 'HOW TO PLAY', howToText: 'Complete four small recovery tasks. Every screen tells you exactly what to do.', begin: 'BEGIN RECOVERY',
    lastFound: 'MIRA_17 / LAST FOUND', preview: 'image_preview.jpg', damaged: 'FILE DAMAGED',
    tasks: [
      { title: 'Rebuild the photograph', instruction: 'Click one fragment, then another, to swap their positions.', story: 'FIRST TRACE — The photo proves Mira existed in this archive. It does not yet say whether she wanted to remain.' },
      { title: 'Open the hidden messages', instruction: 'Recover every line to learn why this archive was damaged.', story: 'MIRA\'S TRACE — Three messages survive above the console. They explain why the deletion was not a system accident.' },
      { title: 'Separate fact from fiction', instruction: 'Use the two source files, then classify both claims.', story: 'THE CONFLICT — A signed request carries evidence. An automatic reconstruction can sound plausible without being true.' },
      { title: 'Choose what the archive becomes', instruction: 'There is no correct ending. Pick the responsibility you want the archive to take.', story: 'WHAT YOU NOW KNOW — Mira signed a deletion request; the Lisbon story is only a guess. Choose what the archive does with that gap.' },
    ],
    messages: [
      ['I was not lost.', 'I chose to disappear.'],
      ['This was not an error.', 'The deletion request was signed.'],
      ['A private file remains.', 'It asks the archive to stop guessing.'],
    ],
    slingshot: {
      label: 'SIGNAL SLINGSHOT / LOAD THE MISSING WORD',
      intro: 'This is a three-step mini-game: load a word, aim at its matching blank, then hold and release to fire.',
      choose: '1. LOAD A WORD', aim: '2. FREE AIM', loaded: 'LOADED', controls: 'MOVE POINTER TO AIM  ·  ↑ ↓ FINE TUNE  ·  HOLD SPACE TO CHARGE  ·  RELEASE TO FIRE', power: 'POWER', fire: 'HOLD TO FIRE', chargeTooLow: 'Not enough power — hold SPACE a little longer.',
      tutorialLabel: 'HOW THIS CONSOLE WORKS', tutorial: ['Click a floating word to load it.', 'Move the pointer until the matching blank is highlighted.', 'Hold Space or FIRE, then release to launch.'], guideLoad: 'START HERE: click any floating word above to load the sling.', guideAim: 'NEXT: aim the dotted path at the blank with the same missing word.', guideFire: 'READY: hold SPACE or FIRE until the power bar fills, then release.',
      words: ['DISAPPEAR', 'SIGNED', 'GUESSING'],
      prompts: ['I chose to', 'The deletion request was', 'Stop'],
      slot: '_____ ', noWord: 'Load a word cartridge first.', miss: 'SIGNAL MISSED — try another blank.', hit: 'LOCK ACQUIRED.',
      solved: 'TRANSMISSION COMPLETE / 3 OF 3 SIGNALS RESTORED',
    },
    photoDefault: 'Six fragments. One missing portrait.', photoFirst: 'Choose one more fragment to swap.', photoClear: 'Selection cleared.', photoUnsolved: 'Fragments swapped. Keep looking for Mira’s face and the window edge.', photoSolved: 'Image recovered. Open the messages.',
    openMessages: 'OPEN RECOVERED MESSAGES', open: 'CLICK TO OPEN', recovered: 'RECOVERED', messagesDefault: 'messages opened', messagesOne: 'Message recovered. Two more remain.', messagesDone: 'All messages recovered. Check the evidence.',
    sourceOne: '18.06.2007 — “Please delete my profile and private records.”', sourceTwo: '“Mira probably spent a summer in Lisbon.” No original source attached.', primary: 'PRIMARY SOURCE', guess: 'SYSTEM GUESS',
    requestClaim: 'Mira asked for her private records to be deleted.', locationClaim: 'Mira spent a summer in Lisbon.', prove: 'CAN PROVE', cannotProve: 'CANNOT PROVE', check: 'CHECK MY ANSWERS',
    evidenceDefault: 'A convincing story is not always evidence.', evidenceChoice: 'Choice recorded. Compare it with the source files.', evidenceWrong: 'Not quite. One claim is evidence; the other is an inference.', evidenceRight: 'Evidence verified. You can now choose the archive outcome.', finalChoice: 'MAKE THE FINAL CHOICE',
    endings: {
      restore: ['RESTORE EVERYTHING', 'THE PERFECT ARCHIVE', 'The missing site returns complete and convincing. It also keeps a beautiful summer in Lisbon that no record can prove.'],
      preserve: ['PRESERVE VERIFIED FRAGMENTS', 'THE INCOMPLETE TRUTH', 'The signed request and public fragments remain. The gaps stay visible, because the archive refuses to make them up.'],
      release: ['RESPECT THE DELETION', '404: MEMORY NOT FOUND', 'The file is released. The archive records only that someone chose not to turn absence into a story.'],
    },
    outcome: 'ARCHIVE OUTCOME / SAVED LOCALLY', playAgain: 'PLAY AGAIN', otherOutcomes: 'SEE OTHER OUTCOMES', status: 'ARCHIVE STATUS', footer: 'FICTIONAL PERSONAL ARCHIVE · NO DATA LEAVES THIS DEVICE', newSession: 'New recovery session started.',
  },
  zh: {
    progress: ['照片', '留言', '证据', '选择'],
    restart: '重新开始', language: 'EN', languageLabel: 'Switch to English',
    session: '恢复会话 / 2089', introTitle: <>有人删除了<br />自己的记忆。</>,
    intro: 'Mira 曾要求让她的私人档案消失，但故障系统仍留下痕迹。只恢复文件真正能证明的内容，再决定是否应尊重她的请求。',
    howTo: '怎么玩', howToText: '完成四个小型恢复任务。每一页都会告诉你下一步该做什么。', begin: '开始恢复',
    lastFound: 'MIRA_17 / 最后发现', preview: '照片预览.jpg', damaged: '文件已损坏',
    tasks: [
      { title: '重建照片', instruction: '先点击一块碎片，再点击另一块，即可交换位置。', story: '第一条痕迹 — 照片证明 Mira 曾在这份档案中，但还不能说明她希望被保留。' },
      { title: '打开隐藏留言', instruction: '恢复全部文字，了解档案为什么会破损。', story: 'MIRA 的痕迹 — 控制台上方留下三条留言。它们会说明删除并不是系统意外。' },
      { title: '区分事实与推测', instruction: '阅读两份来源文件，再为两条说法分类。', story: '冲突点 — 经签署的请求是证据；自动重建即使听起来合理，也未必是真的。' },
      { title: '选择档案的结局', instruction: '没有正确结局。请选择你希望档案承担的责任。', story: '你已经知道 — Mira 签署了删除请求；里斯本的故事只是一种猜测。现在决定档案如何对待这段空白。' },
    ],
    messages: [
      ['我不是迷失了。', '是我选择了消失。'],
      ['这不是系统错误。', '删除请求经过了签署。'],
      ['还留有一份私人文件。', '它请求档案不要再猜测。'],
    ],
    slingshot: {
      label: '信号弹弓 / 装载缺失文字',
      intro: '这是一个三步小游戏：装载文字，瞄准对应空位，再按住并松开发射。',
      choose: '1. 装载文字', aim: '2. 自由瞄准', loaded: '已装载', controls: '移动鼠标瞄准 · ↑ ↓ 微调 · 长按空格蓄力 · 松开发射', power: '力量', fire: '按住发射', chargeTooLow: '力量不足 — 再多按住空格一会儿。',
      tutorialLabel: '控制台怎么玩', tutorial: ['点击上方漂浮的文字来装弹。', '移动鼠标，让虚线路径对准匹配的空位。', '长按空格或“按住发射”，再松开。'], guideLoad: '从这里开始：点击上方任意漂浮文字，为弹弓装弹。', guideAim: '下一步：瞄准带有相同缺失文字的空位。', guideFire: '准备好了：按住空格或“按住发射”，等力量条填满后松开。',
      words: ['消失', '签署', '猜测'],
      prompts: ['我选择了', '删除请求已被', '请停止'],
      slot: '_____', noWord: '请先装载一个文字弹药。', miss: '信号偏离 — 换一个空位试试。', hit: '目标锁定。',
      solved: '传输完成 / 3 OF 3 信号已恢复',
    },
    photoDefault: '六块碎片，一张遗失的肖像。', photoFirst: '再选择一块碎片来交换。', photoClear: '已取消选择。', photoUnsolved: '碎片已交换。继续寻找 Mira 的脸和窗户边缘。', photoSolved: '照片已恢复。打开留言吧。',
    openMessages: '打开已恢复的留言', open: '点击打开', recovered: '已恢复', messagesDefault: '条留言已打开', messagesOne: '留言已恢复，还剩两条。', messagesDone: '全部留言已恢复。检查证据。',
    sourceOne: '18.06.2007 — “请删除我的个人主页和私人记录。”', sourceTwo: '“Mira 可能在里斯本度过一个夏天。” 没有附上原始来源。', primary: '一手来源', guess: '系统推测',
    requestClaim: 'Mira 要求删除她的私人记录。', locationClaim: 'Mira 在里斯本度过了一个夏天。', prove: '可以证明', cannotProve: '无法证明', check: '核对我的答案',
    evidenceDefault: '一个令人信服的故事不一定就是证据。', evidenceChoice: '已记录选择。请与来源文件比对。', evidenceWrong: '还不对。一条是证据，另一条只是推测。', evidenceRight: '证据已核验。现在可以选择档案结局。', finalChoice: '做出最终选择',
    endings: {
      restore: ['恢复全部内容', '完美档案', '遗失的网站回来得完整而可信。它也保留了那段没有任何记录可以证明的里斯本夏日。'],
      preserve: ['保留已验证片段', '不完整的真相', '签署请求与公开碎片被保留。空白仍然可见，因为档案拒绝编造。'],
      release: ['尊重删除决定', '404：未找到记忆', '文件被释放。档案只留下记录：有人选择不把缺席变成故事。'],
    },
    outcome: '档案结果 / 已本地保存', playAgain: '再玩一次', otherOutcomes: '查看其他结局', status: '档案状态', footer: '虚构个人档案 · 不会有数据离开此设备', newSession: '新的恢复会话已开始。',
  },
} as const

const senders = ['MIRA_17', 'SYSTEM_NOTE', 'LINK_CHECK']
const tones: Record<Ending, string> = { restore: 'pink', preserve: 'mint', release: 'paper' }

function loadSession(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialGameState()
    const parsed = JSON.parse(saved) as Partial<GameState>
    const validChapters: Chapter[] = ['intro', 'photo', 'messages', 'versions', 'decision', 'ending']
    return validChapters.includes(parsed.chapter as Chapter) ? { ...initialGameState(), ...parsed } : initialGameState()
  } catch { return initialGameState() }
}

function loadLocale(): Locale {
  return localStorage.getItem(LOCALE_KEY) === 'zh' ? 'zh' : 'en'
}

function App() {
  const [game, setGame] = useState<GameState>(loadSession)
  const [locale, setLocale] = useState<Locale>(loadLocale)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [selectedWord, setSelectedWord] = useState<number | null>(null)
  const [lastShot, setLastShot] = useState<number | null>(null)
  const [aimAngle, setAimAngle] = useState(-20)
  const [charge, setCharge] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [notice, setNotice] = useState('')
  const launcherRef = useRef<HTMLDivElement | null>(null)
  const targetRefs = useRef<Array<HTMLButtonElement | null>>([])
  const t = copy[locale]
  const activeStep = ['photo', 'messages', 'versions', 'decision'].indexOf(game.chapter)
  const nextWord = [0, 1, 2].find((index) => !game.openedClues.includes(index)) ?? 0
  const slingshotGuide = selectedWord === null ? t.slingshot.guideLoad : isCharging ? t.slingshot.guideFire : t.slingshot.guideAim

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)) }, [game])
  useEffect(() => { localStorage.setItem(LOCALE_KEY, locale); document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : 'en' }, [locale])

  const updateGame = (next: GameState) => setGame(next)
  const goTo = (chapter: Chapter) => updateGame({ ...game, chapter, pagesAccessed: recordPage(game.pagesAccessed, chapter) })
  const restart = () => { localStorage.removeItem(STORAGE_KEY); setSelectedTile(null); setSelectedWord(null); setLastShot(null); setAimAngle(-20); setCharge(0); setIsCharging(false); setNotice(t.newSession); setGame(initialGameState()) }
  const toggleLanguage = () => setLocale((current) => current === 'en' ? 'zh' : 'en')

  const selectTile = (position: number) => {
    if (game.photoSolved) return
    if (selectedTile === null) { setSelectedTile(position); setNotice(t.photoFirst); return }
    if (selectedTile === position) { setSelectedTile(null); setNotice(t.photoClear); return }
    const photoTiles = swapItems(game.photoTiles, selectedTile, position)
    const photoSolved = isSolvedOrder(photoTiles)
    updateGame({ ...game, photoTiles, photoSolved, restorationAttempts: game.restorationAttempts + 1 })
    setSelectedTile(null); setNotice(photoSolved ? t.photoSolved : t.photoUnsolved)
  }

  const launchWord = (targetIndex: number) => {
    if (selectedWord === null) { setNotice(t.slingshot.noWord); return }
    setLastShot(targetIndex)
    if (selectedWord !== targetIndex) { setSelectedWord(null); setNotice(t.slingshot.miss); return }
    if (game.openedClues.includes(targetIndex)) { setSelectedWord(null); return }
    const openedClues = [...game.openedClues, targetIndex]
    updateGame({ ...game, openedClues })
    setSelectedWord(null)
    setNotice(hasAllMessageClues(openedClues) ? t.slingshot.solved : t.slingshot.hit)
  }

  const aimFromPointer = (clientX: number, clientY: number) => {
    const launcher = launcherRef.current
    if (!launcher) return
    const rect = launcher.getBoundingClientRect()
    const originX = rect.left + rect.width * .72
    const originY = rect.top + rect.height * .36
    const rawAngle = Math.atan2(clientY - originY, clientX - originX) * 180 / Math.PI
    setAimAngle(Math.max(-68, Math.min(24, rawAngle)))
  }

  const targetFromAim = (): number | null => {
    const launcher = launcherRef.current
    if (!launcher) return null
    const launcherRect = launcher.getBoundingClientRect()
    const originX = launcherRect.left + launcherRect.width * .72
    const originY = launcherRect.top + launcherRect.height * .36
    let bestTarget: number | null = null
    let smallestDifference = 17
    targetRefs.current.forEach((target, index) => {
      if (!target || game.openedClues.includes(index)) return
      const targetRect = target.getBoundingClientRect()
      const targetAngle = Math.atan2(targetRect.top + targetRect.height / 2 - originY, targetRect.left + targetRect.width / 2 - originX) * 180 / Math.PI
      const difference = Math.abs(targetAngle - aimAngle)
      if (difference < smallestDifference) { smallestDifference = difference; bestTarget = index }
    })
    return bestTarget
  }

  const startCharge = () => {
    if (selectedWord === null) { setNotice(t.slingshot.noWord); return }
    if (!isCharging) { setCharge(8); setIsCharging(true) }
  }

  const fireWord = () => {
    if (!isCharging) return
    setIsCharging(false)
    if (charge < 35) { setCharge(0); setNotice(t.slingshot.chargeTooLow); return }
    const targetIndex = targetFromAim()
    if (targetIndex === null) { setLastShot(-1); setSelectedWord(null); setNotice(t.slingshot.miss); setCharge(0); return }
    launchWord(targetIndex)
    setCharge(0)
  }

  useEffect(() => {
    if (!isCharging) return
    const timer = window.setInterval(() => setCharge((value) => Math.min(100, value + 7)), 55)
    return () => window.clearInterval(timer)
  }, [isCharging])

  useEffect(() => {
    if (game.chapter !== 'messages') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault()
        setAimAngle((angle) => Math.max(-68, Math.min(24, angle + (event.code === 'ArrowUp' ? -6 : 6))))
      }
      if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) startCharge() }
    }
    const onKeyUp = (event: KeyboardEvent) => { if (event.code === 'Space') { event.preventDefault(); fireWord() } }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [game.chapter, selectedWord, aimAngle, charge, isCharging, t])

  const answer = (claim: 'request' | 'location', value: 'verified' | 'inferred') => {
    updateGame({ ...game, evidenceAnswers: { ...game.evidenceAnswers, [claim]: value } }); setNotice(t.evidenceChoice)
  }

  const checkEvidence = () => {
    const evidenceSolved = isEvidenceCorrect(game.evidenceAnswers)
    updateGame({ ...game, evidenceSolved }); setNotice(evidenceSolved ? t.evidenceRight : t.evidenceWrong)
  }

  return <main className="game-shell">
    <div className="desktop-stars" aria-hidden="true"><i /><i /><i /><i /></div>
    <header className="topbar">
      <button className="wordmark" type="button" onClick={restart} aria-label="Restart 404 Memory Not Found"><span>404</span> MEMORY NOT FOUND</button>
      <div className="progress" aria-label={locale === 'zh' ? '恢复进度' : 'Recovery progress'}>
        {t.progress.map((label, index) => <div className={`progress-step ${index <= activeStep ? 'is-active' : ''}`} key={label}><span>0{index + 1}</span><small>{label}</small></div>)}
      </div>
      <div className="utility-actions"><button className="language-button" type="button" onClick={toggleLanguage} aria-label={t.languageLabel}>{t.language}</button><button className="text-button" type="button" onClick={restart}>{t.restart}</button></div>
    </header>

    {game.chapter === 'intro' && <section className="screen intro-screen">
      <div className="intro-copy">
        <p className="eyebrow">{t.session}</p><h1>{t.introTitle}</h1><p className="lede">{t.intro}</p>
        <div className="how-to"><span>{t.howTo}</span><p>{t.howToText}</p></div>
        <button className="action-button" type="button" onClick={() => goTo('photo')}>{t.begin}<span>→</span></button>
      </div>
      <div className="lost-file" aria-hidden="true"><div className="file-tab"><i />{t.lastFound}<b>×</b></div><div className="portrait-wrap"><Portrait /></div><p>{t.preview}</p><strong>{t.damaged}</strong><em>CRC: 0x0E4</em></div>
    </section>}

    {game.chapter === 'photo' && <section className="screen task-screen">
      <StepHeading number="01" title={t.tasks[0].title} instruction={t.tasks[0].instruction} story={t.tasks[0].story} taskLabel={locale === 'zh' ? '任务' : 'TASK'} storyLabel={locale === 'zh' ? '档案提示' : 'ARCHIVE NOTE'} />
      <div className="puzzle-window"><div className="window-title"><i />MIRA_17 / PHOTO_REPAIR.EXE <b>×</b></div><div className={`puzzle-board ${game.photoSolved ? 'is-solved' : ''}`} aria-label={locale === 'zh' ? '照片碎片拼图' : 'Photo fragment puzzle'}>
        {game.photoTiles.map((tile, position) => <button className={`photo-piece ${selectedTile === position ? 'is-selected' : ''}`} type="button" onClick={() => selectTile(position)} key={`${tile}-${position}`} aria-label={`${locale === 'zh' ? '照片碎片' : 'Photo fragment'} ${position + 1}${selectedTile === position ? locale === 'zh' ? '，已选择' : ', selected' : ''}`} style={{ backgroundImage: `url(${portraitAsset})`, backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 100}%` }} />)}
      </div></div>
      <StatusLine label={t.status} message={notice || t.photoDefault} />
      {game.photoSolved && <button className="action-button" type="button" onClick={() => goTo('messages')}>{t.openMessages}<span>→</span></button>}
    </section>}

    {game.chapter === 'messages' && <section className="screen task-screen messages-screen">
      <StepHeading number="02" title={t.tasks[1].title} instruction={t.tasks[1].instruction} story={t.tasks[1].story} taskLabel={locale === 'zh' ? '任务' : 'TASK'} storyLabel={locale === 'zh' ? '档案提示' : 'ARCHIVE NOTE'} />
      <section className="slingshot-console" aria-label={t.slingshot.label}>
        <div className="console-title"><span>▣</span>{t.slingshot.label}<b>×</b></div>
        <p className="slingshot-intro">{t.slingshot.intro}</p>
        <ol className="slingshot-tutorial" aria-label={t.slingshot.tutorialLabel}>{t.slingshot.tutorial.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{step}</span></li>)}</ol>
        <p className="slingshot-guide" id="slingshot-guide" role="status"><b>▶</b>{slingshotGuide}</p>
        <div className="slingshot-playfield" aria-describedby="slingshot-guide" onPointerMove={(event) => aimFromPointer(event.clientX, event.clientY)}>
          <div className="sky-words"><p className="mini-label">{t.slingshot.choose}</p>{t.slingshot.words.map((word, index) => <button className={`word-cartridge sky-word word-${index} ${selectedWord === index ? 'is-selected' : ''} ${selectedWord === null && index === nextWord ? 'is-suggested' : ''} ${game.openedClues.includes(index) ? 'is-used' : ''}`} type="button" draggable={!game.openedClues.includes(index)} onDragStart={() => setSelectedWord(index)} onClick={() => !game.openedClues.includes(index) && setSelectedWord(index)} key={word} disabled={game.openedClues.includes(index)}>{word}</button>)}</div>
          <div className="slingshot-floor">
            <div className="launch-control"><div className="launcher" ref={launcherRef} aria-hidden="true" style={{ '--aim-angle': `${aimAngle}deg` } as CSSProperties}><i className="launcher-arm left" /><i className="launcher-arm right" /><span className={selectedWord === null ? '' : 'is-loaded'}>{selectedWord === null ? '●' : t.slingshot.words[selectedWord]}</span><em>⌁⌁⌁</em></div><div className="power-meter"><span>{t.slingshot.power}</span><i><b style={{ width: `${charge}%` }} /></i></div><button className={`fire-button ${isCharging ? 'is-charging' : ''}`} type="button" onPointerDown={startCharge} onPointerUp={fireWord} onPointerCancel={fireWord} onPointerLeave={fireWord}>{t.slingshot.fire}</button></div>
            <div className="trajectory" aria-hidden="true" style={{ '--aim-angle': `${aimAngle}deg` } as CSSProperties}><i /><i /><i /><i /></div>
            <div className="sentence-targets"><p className="mini-label">{t.slingshot.aim}</p>{t.slingshot.prompts.map((prompt, index) => {
              const solved = game.openedClues.includes(index)
              return <button className={`sentence-target ${solved ? 'is-filled' : ''} ${lastShot === index ? 'was-shot' : ''}`} type="button" key={senders[index]} ref={(node) => { targetRefs.current[index] = node }} onFocus={() => { const target = targetRefs.current[index]; const launcher = launcherRef.current; if (target && launcher) { const a = target.getBoundingClientRect(); const b = launcher.getBoundingClientRect(); setAimAngle(Math.atan2(a.top + a.height / 2 - (b.top + b.height * .36), a.left + a.width / 2 - (b.left + b.width * .72)) * 180 / Math.PI) } }}>
                <span>{senders[index]}</span><strong>{prompt} <mark>{solved ? t.slingshot.words[index] : t.slingshot.slot}</mark></strong><em>{solved ? t.recovered : 'TARGET'}</em>
              </button>
            })}</div>
          </div>
        </div>
        <p className="keyboard-controls">{t.slingshot.controls}</p>
      </section>
      <StatusLine label={t.status} message={notice || `${game.openedClues.length}/3 ${t.messagesDefault}`} />
      {hasAllMessageClues(game.openedClues) && <button className="action-button" type="button" onClick={() => goTo('versions')}>{locale === 'zh' ? '检查证据' : 'CHECK THE EVIDENCE'}<span>→</span></button>}
    </section>}

    {game.chapter === 'versions' && <section className="screen task-screen evidence-screen">
      <StepHeading number="03" title={t.tasks[2].title} instruction={t.tasks[2].instruction} story={t.tasks[2].story} taskLabel={locale === 'zh' ? '任务' : 'TASK'} storyLabel={locale === 'zh' ? '档案提示' : 'ARCHIVE NOTE'} />
      <div className="source-files"><article className="source-file source-file--primary"><FileGlyph kind="primary" /><span>FILE_01 / SIGNED_REQUEST.PDF</span><p>{t.sourceOne}</p><b>{t.primary}</b></article><article className="source-file source-file--guess"><FileGlyph kind="guess" /><span>FILE_02 / AUTO_RECONSTRUCTION.LOG</span><p>{t.sourceTwo}</p><b>{t.guess}</b></article></div>
      <div className="evidence-key" aria-hidden="true"><span>ORIGINAL</span><i><b /></i><span>INFERENCE</span></div>
      <div className="claims"><Claim text={t.requestClaim} value={game.evidenceAnswers.request} onChoose={(value) => answer('request', value)} prove={t.prove} cannotProve={t.cannotProve} /><Claim text={t.locationClaim} value={game.evidenceAnswers.location} onChoose={(value) => answer('location', value)} prove={t.prove} cannotProve={t.cannotProve} /></div>
      <button className="check-button" type="button" onClick={checkEvidence}>{t.check}</button><StatusLine label={t.status} message={notice || t.evidenceDefault} />
      {game.evidenceSolved && <button className="action-button" type="button" onClick={() => goTo('decision')}>{t.finalChoice}<span>→</span></button>}
    </section>}

    {game.chapter === 'decision' && <section className="screen task-screen decision-screen"><StepHeading number="04" title={t.tasks[3].title} instruction={t.tasks[3].instruction} story={t.tasks[3].story} taskLabel={locale === 'zh' ? '任务' : 'TASK'} storyLabel={locale === 'zh' ? '档案提示' : 'ARCHIVE NOTE'} /><div className="choice-grid">{(Object.keys(tones) as Ending[]).map((ending, index) => <Choice key={ending} ending={ending} number={`0${index + 1}`} entry={t.endings[ending]} onChoose={(choice) => updateGame(finalizeChoice(game, choice))} choose={locale === 'zh' ? '选择' : 'CHOOSE'} />)}</div></section>}

    {game.chapter === 'ending' && game.ending && <section className={`screen ending-screen ending-${tones[game.ending]}`}><p className="eyebrow">{t.outcome}</p><div className="ending-mark">{game.ending === 'release' ? '404' : '✓'}</div><h1>{t.endings[game.ending][1]}</h1><p className="lede">{t.endings[game.ending][2]}</p><div className="ending-actions"><button className="action-button" type="button" onClick={restart}>{t.playAgain}<span>↺</span></button><button className="text-button" type="button" onClick={() => goTo('decision')}>{t.otherOutcomes}</button></div></section>}
    <footer>{t.footer}</footer>
  </main>
}

function StepHeading({ number, title, instruction, story, taskLabel, storyLabel }: { number: string; title: string; instruction: string; story: string; taskLabel: string; storyLabel: string }) { return <div className="step-heading"><p className="eyebrow">{taskLabel} {number} / 04</p><h1>{title}</h1><p className="lede">{instruction}</p><p className="story-cue"><b>{storyLabel}</b>{story}</p></div> }
function StatusLine({ label, message }: { label: string; message: string }) { return <p className="status-line" role="status"><span>{label}</span>{message}</p> }
function Claim({ text, value, onChoose, prove, cannotProve }: { text: string; value?: string; onChoose: (value: 'verified' | 'inferred') => void; prove: string; cannotProve: string }) { return <article className="claim"><p>{text}</p><div><button className={value === 'verified' ? 'selected' : ''} type="button" onClick={() => onChoose('verified')}>{prove}</button><button className={value === 'inferred' ? 'selected' : ''} type="button" onClick={() => onChoose('inferred')}>{cannotProve}</button></div></article> }
function FileGlyph({ kind }: { kind: 'primary' | 'guess' }) { return <div className={`file-glyph file-glyph--${kind}`} aria-hidden="true"><i /><i /><i /><b>{kind === 'primary' ? '01' : '??'}</b></div> }
function ChoiceGlyph({ ending }: { ending: Ending }) { return <div className={`choice-glyph choice-glyph--${ending}`} aria-hidden="true"><i /><i /><i /><i /></div> }
function Choice({ ending, number, entry, onChoose, choose }: { ending: Ending; number: string; entry: readonly [string, string, string]; onChoose: (ending: Ending) => void; choose: string }) { return <button className={`choice-card choice-${tones[ending]}`} type="button" onClick={() => onChoose(ending)}><span>{number}</span><ChoiceGlyph ending={ending} /><strong>{entry[0]}</strong><p>{entry[2]}</p><em>{choose} →</em></button> }
function Portrait() { return <svg viewBox="0 0 300 360" role="img" aria-label="A fragmented portrait preview"><rect width="300" height="360" fill="#283344" /><circle cx="150" cy="146" r="72" fill="#74899e" /><path d="M73 319c10-93 46-132 77-132s67 39 77 132" fill="#9adacb" /><path d="M82 148c0-66 30-102 70-102s69 34 69 102c-18-22-39-32-70-32s-51 10-69 32Z" fill="#10151f" /><circle cx="124" cy="148" r="5" fill="#10151f" /><circle cx="176" cy="148" r="5" fill="#10151f" /><path d="M130 180c12 9 28 9 40 0" fill="none" stroke="#10151f" strokeWidth="5" /><path d="M0 62h300M0 250h300" stroke="#d88da6" strokeDasharray="8 11" strokeWidth="3" opacity=".8" /></svg> }

export default App
