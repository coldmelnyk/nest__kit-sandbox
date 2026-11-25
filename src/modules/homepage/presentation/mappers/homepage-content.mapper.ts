import type {
  HomepageSectionsPatch,
  HomepageView,
} from '../../domain/homepage-content.ts';
import type { HomePage } from '../dto/home-page.dto.ts';

export const toHomePage = (view: HomepageView): HomePage.Page => ({
  locale: view.locale,
  hero: view.content.hero,
  products: view.content.products,
  combatProof: view.content.combatProof,
  features: view.content.features,
  about: view.content.about,
  updatedAt: view.updatedAt,
});

// Only the sections the client sent: an absent section stays as stored.
export const toSectionsPatch = (
  request: HomePage.UpdateRequest,
): HomepageSectionsPatch => ({
  ...(request.hero === undefined ? {} : { hero: request.hero }),
  ...(request.products === undefined ? {} : { products: request.products }),
  ...(request.combatProof === undefined
    ? {}
    : { combatProof: request.combatProof }),
  ...(request.features === undefined ? {} : { features: request.features }),
  ...(request.about === undefined ? {} : { about: request.about }),
});
