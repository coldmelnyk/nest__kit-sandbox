import type { HomepageLocale } from '../domain/homepage-content.ts';

declare module '../../../shared/logging/log-events.ts' {
  interface LogEvents {
    'homepage.content_updated': {
      locale: HomepageLocale;
      sectionCount: number;
    };
  }
}
