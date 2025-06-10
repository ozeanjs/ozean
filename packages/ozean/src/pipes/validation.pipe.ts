import { PipeTransform, ArgumentMetadata } from '../interfaces/pipe.interface';
import { Injectable } from '../decorators/injectable';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { BadRequestException } from 'exceptions/http-exception';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);
      console.error('Validation failed. Errors: ', errorMessages);
      throw new BadRequestException({
        message: 'Input data validation failed',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]) {
    return errors.map((err) => {
      return {
        property: err.property,
        value: err.value,
        constraints: err.constraints,
      };
    });
  }
}
