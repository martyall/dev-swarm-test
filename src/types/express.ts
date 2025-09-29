import { Application, Router, RequestHandler, ErrorRequestHandler } from 'express';
import { Server } from 'http';

// Express application configuration
export interface ExpressConfig {
  trustProxy: boolean;
  jsonLimit: string;
  urlEncodedLimit: string;
  corsEnabled: boolean;
  helmetEnabled: boolean;
  compressionEnabled: boolean;
  staticPath?: string;
  staticOptions?: any;
}

// Server instance type
export interface AppServer {
  app: Application;
  server: Server | null;
  port: number;
  host: string;
  isRunning: boolean;
}

// Router configuration
export interface RouterConfig {
  path: string;
  router: Router;
  middleware?: RequestHandler[];
}

// Route definition
export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';
  path: string;
  handler: RequestHandler | RequestHandler[];
  middleware?: RequestHandler[];
  description?: string;
}

// Middleware configuration
export interface MiddlewareConfig {
  name: string;
  handler: RequestHandler | ErrorRequestHandler;
  order: number;
  enabled: boolean;
  options?: any;
}

// Security middleware options
export interface SecurityMiddlewareOptions {
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
    optionsSuccessStatus: number;
    methods?: string[];
    allowedHeaders?: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: boolean;
    crossOriginResourcePolicy: boolean;
    dnsPrefetchControl: boolean;
    frameguard: boolean;
    hidePoweredBy: boolean;
    hsts: boolean;
    ieNoOpen: boolean;
    noSniff: boolean;
    originAgentCluster: boolean;
    permittedCrossDomainPolicies: boolean;
    referrerPolicy: boolean;
    xssFilter: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
}

// Request context extensions
export interface RequestContext {
  requestId: string;
  startTime: number;
  userAgent?: string;
  ip: string;
  user?: any;
  session?: any;
}

// Express application factory options
export interface AppOptions {
  config: ExpressConfig;
  security: SecurityMiddlewareOptions;
  routers: RouterConfig[];
  middleware: MiddlewareConfig[];
  errorHandlers: ErrorRequestHandler[];
}

// Route registration helper
export interface RouteRegistration {
  basePath: string;
  routes: RouteDefinition[];
  middleware?: RequestHandler[];
  beforeAll?: RequestHandler[];
  afterAll?: RequestHandler[];
}

// Server lifecycle hooks
export interface ServerHooks {
  beforeStart?: () => Promise<void> | void;
  afterStart?: (server: AppServer) => Promise<void> | void;
  beforeShutdown?: (server: AppServer) => Promise<void> | void;
  afterShutdown?: () => Promise<void> | void;
}

// Express server factory type
export type ExpressServerFactory = (options: AppOptions, hooks?: ServerHooks) => AppServer;

// Middleware factory type
export type MiddlewareFactory<T = any> = (options?: T) => RequestHandler | ErrorRequestHandler;

// Route handler factory type
export type RouteHandlerFactory<T = any> = (options?: T) => RequestHandler;

// Express application builder pattern
export interface ExpressAppBuilder {
  withConfig(config: Partial<ExpressConfig>): ExpressAppBuilder;
  withSecurity(security: Partial<SecurityMiddlewareOptions>): ExpressAppBuilder;
  withRouter(router: RouterConfig): ExpressAppBuilder;
  withMiddleware(middleware: MiddlewareConfig): ExpressAppBuilder;
  withErrorHandler(handler: ErrorRequestHandler): ExpressAppBuilder;
  withHooks(hooks: ServerHooks): ExpressAppBuilder;
  build(): AppServer;
}

// Health check middleware configuration
export interface HealthCheckConfig {
  path: string;
  enabled: boolean;
  checks: {
    database?: boolean;
    redis?: boolean;
    filesystem?: boolean;
    memory?: boolean;
    uptime?: boolean;
  };
  timeout: number;
}

// Graceful shutdown configuration
export interface GracefulShutdownConfig {
  enabled: boolean;
  timeout: number;
  signals: string[];
  forceExitTimeout: number;
  cleanupTasks: (() => Promise<void> | void)[];
}