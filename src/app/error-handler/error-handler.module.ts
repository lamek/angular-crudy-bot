import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorService } from '../error.service';


@Injectable()
export class ErrorHandlerModule implements ErrorHandler {
  constructor(
    private errorService: ErrorService,
  ) { }
  handleError(err: Error) {
    this.errorService.error(err, 'UNCAUGHT EXCEPTION');
  }

}
