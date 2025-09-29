
export function testFunction(): string {
  const message = 'Hello from TypeScript';
  return message;
}

export class TestClass {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }
}
