import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@ValidatorConstraint({ name: 'uuid', async: false })
export class IsValidUuidConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return typeof value === 'string' && UUID_V4_REGEX.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid UUID v4`;
  }
}
