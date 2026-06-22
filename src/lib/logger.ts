type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  env: string;
  category?: string;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private env = process.env.NODE_ENV || "development";

  private writeLog(
    level: LogLevel,
    message: string,
    category?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ) {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      env: this.env,
      category,
      metadata,
    };

    if (error) {
      payload.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    if (this.env === "production") {
      // Use console.info instead of console.log to satisfy no-console ESLint restrictions
      console.info(JSON.stringify(payload));
    } else {
      // In development, display formatted output for developer readability
      const color =
        level === "ERROR"
          ? "\x1b[31m"
          : level === "WARN"
            ? "\x1b[33m"
            : level === "DEBUG"
              ? "\x1b[36m"
              : "\x1b[32m";
      const reset = "\x1b[0m";
      const catPrefix = category ? `[${category.toUpperCase()}] ` : "";
      
      console.info(
        `${color}${payload.timestamp} [${level}]${reset} ${catPrefix}${message}`,
        metadata ? "\nMetadata:" + JSON.stringify(metadata, null, 2) : "",
        error ? "\nError:" + error.stack : ""
      );
    }
  }

  public info(message: string, category?: string, metadata?: Record<string, unknown>) {
    this.writeLog("INFO", message, category, metadata);
  }

  public warn(message: string, category?: string, metadata?: Record<string, unknown>) {
    this.writeLog("WARN", message, category, metadata);
  }

  public error(message: string, error?: Error, category?: string, metadata?: Record<string, unknown>) {
    this.writeLog("ERROR", message, category, metadata, error);
  }

  public debug(message: string, category?: string, metadata?: Record<string, unknown>) {
    if (this.env !== "production") {
      this.writeLog("DEBUG", message, category, metadata);
    }
  }

  // Helper trackers
  public logApiRequest(req: {
    method: string;
    url: string;
    status: number;
    durationMs: number;
    ip?: string;
    userId?: string;
  }) {
    const message = `${req.method} ${req.url} - ${req.status} in ${req.durationMs}ms`;
    // Map properties to Record<string, unknown>
    const meta: Record<string, unknown> = {
      method: req.method,
      url: req.url,
      status: req.status,
      durationMs: req.durationMs,
      ip: req.ip,
      userId: req.userId,
    };
    this.info(message, "api_request", meta);
  }

  public logAuthEvent(action: string, success: boolean, userId?: string, metadata?: Record<string, unknown>) {
    const message = `Authentication ${action} - ${success ? "SUCCESS" : "FAILURE"}`;
    const meta: Record<string, unknown> = {
      success,
      userId,
      ...metadata,
    };
    this.info(message, "authentication", meta);
  }

  public logPaymentEvent(
    action: string,
    status: string,
    orderId: string,
    paymentIntentId: string,
    metadata?: Record<string, unknown>
  ) {
    const message = `Payment transaction [${action}] - Status: ${status} for Order: ${orderId}`;
    const meta: Record<string, unknown> = {
      status,
      orderId,
      paymentIntentId,
      ...metadata,
    };
    this.info(message, "payment", meta);
  }

  public logAdminEvent(action: string, userId: string, details: string) {
    const message = `Admin activity [${action}] by User ${userId}: ${details}`;
    const meta: Record<string, unknown> = {
      action,
      userId,
      details,
    };
    this.info(message, "admin_activity", meta);
  }

  public logPerformanceWarning(metric: string, value: number, threshold: number, details?: string) {
    const message = `Performance warning [${metric}] triggered: Value ${value} exceeded threshold of ${threshold}`;
    const meta: Record<string, unknown> = {
      metric,
      value,
      threshold,
      details,
    };
    this.warn(message, "performance", meta);
  }
}

export const logger = new StructuredLogger();
