import { Component, ElementRef, viewChild } from '@angular/core';
import { LogService as LogService } from './log.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected apiKey = viewChild.required<ElementRef<HTMLInputElement>>('apiKey');
  protected prompt = viewChild.required<ElementRef<HTMLInputElement>>('prompt');

  constructor(public log: LogService) { }

  send() {
    this.log.info("sending…");
    this.generateResponse();

    // Prevent form submission.
    return false;
  }

  async generateResponse() {
    try {
      const apiKey = this.apiKey().nativeElement.value;
      if (!apiKey) {
        this.log.error('API Key must be provided');
        return;
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      const result = await model.generateContent(this.prompt().nativeElement.value);
      const response = await result.response;
      const text = response.text();
      this.log.info("response:" + text);
    } catch (e) {
      this.log.catch(e)
    }
  }
}