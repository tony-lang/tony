import { Answer, Answers } from '../types/type_inference/answers'

/**
 * Apply a callback to all given answers returning all resulting answers.
 */
export const mapAnswers = <T, U, V>(
  answers: Answers<T, U>,
  callback: (answer: Answer<T, U>) => Answers<T, V>,
): Answers<T, V> => answers.map(callback).flat()

/**
 * Starting from a set of initial answers, for each value, map over all current
 * answers applying the callback.
 */
export const reduceAnswers = <T, U, V>(
  values: V[],
  callback: (answer: Answer<T, U>, value: V) => Answers<T, U>,
  initial: Answers<T, U>,
): Answers<T, U> =>
  values.reduce(
    (answers, value) =>
      mapAnswers(answers, (answer) => callback(answer, value)),
    initial,
  )
