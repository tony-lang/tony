import { InternalTypeError } from '../../errors'
import { Type } from './Type'
import { TypeEqualityGraph } from './TypeEqualityGraph'
import { TypeVariable } from './TypeVariable'

export class ParametricType extends Type {
  private _name: string
  private _parameters: Type[]

  constructor(name: string, parameters: Type[] = []) {
    super()

    this._name = name
    this._parameters = parameters
  }

  get name(): string {
    return this._name
  }

  get parameters(): Type[] {
    return this._parameters
  }

  concat = (type: Type): ParametricType =>
    new ParametricType(this.name, [...this.parameters, type])

  // eslint-disable-next-line max-lines-per-function
  unsafeUnify = (
    actual: Type,
    typeEqualityGraph?: TypeEqualityGraph,
    ignoreExpectedParameters = false,
  ): ParametricType => {
    if (actual instanceof TypeVariable) {
      if (typeEqualityGraph) typeEqualityGraph.add(actual, this)

      return this
    } else if (
      actual instanceof ParametricType &&
      this.name === actual.name &&
      (ignoreExpectedParameters ||
        this.parameters.length == actual.parameters.length)
    ) {
      const parameters = ignoreExpectedParameters
        ? actual.parameters
        : this.parameters.map((parameter, i) => {
            try {
              return parameter.unsafeUnify(
                actual.parameters[i],
                typeEqualityGraph,
              )
            } catch (error) {
              if (error instanceof InternalTypeError)
                error.addTypeMismatch(this, actual)
              throw error
            }
          })

      return new ParametricType(this.name, parameters)
    }

    throw new InternalTypeError(
      this,
      actual,
      'Non-variable types do not match.',
    )
  }

  reduce = (typeEqualityGraph: TypeEqualityGraph): Type => {
    const parameters = this.parameters.map((parameter) =>
      parameter.reduce(typeEqualityGraph),
    )

    return new ParametricType(this.name, parameters)
  }

  equals = (type: Type): boolean => {
    if (!(type instanceof ParametricType)) return false
    if (this.parameters.length != type.parameters.length) return false

    return this.name === type.name && this.parameters.every((parameter, i) =>
      parameter.equals(type.parameters[i]),
    )
  }

  toString = (): string => {
    const parameters = this.parameters.map((parameter) => parameter.toString())
    const combinedParameters =
      parameters.length > 0 ? `<${parameters.join(', ')}>` : ''

    return `${this.name}${combinedParameters}`
  }
}
