export interface AppConfig {
  port: number;
  environment: string;
  logLevel: string;
}

export const config: AppConfig = {
  port: Number(process.env['PORT']) || 3000,
  environment: process.env['NODE_ENV'] || 'development',
  logLevel: process.env['LOG_LEVEL'] || 'info',
};

export default config;