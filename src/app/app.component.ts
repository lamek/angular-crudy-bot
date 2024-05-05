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

import { AfterViewInit, Component, ElementRef, OnInit, viewChild } from '@angular/core';
import { DatabaseService } from './database.service';
import { GeminiService } from './gemini.service';
import { LogService } from './log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  protected apiKey = viewChild.required<ElementRef<HTMLInputElement>>('apiKey');

  // True while waiting for Gemini API response.
  protected waiting = false;

  useSystemInstruction = true;

  systemInstruction = `You are an AI database agent.

  1. Users describe what data they would like to store in plain language.
  
  2. You translate these descriptions into a suitable database scehma.
     - Consider the tables, columns and data types that would be appropriate.
     - Expand the set of obvious columns to be added to include columns that
       are also likely to exist in production databases.
  
  3. Compare the current schema with the new schema.
     - Review the existing tables and columns in the current schema.
     - Ensure columns data types are still appropriate in the new scehma.
     - Determine whether any tables and/or columns are missing.
     - Identify which columns need to moved to different tables.
     
  4. Respond with mutliple function calls to fully update the schema.
     - Create all missing tables.
     - Add all missing columns.
     - Delete columns that have been moved to another table.
  `;

  constructor(
    private log: LogService,
    protected gemini: GeminiService,
    protected database: DatabaseService,
  ) { }

  ngOnInit(): void {
    // Set API key if hard-coded in the HTML. 
    const apiKey = this.apiKey().nativeElement.value;
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(apiKey: string) {
    this.gemini.setApiKey(apiKey);
  }

  setSystemInstruction(useSystemInstruction: boolean, systemInstruction: string) {
    this.gemini.setSystemInstruction(useSystemInstruction ? systemInstruction : "");
  }

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
    this.waiting = true;
    try {
      await this.gemini.generateResponse(prompt);
    } catch (e) {
      this.log.catch(e);
    } finally {
      this.waiting = false;
    }
  }
}