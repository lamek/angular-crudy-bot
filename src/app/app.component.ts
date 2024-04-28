import { Component, ElementRef, viewChild } from '@angular/core';
import { ErrorService } from './error.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected apiKey = viewChild.required<ElementRef<HTMLInputElement>>('apiKey');

  constructor(public errService: ErrorService) { }

  send() {
    this.errService.info("sending…");

    const genAI = new GoogleGenerativeAI(this.apiKey().nativeElement.value);


    // Prevent form submission.
    return false;
  }
}
