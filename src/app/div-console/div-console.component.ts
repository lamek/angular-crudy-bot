import { Component, ElementRef, viewChild } from '@angular/core';
import { LogService } from '../log.service';

@Component({
  selector: 'app-div-console',
  templateUrl: './div-console.component.html',
  styleUrl: './div-console.component.css'
})
export class DivConsoleComponent {

  protected scrollAnchor = viewChild.required<ElementRef<HTMLDivElement>>('scrollAnchor');

  constructor(
    public log: LogService
  ) { }

  scrollToEnd() {
    this.scrollAnchor().nativeElement.scrollIntoView();
  }
  
  clear() {
    this.log.logMessages = [];
  }
}
