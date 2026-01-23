export class DeepSeekApiException extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string,
    public readonly metadata: {
      provider: string;
      model: string;
      durationMs: number;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    }
  ) {
    super(message);
    this.name = "DeepSeekApiException";
    Object.setPrototypeOf(this, DeepSeekApiException.prototype);
  }
}

export class DeepSeekJsonParseException extends DeepSeekApiException {
  constructor(
    message: string,
    rawResponse: string,
    metadata: DeepSeekApiException["metadata"],
    public readonly rawJson: string
  ) {
    super(message, rawResponse, metadata);
    this.name = "DeepSeekJsonParseException";
    Object.setPrototypeOf(this, DeepSeekJsonParseException.prototype);
  }
}

export class DeepSeekValidationException extends DeepSeekApiException {
  constructor(
    message: string,
    rawResponse: string,
    metadata: DeepSeekApiException["metadata"],
    public readonly validationError: unknown
  ) {
    super(message, rawResponse, metadata);
    this.name = "DeepSeekValidationException";
    Object.setPrototypeOf(this, DeepSeekValidationException.prototype);
  }
}

export class DeepSeekQuotaException extends DeepSeekApiException {
  constructor(
    message: string,
    rawResponse: string,
    metadata: DeepSeekApiException["metadata"]
  ) {
    super(message, rawResponse, metadata);
    this.name = "DeepSeekQuotaException";
    Object.setPrototypeOf(this, DeepSeekQuotaException.prototype);
  }
}

export function isQuotaError(error: unknown): boolean {
  const errorObj = error as any;
  return (
    errorObj?.code === "insufficient_quota" ||
    errorObj?.type === "insufficient_quota" ||
    String(error).includes("insufficient_quota") ||
    String(error).includes("quota") ||
    errorObj?.status === 429
  );
}
