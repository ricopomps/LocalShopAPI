import createHttpError from "http-errors";

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (!val) {
    throw createHttpError(
      400,
      "Esperado que 'val' esteja definido, mas recebeu " + val
    );
  }
}
