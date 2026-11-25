import { Injectable } from '@nestjs/common';
import { Clock } from '../../../../shared/clock/clock.ts';
import { DbService, Transactions } from '../../../../shared/db/db.service.ts';
import type { Tx } from '../../../../shared/db/db.service.ts';
import { EventLogger } from '../../../../shared/logging/event-logger.ts';
import type {
  HomepageLocale,
  HomepageSectionsPatch,
  HomepageView,
} from '../../domain/homepage-content.ts';
import { HomepageError } from '../../domain/homepage.errors.ts';
import {
  HOMEPAGE_CONTENT_PAGE_SELECT,
  homepageViewOf,
} from '../../infrastructure/homepage-content.select.ts';
import { HomepageContentRepository } from '../../ports/homepage-content.repository.ts';
import '../homepage.log-events.ts';

const missing = (locale: HomepageLocale): HomepageError =>
  new HomepageError(
    'HOMEPAGE_CONTENT_MISSING',
    'Home page content is missing for the locale',
    { locale },
  );

@Injectable()
export class HomepageContentService {
  constructor(
    private readonly _db: DbService,
    private readonly _transactions: Transactions,
    private readonly _contents: HomepageContentRepository,
    private readonly _clock: Clock,
    private readonly _events: EventLogger,
  ) {}

  read(locale: HomepageLocale): Promise<HomepageView> {
    return this.readWith(this._db, locale);
  }

  async update(
    locale: HomepageLocale,
    sections: HomepageSectionsPatch,
  ): Promise<HomepageView> {
    const view = await this._transactions.run(async (tx) => {
      const isUpdated = await this._contents.replaceSections(
        tx,
        locale,
        sections,
        this._clock.now(),
      );
      if (!isUpdated) {
        throw missing(locale);
      }
      return this.readWith(tx, locale);
    });
    this._events.info('homepage.content_updated', {
      locale,
      sectionCount: Object.keys(sections).length,
    });
    return view;
  }

  private async readWith(
    client: DbService | Tx,
    locale: HomepageLocale,
  ): Promise<HomepageView> {
    const row = await client.homepageContent.findUnique({
      where: { locale },
      select: HOMEPAGE_CONTENT_PAGE_SELECT,
    });
    if (row === null) {
      throw missing(locale);
    }
    return homepageViewOf(row);
  }
}
