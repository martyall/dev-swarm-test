export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
}

export interface SuccessResponse<T = unknown> extends BaseResponse<T> {
  success: true;
  data: T;
}