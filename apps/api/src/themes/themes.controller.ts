import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import { ThemeDto } from './dto/theme.dto.js';
import { ThemesService } from './themes.service.js';

@Controller('themes')
export class ThemesController {
  constructor(private readonly themes: ThemesService) {}

  /** Platform themes with their design tokens, in display order. */
  @Public()
  @Get()
  list(): Promise<ThemeDto[]> {
    return this.themes.listPlatform();
  }
}
