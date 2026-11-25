-- The table and its rows only make sense together: the API reads rows the migration creates.
BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "homepage";

-- CreateEnum
CREATE TYPE "homepage"."page_locale" AS ENUM ('en', 'uk');

-- CreateTable
CREATE TABLE "homepage"."homepage_contents" (
    "id" UUID NOT NULL,
    "locale" "homepage"."page_locale" NOT NULL,
    "content" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3),

    CONSTRAINT "homepage_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_contents_locale_key" ON "homepage"."homepage_contents"("locale");

-- The home page for every locale, with empty content: text fields null, lists empty.
-- Ids are fixed UUIDv7 values: the migration has no access to the Ids role.
INSERT INTO homepage.homepage_contents (id, locale, content, updated_at)
SELECT page.id, page.locale::homepage.page_locale, '{
  "hero": { "title": null, "subtitle": null, "backgroundImageUrl": null },
  "products": { "items": [] },
  "combatProof": {
    "titleAccent": null,
    "title": null,
    "text": null,
    "buttonLabel": null,
    "buttonUrl": null,
    "videoUrl": null,
    "posterImageUrl": null
  },
  "features": { "items": [] },
  "about": { "title": null, "titleAccent": null, "paragraphs": [] }
}'::jsonb, NULL
FROM (VALUES
  ('01a213ce-ed7e-752f-b977-a59bbb04007a'::uuid, 'en'),
  ('01a213ce-ed7f-74a9-81bd-f67f93325101'::uuid, 'uk')
) AS page (id, locale);

COMMIT;
