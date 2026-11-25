// Modules add their events with `declare module` in `<module>.log-events.ts`.
export interface LogEvents {
  'app.started': { port: number };
  'http.request': {
    method: string;
    route: string | null;
    status: number;
    durationMs: number;
    userId: string | null;
  };
  'http.unhandled_error': {
    errorType: string;
    code: string | null;
    stack: string | null;
  };
}
