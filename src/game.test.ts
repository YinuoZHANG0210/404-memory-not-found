import assert from 'node:assert/strict'
import test from 'node:test'
import { finalizeChoice, hasAllMessageClues, initialGameState, isEvidenceCorrect, isSolvedOrder, recordPage, swapItems } from './game'

test('the photograph puzzle is solved only by putting every fragment in its slot', () => {
  assert.equal(isSolvedOrder([0, 1, 2, 3, 4, 5]), true)
  assert.equal(isSolvedOrder([0, 2, 1, 3, 4, 5]), false)
  assert.deepEqual(swapItems([2, 0, 5, 1, 4, 3], 0, 1), [0, 2, 5, 1, 4, 3])
})

test('invalid swaps preserve the original order', () => {
  const order = [0, 1, 2]
  assert.equal(swapItems(order, -1, 1), order)
})

test('evidence requires both the verified request and inferred location to be classified correctly', () => {
  assert.equal(isEvidenceCorrect({ request: 'verified', location: 'inferred' }), true)
  assert.equal(isEvidenceCorrect({ request: 'inferred', location: 'verified' }), false)
  assert.equal(isEvidenceCorrect({ request: 'verified' }), false)
})

test('the private path stays locked until every message-board clue has been revealed', () => {
  assert.equal(hasAllMessageClues([]), false)
  assert.equal(hasAllMessageClues([0, 1]), false)
  assert.equal(hasAllMessageClues([2, 0, 1]), true)
})

test('archive page records are unique and a new game starts cleanly', () => {
  assert.deepEqual(recordPage(['photo'], 'photo'), ['photo'])
  assert.deepEqual(recordPage(['photo'], 'messages'), ['photo', 'messages'])
  assert.equal(initialGameState().ending, null)
  assert.equal(initialGameState().hintsUsed, 0)
  assert.equal(isSolvedOrder(initialGameState().pathOrder), false)
})

test('every final decision reaches an ending and records the choice page', () => {
  for (const ending of ['restore', 'preserve', 'release'] as const) {
    const completed = finalizeChoice(initialGameState(), ending)
    assert.equal(completed.chapter, 'ending')
    assert.equal(completed.ending, ending)
    assert.deepEqual(completed.pagesAccessed, ['final-decision'])
  }
  assert.equal(initialGameState().chapter, 'intro')
})
