import { Component } from '@angular/core';
import { ErrorService } from './error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public errService: ErrorService) { }

  debug() {
    this.errService.debug("debug!");
  }

  info() {
    this.errService.info("info!");
  }

  warn() {
    this.errService.warn("warn!");
  }

  throw() {
    try {
      throw "intentional";
    }
    catch (e) {
      throw new Error('catch and rethrow');
    }
  }
}
