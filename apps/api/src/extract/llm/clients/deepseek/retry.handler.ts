import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class RetryHandler {
  private readonly logger = new Logger(RetryHandler.name);

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        const delayMs = 1000 * (attempt + 1);
        this.logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error("Max retries exceeded");
  }
}
