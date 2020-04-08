const INTERNAL_IDENTIFIER_PREFIX = Object.freeze('tony_internal_')

export class TransformIdentifier {
  private identifiers: string[] = []

  perform = (identifier: string): string => {
    const index = this.identifiers.indexOf(identifier)
    if (index != -1) return `${INTERNAL_IDENTIFIER_PREFIX}${index}`

    const length = this.identifiers.push(identifier)
    return `${INTERNAL_IDENTIFIER_PREFIX}${length - 1}`
  }
}
