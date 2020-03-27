export interface TypeInterface {
  matches(pattern: TypeInterface): boolean;
  isValid(): boolean;
  toString(): string;
}
