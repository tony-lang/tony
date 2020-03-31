export const print = console.log
// eslint-disable-next-line @typescript-eslint/camelcase
export const to_str = (n: number): string => String(n)

export const neg = (n: number): number => -n
export const add = (n: number, m: number): number => n + m
export const sub = (n: number, m: number): number => n - m
export const mod = (n: number, m: number): number => Math.abs(n % m)

export const concat = (a: number[], b: number[]): number[] => a.concat(b)

export const leq = (n: number, m: number): boolean => n <= m
export const lt = (n: number, m: number): boolean => n < m
export const geq = (n: number, m: number): boolean => n >= m
export const gt = (n: number, m: number): boolean => n > m

export const eq = (n: number, m: number): boolean => n == m
