/**
 * Simple logger utility for test automation.
 * Provides consistent logging format across all page objects and tests.
 */
export class Logger {
  private context: string;
  private static isDebugEnabled: boolean = process.env.DEBUG === 'true';

  constructor(context: string) {
    this.context = context;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string): string {
    return `[${this.getTimestamp()}] [${level}] [${this.context}] ${message}`;
  }

  /**
   * Log info level message
   */
  info(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  /**
   * Log debug level message (only shown when DEBUG=true)
   */
  debug(message: string): void {
    if (Logger.isDebugEnabled) {
      console.log(this.formatMessage('DEBUG', message));
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string): void {
    console.warn(this.formatMessage('WARN', message));
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error): void {
    console.error(this.formatMessage('ERROR', message));
    if (error) {
      console.error(error.stack);
    }
  }

  /**
   * Log step message (for test steps)
   */
  step(stepNumber: number, description: string): void {
    console.log(this.formatMessage('STEP', `[${stepNumber}] ${description}`));
  }

  /**
   * Log action message (for page object actions)
   */
  action(actionName: string, details?: string): void {
    const message = details ? `${actionName}: ${details}` : actionName;
    console.log(this.formatMessage('ACTION', message));
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`);
  }
}

/**
 * Global logger instance for utilities
 */
export const globalLogger = new Logger('Global');
