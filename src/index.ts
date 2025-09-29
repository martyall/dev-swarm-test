export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export class Application {
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  public start(): void {
    console.log(`Starting ${this.name}...`);
  }

  public getName(): string {
    return this.name;
  }
}

const app = new Application('TypeScript Node.js App');
console.log(greet('TypeScript'));