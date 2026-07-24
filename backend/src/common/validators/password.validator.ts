import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordComplexity', async: false })
export class PasswordComplexityConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    if (value.length < 8 || value.length > 128) return false;
    let categories = 0;
    if (/[a-z]/.test(value)) categories++;
    if (/[A-Z]/.test(value)) categories++;
    if (/[0-9]/.test(value)) categories++;
    if (/[^a-zA-Z0-9]/.test(value)) categories++;
    return categories >= 2;
  }

  defaultMessage(): string {
    return `Password must be 8-128 characters with at least 2 of: lowercase, uppercase, number, special character`;
  }
}
