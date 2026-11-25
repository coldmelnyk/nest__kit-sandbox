import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../../shared/db/db.service.ts';
import type {
  HomepageLocale,
  HomepageSectionsPatch,
} from '../../domain/homepage-content.ts';
import { HomepageContentRepository } from '../../ports/homepage-content.repository.ts';

@Injectable()
export class PrismaHomepageContentRepository extends HomepageContentRepository {
  // `||` on jsonb replaces only the top-level keys that are sent, in one statement.
  async replaceSections(
    tx: Tx,
    locale: HomepageLocale,
    sections: HomepageSectionsPatch,
    now: Date,
  ): Promise<boolean> {
    const updated = await tx.$executeRaw`
      UPDATE homepage.homepage_contents
      SET content = content || ${JSON.stringify(sections)}::jsonb,
          updated_at = ${now}
      WHERE locale = ${locale}::homepage.page_locale`;
    return updated === 1;
  }
}
