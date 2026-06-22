import { NextResponse } from "next/server";

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
}

export interface ApiResponseError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export function successResponse<T>(data: T, status = 200) {
  const body: ApiResponseSuccess<T> = {
    success: true,
    data,
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(
  message: string,
  status = 500,
  code?: string,
  details?: unknown
) {
  const body: ApiResponseError = {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
  return NextResponse.json(body, { status });
}
