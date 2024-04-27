import { Component, Injectable, InjectionToken } from '@angular/core';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-div-console',
  templateUrl: './div-console.component.html',
  styleUrl: './div-console.component.css'
})
export class DivConsoleComponent {
  constructor(
    public errService: ErrorService
  ) {  }

  clear() {
    this.errService.logMessages = [];
  }
}
