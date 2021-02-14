import { Answers, buildAnswer } from '../types/type_inference/answers'
import {
  Constraints,
  buildConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import { ResolvedType, Type } from '../types/type_inference/categories'
import {
  TypeKind,
  TypeVariable,
  buildIntersectionType,
  buildTemporaryTypeVariable,
} from '../types/type_inference/types'
import { StateForAnswers, mapAnswers, reduceAnswers } from '../util/answers'
import { buildConstraintsFromType } from '../util/types'
import { normalize } from './normalization'
import { unifyConstraints } from './constraints'

type Return = { type: ResolvedType; constraints: Constraints }

/**
 * Given a set of types, return the least general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends StateForAnswers>(
  state: T,
  ...types: Type[]
): Answers<T, Return> =>
  reduceAnswers<T, Return, Type>(
    types,
    ({ state, type: left, constraints }, right) =>
      mapAnswers(
        concreteUnify(state, left, right),
        ({ state, type, constraints: constraintsAfterUnify }) =>
          mapAnswers(
            normalize(state, type),
            ({ state, type, constraints: constraintsAfterNormalize }) =>
              mapAnswers(
                unifyConstraints(
                  state,
                  constraints,
                  constraintsAfterUnify,
                  constraintsAfterNormalize,
                ),
                ({ state, constraints }) => [
                  buildAnswer(state, { type, constraints }),
                ],
              ),
          ),
      ),
    [
      buildAnswer(state, {
        type: buildTemporaryTypeVariable(),
        constraints: buildConstraints(),
      }),
    ],
  )

const concreteUnify = <T extends StateForAnswers>(
  state: T,
  left: Type,
  right: Type,
) => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(state, left, right)
    case TypeKind.TemporaryVariable:
      return [
        buildAnswer(state, { type: right, constraints: buildConstraints() }),
      ]
    default:
      return [
        buildAnswer(state, {
          type: buildIntersectionType([left, right]),
          constraints: buildConstraints(),
        }),
      ]
  }
}

const unifyWithTypeVariable = <T extends StateForAnswers>(
  state: T,
  typeVariable: TypeVariable,
  type: Type,
) => {
  if (type.kind === TypeKind.Variable)
    return [
      buildAnswer(state, {
        type: typeVariable,
        constraints: buildConstraints([
          buildTypeVariableAssignment([typeVariable, type]),
        ]),
      }),
    ]
  return mapAnswers(normalize(state, type), ({ state, type, constraints }) =>
    mapAnswers(
      unifyConstraints(
        state,
        constraints,
        buildConstraintsFromType(typeVariable, type),
      ),
      ({ state, constraints }) => [buildAnswer(state, { type, constraints })],
    ),
  )
}
