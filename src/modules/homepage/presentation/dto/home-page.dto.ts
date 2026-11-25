import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { HOMEPAGE_LOCALES } from '../../domain/homepage-content.ts';
import type { HomepageLocale } from '../../domain/homepage-content.ts';
import { NullableText } from '../decorators/nullable-text.decorator.ts';

const LABEL_MAX = 200;
const TEXT_MAX = 2_000;
const URL_MAX = 2_048;
const ICON_MAX = 100;
const ITEMS_MAX = 20;
const PARAGRAPHS_MAX = 10;

export namespace HomePage {
  @ApiSchema({ name: 'HomePage-Hero' })
  export class Hero {
    @NullableText(LABEL_MAX)
    title: string | null;

    @NullableText(TEXT_MAX)
    subtitle: string | null;

    @NullableText(URL_MAX)
    backgroundImageUrl: string | null;
  }

  @ApiSchema({ name: 'HomePage-ProductCard' })
  export class ProductCard {
    @NullableText(LABEL_MAX)
    name: string | null;

    @NullableText(LABEL_MAX)
    tagline: string | null;

    @NullableText(URL_MAX)
    imageUrl: string | null;

    @NullableText(URL_MAX)
    linkUrl: string | null;
  }

  @ApiSchema({ name: 'HomePage-Products' })
  export class Products {
    @ApiProperty({ type: [ProductCard], maxItems: ITEMS_MAX })
    @IsArray()
    @ArrayMaxSize(ITEMS_MAX)
    @ValidateNested({ each: true })
    @Type(() => ProductCard)
    items: ProductCard[];
  }

  @ApiSchema({ name: 'HomePage-CombatProof' })
  export class CombatProof {
    @NullableText(LABEL_MAX)
    titleAccent: string | null;

    @NullableText(LABEL_MAX)
    title: string | null;

    @NullableText(TEXT_MAX)
    text: string | null;

    @NullableText(LABEL_MAX)
    buttonLabel: string | null;

    @NullableText(URL_MAX)
    buttonUrl: string | null;

    @NullableText(URL_MAX)
    videoUrl: string | null;

    @NullableText(URL_MAX)
    posterImageUrl: string | null;
  }

  @ApiSchema({ name: 'HomePage-Feature' })
  export class Feature {
    @NullableText(ICON_MAX)
    icon: string | null;

    @NullableText(LABEL_MAX)
    label: string | null;
  }

  @ApiSchema({ name: 'HomePage-Features' })
  export class Features {
    @ApiProperty({ type: [Feature], maxItems: ITEMS_MAX })
    @IsArray()
    @ArrayMaxSize(ITEMS_MAX)
    @ValidateNested({ each: true })
    @Type(() => Feature)
    items: Feature[];
  }

  @ApiSchema({ name: 'HomePage-About' })
  export class About {
    @NullableText(LABEL_MAX)
    title: string | null;

    @NullableText(LABEL_MAX)
    titleAccent: string | null;

    @ApiProperty({ type: [String], maxItems: PARAGRAPHS_MAX })
    @IsArray()
    @ArrayMaxSize(PARAGRAPHS_MAX)
    @IsString({ each: true })
    @MaxLength(TEXT_MAX, { each: true })
    paragraphs: string[];
  }

  @ApiSchema({ name: 'HomePage-Page' })
  export class Page {
    @ApiProperty({ enum: HOMEPAGE_LOCALES, example: 'en' })
    locale: HomepageLocale;

    @ApiProperty({ type: Hero })
    hero: Hero;

    @ApiProperty({ type: Products })
    products: Products;

    @ApiProperty({ type: CombatProof })
    combatProof: CombatProof;

    @ApiProperty({ type: Features })
    features: Features;

    @ApiProperty({ type: About })
    about: About;

    @ApiProperty({
      type: String,
      format: 'date-time',
      nullable: true,
      example: null,
    })
    updatedAt: Date | null;
  }

  @ApiSchema({ name: 'HomePage-LocaleQuery' })
  export class LocaleQuery {
    @ApiProperty({ enum: HOMEPAGE_LOCALES, example: 'en' })
    @IsIn(HOMEPAGE_LOCALES)
    locale: HomepageLocale;
  }

  @ApiSchema({ name: 'HomePage-UpdateRequest' })
  export class UpdateRequest {
    @ApiPropertyOptional({ type: Hero })
    @IsOptional()
    @ValidateNested()
    @Type(() => Hero)
    hero?: Hero;

    @ApiPropertyOptional({ type: Products })
    @IsOptional()
    @ValidateNested()
    @Type(() => Products)
    products?: Products;

    @ApiPropertyOptional({ type: CombatProof })
    @IsOptional()
    @ValidateNested()
    @Type(() => CombatProof)
    combatProof?: CombatProof;

    @ApiPropertyOptional({ type: Features })
    @IsOptional()
    @ValidateNested()
    @Type(() => Features)
    features?: Features;

    @ApiPropertyOptional({ type: About })
    @IsOptional()
    @ValidateNested()
    @Type(() => About)
    about?: About;
  }
}
