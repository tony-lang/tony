export interface TypeInterface {
  matches(pattern: TypeInterface): boolean;
  isComplete(): boolean;
  isValid(): boolean;
  toString(): string;
}
