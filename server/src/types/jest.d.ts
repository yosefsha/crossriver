/// <reference types="jest" />
/// <reference types="node" />

// Global Jest types for VS Code IntelliSense
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperty(property: string, value?: any): R;
      toBeDefined(): R;
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
      toBeLessThan(expected: number): R;
      not: Matchers<R>;
    }
  }
}

export {};
