// No client rejections yet: every locale has a row from the migration, so a
// missing row is a fault and goes to the client as 500.
export type HomepageFault = 'HOMEPAGE_CONTENT_MISSING';

export class HomepageError extends Error {
  constructor(
    readonly code: HomepageFault,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HomepageError';
  }
}
