import type { Tx } from '../../../shared/db/db.service.ts';
import type {
  HomepageLocale,
  HomepageSectionsPatch,
} from '../domain/homepage-content.ts';

// Storage without an entity: one atomic statement, nothing is decided between
// reading and writing.
export abstract class HomepageContentRepository {
  abstract replaceSections(
    tx: Tx,
    locale: HomepageLocale,
    sections: HomepageSectionsPatch,
    now: Date,
  ): Promise<boolean>;
}
