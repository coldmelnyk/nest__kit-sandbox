import type { PageLocale, Prisma } from '../../../generated/prisma/client.ts';
import type {
  HomepageContent,
  HomepageLocale,
  HomepageView,
} from '../domain/homepage-content.ts';

true satisfies [PageLocale] extends [HomepageLocale]
  ? [HomepageLocale] extends [PageLocale]
    ? true
    : false
  : false;

export const HOMEPAGE_CONTENT_PAGE_SELECT = {
  locale: true,
  content: true,
  updatedAt: true,
} satisfies Prisma.HomepageContentSelect;

type HomepageContentPage = Prisma.HomepageContentGetPayload<{
  select: typeof HOMEPAGE_CONTENT_PAGE_SELECT;
}>;

// The column holds JSON this module wrote after DTO validation; the database
// does not know its shape, so the type is asserted at this boundary.
export const homepageViewOf = (row: HomepageContentPage): HomepageView => ({
  locale: row.locale,
  content: row.content as HomepageContent,
  updatedAt: row.updatedAt,
});
