import { IsString, MinLength, ValidateIf } from 'class-validator';

export class ClaimPurchaseDto {
  @ValidateIf((o: ClaimPurchaseDto) => !o.orderId?.trim())
  @IsString()
  @MinLength(4)
  paymentId?: string;

  @ValidateIf((o: ClaimPurchaseDto) => !o.paymentId?.trim())
  @IsString()
  @MinLength(4)
  orderId?: string;
}
