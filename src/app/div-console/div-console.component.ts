import { Component, Injectable, InjectionToken } from '@angular/core';
import { LogService } from '../log.service';

@Component({
  selector: 'app-div-console',
  templateUrl: './div-console.component.html',
  styleUrl: './div-console.component.css'
})
export class DivConsoleComponent {
  constructor(
    public errService: LogService
  ) {  }

  clear() {
    this.errService.logMessages = [];
  }
}
