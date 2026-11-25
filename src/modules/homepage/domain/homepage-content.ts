export const HOMEPAGE_LOCALES = ['en', 'uk'] as const;
export type HomepageLocale = (typeof HOMEPAGE_LOCALES)[number];

export const HOMEPAGE_SECTIONS = [
  'hero',
  'products',
  'combatProof',
  'features',
  'about',
] as const;
export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number];

export type HomepageHero = {
  title: string | null;
  subtitle: string | null;
  backgroundImageUrl: string | null;
};

export type HomepageProductCard = {
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
};

export type HomepageCombatProof = {
  titleAccent: string | null;
  title: string | null;
  text: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  videoUrl: string | null;
  posterImageUrl: string | null;
};

export type HomepageFeature = {
  icon: string | null;
  label: string | null;
};

export type HomepageAbout = {
  title: string | null;
  titleAccent: string | null;
  paragraphs: string[];
};

export type HomepageContent = {
  hero: HomepageHero;
  products: { items: HomepageProductCard[] };
  combatProof: HomepageCombatProof;
  features: { items: HomepageFeature[] };
  about: HomepageAbout;
};

true satisfies HomepageSection extends keyof HomepageContent
  ? keyof HomepageContent extends HomepageSection
    ? true
    : false
  : false;

// Every section that is present replaces the stored one as a whole.
export type HomepageSectionsPatch = Partial<HomepageContent>;

export type HomepageView = {
  locale: HomepageLocale;
  content: HomepageContent;
  updatedAt: Date | null;
};
