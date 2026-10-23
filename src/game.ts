export type Chapter = 'intro' | 'photo' | 'messages' | 'versions' | 'decision' | 'ending'
export type Ending = 'restore' | 'preserve' | 'release'
export type Language = 'en' | 'zh'

export interface GameState {
  chapter: Chapter
  photoTiles: number[]
  photoSolved: boolean
  pathOrder: number[]
  pathSolved: boolean
  openedClues: number[]
  version: number
  evidenceAnswers: Record<string, string>
  evidenceSolved: boolean
  ending: Ending | null
  pagesAccessed: string[]
  restorationAttempts: number
  hintsUsed: number
}

export const initialGameState = (): GameState => ({
  chapter: 'intro',
  photoTiles: [2, 0, 5, 1, 4, 3],
  photoSolved: false,
  pathOrder: [2, 0, 1],
  pathSolved: false,
  openedClues: [],
  version: 0,
  evidenceAnswers: {},
  evidenceSolved: false,
  ending: null,
  pagesAccessed: [],
  restorationAttempts: 0,
  hintsUsed: 0,
})

export const swapItems = <T,>(items: T[], first: number, second: number): T[] => {
  if (first === second || first < 0 || second < 0 || first >= items.length || second >= items.length) return items
  const next = [...items]
  ;[next[first], next[second]] = [next[second], next[first]]
  return next
}

export const isSolvedOrder = (order: number[]): boolean => order.every((value, index) => value === index)

export const isEvidenceCorrect = (answers: Record<string, string>): boolean =>
  answers.request === 'verified' && answers.location === 'inferred'

/** A path may only be reconstructed after every message-board clue is readable. */
export const hasAllMessageClues = (clues: number[]): boolean =>
  [0, 1, 2].every((clue) => clues.includes(clue))

export const recordPage = (pages: string[], page: string): string[] =>
  pages.includes(page) ? pages : [...pages, page]

export const finalizeChoice = (state: GameState, ending: Ending): GameState => ({
  ...state,
  ending,
  chapter: 'ending',
  pagesAccessed: recordPage(state.pagesAccessed, 'final-decision'),
})

export const loadGame = (): GameState => {
  try {
    const saved = localStorage.getItem('memory-not-found-save')
    if (!saved) return initialGameState()
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return initialGameState()
    const candidate = parsed as Partial<GameState>
    const chapters: Chapter[] = ['intro', 'photo', 'messages', 'versions', 'decision', 'ending']
    if (!chapters.includes(candidate.chapter as Chapter)) return initialGameState()
    return { ...initialGameState(), ...candidate }
  } catch (error) {
    console.warn('Saved archive could not be read; starting a new session.', error)
    return initialGameState()
  }
}
