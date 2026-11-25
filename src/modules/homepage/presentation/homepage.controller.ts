import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../../shared/http/error-response.ts';
import { Public } from '../../../shared/http/public.ts';
import { HomepageContentService } from '../application/services/homepage-content.service.ts';
import { HomePage } from './dto/home-page.dto.ts';
import {
  toHomePage,
  toSectionsPatch,
} from './mappers/homepage-content.mapper.ts';

// Open until authorization exists (decision Р-3).
@Public()
@ApiTags('homepage')
@Controller('pages/home')
export class HomepageController {
  constructor(private readonly _contents: HomepageContentService) {}

  @Get()
  @ApiOperation({ summary: 'Read the home page content for a locale' })
  @ApiOkResponse({ type: HomePage.Page })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiInternalServerErrorResponse({ type: ErrorResponse })
  async read(@Query() query: HomePage.LocaleQuery): Promise<HomePage.Page> {
    return toHomePage(await this._contents.read(query.locale));
  }

  @Patch()
  @ApiOperation({
    summary: 'Replace the sent sections of the home page for a locale',
  })
  @ApiOkResponse({ type: HomePage.Page })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiInternalServerErrorResponse({ type: ErrorResponse })
  async update(
    @Query() query: HomePage.LocaleQuery,
    @Body() body: HomePage.UpdateRequest,
  ): Promise<HomePage.Page> {
    return toHomePage(
      await this._contents.update(query.locale, toSectionsPatch(body)),
    );
  }
}
