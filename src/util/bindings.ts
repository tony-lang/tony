type Item = { name: string }

const findItemByName = <T extends Item>(name: string, items: T[]) =>
  items.find((item) => item.name === name)

const findItemsByName = <T extends Item>(name: string, items: T[]) =>
  items.filter((item) => item.name === name)

const findItem = <T extends Item, U>(
  name: string,
  itemsStack: T[][],
  find: (name: string, items: T[]) => U,
  init: U,
) =>
  itemsStack.reduce<U>((item, items) => {
    if (item !== undefined) return item

    return find(name, items)
  }, init)

export const findBinding = <T extends Item>(
  name: string,
  bindingsStack: T[][],
): T | undefined => findItem(name, bindingsStack, findItemByName, undefined)

export const findBindings = <T extends Item>(
  name: string,
  bindingsStack: T[][],
): T[] => findItem(name, bindingsStack, findItemsByName, [])

/**
 * Returns the items (1) is missing from (2).
 */
export const itemsMissingFrom = <T extends Item>(
  items1: T[],
  items2: T[],
): T[] =>
  items2.filter((a) => items1.find((b) => a.name === b.name) === undefined)
