import { Headers, HTTPError, Method } from "got";

/**
 * Special AsyncGenerator that has a convinient "toArray()" method
 */
export interface ExtendedGenerator<T> extends AsyncGenerator<T> {
  // NOTE: We are using this `ExtendedGenerator` class until ECMAScript
  // implements convinient methods for iterators
  toArray(): Promise<T[]>;
}

/** Converts an AsyncGenerator into an ExtendedGenerator */
export function extendGenerator<T>(
  generator: AsyncGenerator<T>
): ExtendedGenerator<T> {
  return Object.assign(generator, {
    async toArray() {
      const result = [];
      for await (const v of generator) {
        result.push(v);
      }
      return result;
    },
  });
}

/**
 * Thrown when Canvas responds with an Error (i.e. a non 2xx or 3xx response)
 */
export class CanvasApiError extends Error {
  public options?: {
    headers: Headers;
    url: string;
    method: Method;
  };

  public response?: {
    body: unknown;
    headers: Headers;
    ip?: string;
    retryCount: number;
    statusCode: number;
    statusMessage?: string;
  };

  public code?: number;

  constructor(gotError: HTTPError) {
    super(gotError.message);
    this.code = gotError.response.statusCode;
    this.name = "CanvasApiError";
    this.options = {
      headers: gotError.options.headers,
      url: gotError.options.url.toString(),
      method: gotError.options.method,
    };
    this.response = gotError.response;

    this.options.headers.authorization = "[HIDDEN]";
  }
}
