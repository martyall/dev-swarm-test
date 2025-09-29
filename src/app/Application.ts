import { Logger } from '../utils/Logger';

export class Application {
  private readonly logger: Logger;
  private readonly name: string;

  constructor() {
    this.name = 'Node.js TypeScript Application';
    this.logger = new Logger('Application');
  }

  public async start(): Promise<void> {
    this.logger.info(`Starting ${this.name}...`);

    await this.initialize();

    this.logger.info(`${this.name} is running`);
  }

  private async initialize(): Promise<void> {
    this.logger.info('Initializing application components...');

    await new Promise(resolve => setTimeout(resolve, 100));

    this.logger.info('Application initialization complete');
  }

  public getName(): string {
    return this.name;
  }
}