declare module 'hbs' {
  const hbs: {
    registerPartials(directory: string): void
    registerHelper(name: string, fn: (...args: unknown[]) => unknown): void
  }
  export = hbs
}
