import { Binding } from './Binding'
import { Type, TypeConstraints } from '../../types'
import { assert } from '../../errors'

const INTERNAL_IDENTIFIER_PREFIX = Object.freeze('tony_internal_')

export class IdentifierBinding implements Binding {
  private static count = 0

  private _id: number
  private _implementations: Type[]
  private _isExported: boolean
  private _isImplicit: boolean
  private _name: string
  protected _type: Type

  constructor(
    name: string,
    type: Type,
    {
      isExported = false,
      isImplicit = false,
    }: { isExported?: boolean; isImplicit?: boolean } = {
      isExported: false,
      isImplicit: false,
    },
  ) {
    this._isExported = isExported
    this._isImplicit = isImplicit
    this._name = name
    this._type = type

    this._id = IdentifierBinding.count += 1
    this._implementations = [type]
  }

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return this._isImplicit
  }

  get isImported(): boolean {
    return false
  }

  get name(): string {
    return this._name
  }

  get type(): Type {
    return this._type
  }

  set type(value: Type) {
    this._type = value
  }

  transformedName = (type: Type, constraints: TypeConstraints): string => {
    const implementationId = this.getImplementationId(type, constraints)

    assert(
      implementationId !== undefined,
      'Cannot access transformed name of identifier binding before implementation was determined.',
    )

    return `${INTERNAL_IDENTIFIER_PREFIX}${this._id}${implementationId}`
  }

  getImplementationId = (
    type: Type,
    constraints: TypeConstraints,
  ): number | undefined =>
    this._implementations.findIndex(
      (implementationType) =>
        Type.attemptWithTmpConstraints(
          implementationType.unify,
          type,
          constraints,
        ) !== undefined,
    )

  addImplementation = (type: Type): void => {
    this._implementations = [...this._implementations, type]
    this._type = this.type.disj(type)
  }
}
