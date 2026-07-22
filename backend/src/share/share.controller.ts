import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ShareService } from './share.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/forms/:id')
export class ShareLinksController {
  constructor(private readonly shareService: ShareService) {}

  @Get('share-links')
  getShareLinks(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shareService.getShareLinks(id, user.id);
  }
}

@Controller('api/v1/forms/:id/share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  getShareDetails(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shareService.getShareDetails(id, user.id);
  }

  @Patch('response-limit')
  updateResponseLimit(
    @Param('id') id: string,
    @Body('responseLimit') responseLimit: number | null,
    @CurrentUser() user: any,
  ) {
    return this.shareService.updateResponseLimit(id, user.id, responseLimit);
  }
}
