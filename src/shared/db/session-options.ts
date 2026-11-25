// Repeated in prisma.config.ts: the image ships it without src/. Change both together.
const UTC_SESSION = '-c timezone=UTC';
const OPTIONS_PARAM = 'options';

// The timezone flag goes last: PostgreSQL applies -c flags in order, so it wins
// over any timezone the address itself might set.
export const withUtcSession = (databaseUrl: string): string => {
  const url = new URL(databaseUrl);
  const own = url.searchParams.get(OPTIONS_PARAM);
  url.searchParams.set(
    OPTIONS_PARAM,
    own === null || own === '' ? UTC_SESSION : `${own} ${UTC_SESSION}`,
  );
  return url.toString();
};
