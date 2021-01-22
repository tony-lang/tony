import { Answer, Answers } from '../types/type_inference/answers'
import { AbstractState } from '../types/state'
import { assert } from '../types/errors/internal'
import { collectErrors } from '../errors'

/**
 * Filters the given answers.
 *  * if there are answers without errors, return those answers;
 *  * if there are only answers with errors, return the answer with the least
 *    number of errors.
 */
const filterAnswers = <T extends AbstractState, U>(answers: Answers<T, U>) => {
  assert(answers.length > 0, 'The universe requires at least one answer.')

  // Remove answers with errors if there are some answers without errors.
  const answersWithNoOfErrors: [
    answer: Answer<T, U>,
    numberOfErrors: number,
  ][] = answers.map((answer) => [
    answer,
    collectErrors(answer.state.scopes[0]).length,
  ])
  const answersWithoutErrors = answersWithNoOfErrors.filter(([, n]) => n === 0)
  if (answersWithoutErrors.length > 0)
    return answersWithoutErrors.map(([answer]) => answer)

  // Proceed with the answer with the fewest errors if all answers have errors.
  const answersSortedByNoOfErrors = answersWithNoOfErrors.sort(
    ([, a], [, b]) => a - b,
  )
  return [answersSortedByNoOfErrors.map(([answer]) => answer)[0]]
}

/**
 * Apply a callback to all given answers returning all resulting answers.
 */
const unfilteredMapAnswers = <T extends AbstractState, U, V>(
  answers: Answers<T, U>,
  callback: (answer: Answer<T, U>) => Answers<T, V>,
) => answers.map(callback).flat()

/**
 * Apply a callback to all given answers returning all resulting answers after
 * filtering answers with errors.
 */
export const mapAnswers = <T extends AbstractState, U, V>(
  answers: Answers<T, U>,
  callback: (answer: Answer<T, U>) => Answers<T, V>,
): Answers<T, V> => filterAnswers(unfilteredMapAnswers(answers, callback))

/**
 * Starting from a set of initial answers, for each value, map over all current
 * answers applying the callback.
 */
export const reduceAnswers = <T extends AbstractState, U, V>(
  values: V[],
  callback: (answer: Answer<T, U>, value: V) => Answers<T, U>,
  initial: Answers<T, U>,
): Answers<T, U> =>
  values.reduce(
    (answers, value) =>
      mapAnswers(answers, (answer) => callback(answer, value)),
    initial,
  )
