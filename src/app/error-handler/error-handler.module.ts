import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogService } from '../log.service';


@Injectable()
export class ErrorHandlerModule implements ErrorHandler {
  constructor(
    private errorService: LogService,
  ) { }
  handleError(err: Error) {
    this.errorService.handle(err);
  }

}
