// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, ElementRef, viewChild } from '@angular/core';
import { DatabaseService } from './database.service';
import { GeminiService } from './gemini.service';
import { LogService } from './log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected apiKey = viewChild.required<ElementRef<HTMLInputElement>>('apiKey');

  // True while waiting for Gemini API response.
  protected waiting = false;

  protected samplePrompts = [
    "Add contact Ada Lovelace 10 December 1815 - 27 November 1852",
    "Create shipping address: 123 Main Street, Anytown, USA 12345",
    "Remember anniversary for April Fools day",
  ];

  constructor(
    private log: LogService,
    protected gemini: GeminiService,
    protected database: DatabaseService,
  ) { }

  send(prompt: string) {
    if (this.waiting) {
      this.log.warn("Unable to send, still waiting for response." +
        " Reload page to restart."
      );
      // Prevent form submission.
      return false;
    }
    if (!prompt) {
      this.log.warn("Prompt is empty. Nothing to send.");
      // Prevent form submission.
      return false;
    }

    // async call.
    this.generateResponse(prompt);

    // Prevent form submission.
    return false;
  }

  async generateResponse(prompt: string) {
    const apiKey = this.apiKey().nativeElement.value;
    if (!apiKey) {
      this.log.error('API Key must be provided');
      return;
    }

    this.waiting = true;
    try {
      await this.gemini.generateResponse(apiKey, prompt);
    } catch (e) {
      this.log.catch(e);
    } finally {
      this.waiting = false;
    }
  }
}