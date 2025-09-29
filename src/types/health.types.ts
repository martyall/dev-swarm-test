export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
}

export interface HealthCheckResponse {
  service: string;
  health: HealthStatus;
  checks?: Record<string, any>;
}

export interface ServiceInfo {
  name: string;
  version: string;
  environment: string;
}