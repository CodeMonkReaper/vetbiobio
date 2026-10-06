// Red de seguridad JSON: BigInt (ids Prisma) → string en todas las respuestas.
// Usado por main.ts (prod/dev) y por el setup e2e, para paridad total.
export function installBigIntJson(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
