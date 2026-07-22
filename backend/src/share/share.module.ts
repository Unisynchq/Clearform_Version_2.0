import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController, ShareLinksController } from './share.controller';

@Module({
  providers: [ShareService],
  controllers: [ShareController, ShareLinksController],
})
export class ShareModule {}
