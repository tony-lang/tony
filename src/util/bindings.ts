import { TermBinding, TypeBinding } from '../types/analyze/bindings'

type Item = { name: string }

const findItemByName = <T extends Item>(name: string, items: T[]) =>
  items.find((item) => item.name === name)

export const findBinding = <T extends TermBinding | TypeBinding>(
  name: string,
  bindingsStack: T[][],
): T | undefined =>
  bindingsStack.reduce<T | undefined>((binding, bindings) => {
    if (binding !== undefined) return binding

    return findItemByName(name, bindings)
  }, undefined)

/**
 * Returns the items (1) is missing from (2).
 */
export const itemsMissingFrom = <T extends Item>(
  items1: T[],
  items2: T[],
): T[] =>
  items2.filter((a) => items1.find((b) => a.name === b.name) === undefined)
