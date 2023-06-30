export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (!val) {
    throw Error("Esperado que 'val' esteja definido, mas recebeu " + val);
  }
}
