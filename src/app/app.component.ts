import { Component } from '@angular/core';
import { ErrorService } from './error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public errService: ErrorService) { }
  send() {
    this.errService.info("sending…");
    return false;
  }
}
