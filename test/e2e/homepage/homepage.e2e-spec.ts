import { Clock } from '../../../src/shared/clock/clock.ts';
import type { ErrorResponse } from '../../../src/shared/http/error-response.ts';
import { responseBody } from '../../utils/response-body.ts';
import { useTestApp } from '../../utils/use-test-app.ts';

const NOW = new Date('2026-11-25T10:00:00.000Z');
const PATH = '/api/v1/pages/home';

const app = useTestApp((builder) =>
  builder.overrideProvider(Clock).useValue({ now: () => NOW }),
);

type Page = Record<string, unknown> & { updatedAt: string | null };

const EMPTY_SECTIONS = {
  hero: { title: null, subtitle: null, backgroundImageUrl: null },
  products: { items: [] },
  combatProof: {
    titleAccent: null,
    title: null,
    text: null,
    buttonLabel: null,
    buttonUrl: null,
    videoUrl: null,
    posterImageUrl: null,
  },
  features: { items: [] },
  about: { title: null, titleAccent: null, paragraphs: [] },
};

const HERO = {
  title: 'Small Robots. Big impact.',
  subtitle: 'Unmanned systems for real missions. Built for the front line.',
  backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
};

const PRODUCTS = {
  items: [
    {
      name: 'Rangermobile',
      tagline: 'Compact. Modular. Reliable.',
      imageUrl: 'https://cdn.example.com/rangermobile.png',
      linkUrl: '/products/rangermobile',
    },
    {
      name: 'Beezooka',
      tagline: 'The Grenade Launcher, Reinvented',
      imageUrl: 'https://cdn.example.com/beezooka.png',
      linkUrl: null,
    },
  ],
};

const read = (locale: string): ReturnType<ReturnType<typeof app.http>['get']> =>
  app.http().get(PATH).query({ locale });

describe('home page content', () => {
  it('returns the empty page the migration created', async () => {
    for (const locale of ['en', 'uk']) {
      const response = await read(locale);
      expect(response.status).toBe(200);
      expect(responseBody<Page>(response)).toEqual({
        locale,
        ...EMPTY_SECTIONS,
        updatedAt: null,
      });
    }
  });

  it('updates only the sections sent and returns the page', async () => {
    const response = await app
      .http()
      .patch(PATH)
      .query({ locale: 'en' })
      .send({ hero: HERO, products: PRODUCTS });

    expect(response.status).toBe(200);
    const expected = {
      locale: 'en',
      ...EMPTY_SECTIONS,
      hero: HERO,
      products: PRODUCTS,
      updatedAt: NOW.toISOString(),
    };
    expect(responseBody<Page>(response)).toEqual(expected);
    expect(responseBody<Page>(await read('en'))).toEqual(expected);
  });

  it('replaces a section as a whole on the next update', async () => {
    await app.http().patch(PATH).query({ locale: 'en' }).send({ hero: HERO });
    const response = await app
      .http()
      .patch(PATH)
      .query({ locale: 'en' })
      .send({
        hero: { title: 'New title', subtitle: null, backgroundImageUrl: null },
        about: {
          title: 'About',
          titleAccent: 'Microwar',
          paragraphs: ['First.', 'Second.'],
        },
      });

    expect(responseBody<Page>(response)).toMatchObject({
      hero: { title: 'New title', subtitle: null, backgroundImageUrl: null },
      about: {
        title: 'About',
        titleAccent: 'Microwar',
        paragraphs: ['First.', 'Second.'],
      },
      products: { items: [] },
    });
  });

  it('keeps locales apart', async () => {
    await app.http().patch(PATH).query({ locale: 'uk' }).send({ hero: HERO });

    expect(responseBody<Page>(await read('uk'))).toMatchObject({ hero: HERO });
    expect(responseBody<Page>(await read('en'))).toEqual({
      locale: 'en',
      ...EMPTY_SECTIONS,
      updatedAt: null,
    });
  });

  it('drops fields the sections do not declare', async () => {
    const response = await app
      .http()
      .patch(PATH)
      .query({ locale: 'en' })
      .send({ hero: { ...HERO, color: 'red' }, footer: { text: 'x' } });

    expect(response.status).toBe(200);
    const page = responseBody<Page>(response);
    expect(page.hero).toEqual(HERO);
    expect(page).not.toHaveProperty('footer');
  });

  it('rejects a missing or unknown locale', async () => {
    for (const query of [{}, { locale: 'de' }]) {
      const response = await app.http().get(PATH).query(query);
      expect(response.status).toBe(400);
      expect(responseBody<ErrorResponse>(response)).toMatchObject({
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: 'locale', rules: ['isIn'] }] },
      });
    }
  });

  it('rejects an invalid section with the field path', async () => {
    const response = await app
      .http()
      .patch(PATH)
      .query({ locale: 'en' })
      .send({
        hero: { title: 'x'.repeat(201), subtitle: null },
        products: {
          items: [{ name: 5, tagline: null, imageUrl: null, linkUrl: null }],
        },
        about: { title: null, titleAccent: null, paragraphs: 'not a list' },
      });

    expect(response.status).toBe(400);
    const body = responseBody<ErrorResponse>(response);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.details).toEqual({
      fields: expect.arrayContaining([
        { path: 'hero.title', rules: ['maxLength'] },
        { path: 'hero.backgroundImageUrl', rules: ['isString', 'maxLength'] },
        { path: 'products.items.0.name', rules: ['isString', 'maxLength'] },
        {
          path: 'about.paragraphs',
          rules: expect.arrayContaining(['isArray']),
        },
      ]),
    });
    expect(responseBody<Page>(await read('en')).updatedAt).toBeNull();
  });

  it('logs the update without content', async () => {
    await app
      .http()
      .patch(PATH)
      .query({ locale: 'uk' })
      .send({ hero: HERO, products: PRODUCTS });

    expect(app.logs.ofEvent('homepage.content_updated')).toEqual([
      expect.objectContaining({ locale: 'uk', sectionCount: 2 }),
    ]);
    expect(JSON.stringify(app.logs.all())).not.toContain('Rangermobile');
  });
});
