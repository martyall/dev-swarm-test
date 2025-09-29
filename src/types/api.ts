import { Request, Response, NextFunction } from 'express';

// Base interfaces for API requests and responses
export interface ApiRequest<TBody = any, TQuery = any, TParams = any> extends Request {
  body: TBody;
  query: TQuery;
  params: TParams;
}

export interface ApiResponse<TData = any> extends Response {
  json(body: ApiResponseBody<TData>): this;
}

export interface ApiResponseBody<TData = any> {
  success: boolean;
  data?: TData;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Middleware types
export type ApiMiddleware<TReq = ApiRequest, TRes = ApiResponse> = (
  req: TReq,
  res: TRes,
  next: NextFunction
) => void | Promise<void>;

export type ErrorHandler<TReq = ApiRequest, TRes = ApiResponse> = (
  error: Error,
  req: TReq,
  res: TRes,
  next: NextFunction
) => void | Promise<void>;

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: string;
  version?: string;
  environment?: string;
}

export interface HealthCheckRequest extends ApiRequest<never, never, never> {}

// Route handler types
export type RouteHandler<TReq = ApiRequest, TRes = ApiResponse> = (
  req: TReq,
  res: TRes,
  next?: NextFunction
) => void | Promise<void>;

export type AsyncRouteHandler<TReq = ApiRequest, TRes = ApiResponse> = (
  req: TReq,
  res: TRes,
  next: NextFunction
) => Promise<void>;

// Common request/response patterns
export interface PaginatedQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<TData = any> {
  items: TData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error types
export interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
  constraints: string[];
}

// Server configuration types
export interface ServerConfig {
  port: number;
  host: string;
  environment: 'development' | 'production' | 'test';
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}