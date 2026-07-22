import { IsString, Length } from 'class-validator';

export class RedeemPromoDto {
  @IsString()
  @Length(4, 40)
  code: string;
}
