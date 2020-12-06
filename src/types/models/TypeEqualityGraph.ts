import { ParametricType } from './ParametricType'
import { Type } from './Type'
import { TypeEquivalenceClass } from './TypeEquivalenceClass'
import { TypeError } from '../../errors'
import { TypeVariable } from './TypeVariable'

export class TypeEqualityGraph {
  private _equivalenceClasses: TypeEquivalenceClass[]

  constructor(equivalenceClasses: TypeEquivalenceClass[] = []) {
    this._equivalenceClasses = equivalenceClasses
  }

  add = (typeVariable: TypeVariable, type: Type): void =>
    this.addEquivalenceClass(
      new TypeEquivalenceClass(this, [typeVariable, type]),
    )

  private addEquivalenceClass = (equivalence: TypeEquivalenceClass): void => {
    const [
      unifiedEquivalenceClass,
      equivalenceClasses,
    ] = this._equivalenceClasses.reduce(
      (
        [unifiedEquivalenceClass, equivalenceClasses]: [
          TypeEquivalenceClass,
          TypeEquivalenceClass[],
        ],
        equivalenceClass,
      ) => {
        if (
          unifiedEquivalenceClass.types.some((type) =>
            equivalenceClass.includes(type),
          )
        )
          return [
            TypeEquivalenceClass.unify(this, [
              unifiedEquivalenceClass,
              equivalenceClass,
            ]),
            equivalenceClasses,
          ]

        return [
          unifiedEquivalenceClass,
          [...equivalenceClasses, equivalenceClass],
        ]
      },
      [equivalence, []],
    )

    this._equivalenceClasses = [...equivalenceClasses, unifiedEquivalenceClass]
  }

  reduce = (type: Type): Type =>
    this.equivalenceClass(type)?.representative(this) || type

  private equivalenceClass = (type: Type): TypeEquivalenceClass | undefined =>
    this._equivalenceClasses.find((equivalenceClass) =>
      equivalenceClass.includes(type),
    )

  toString = (): string => {
    if (this._equivalenceClasses.length == 0) return ''

    const equivalenceClasses = this._equivalenceClasses
      .map((equivalenceClass) => equivalenceClass.toString())
      .join(', ')
    return `{${equivalenceClasses}}`
  }

  static build = (
    ...typeEqualityGraphs: TypeEqualityGraph[]
  ): TypeEqualityGraph | undefined =>
    TypeError.safe(() =>
      typeEqualityGraphs.reduce(
        (unifiedTypeEqualityGraph, typeEqualityGraph) => {
          typeEqualityGraph._equivalenceClasses.forEach((equivalenceClass) =>
            unifiedTypeEqualityGraph.addEquivalenceClass(equivalenceClass),
          )
          return unifiedTypeEqualityGraph
        },
      ),
    )
}
