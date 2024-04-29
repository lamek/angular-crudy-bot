import { Component, ElementRef, viewChild } from '@angular/core';
import { LogService } from '../log.service';

@Component({
  selector: 'app-div-console',
  templateUrl: './div-console.component.html',
  styleUrl: './div-console.component.css'
})
export class DivConsoleComponent {

  protected scrollAnchor = viewChild.required<ElementRef<HTMLDivElement>>('scrollAnchor');

  // Whether the console is expanded.
  protected expanded = false;

  constructor(
    public log: LogService
  ) { }

  toggle() {
    this.expanded = !this.expanded;
    if (this.expanded) {
      setTimeout(() => this.scrollToEnd(), 1);
    }
  }

  scrollToEnd() {
    this.scrollAnchor().nativeElement.scrollIntoView();
  }

  clear() {
    this.log.logMessages = [];
  }
}
