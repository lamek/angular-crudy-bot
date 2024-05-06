import { Component, ElementRef, OnInit, viewChild } from '@angular/core';
import { LogService } from '../log.service';
import { GeminiService } from '../gemini.service';

@Component({
  selector: 'app-model-config',
  templateUrl: './model-config.component.html',
  styleUrl: './model-config.component.css',
  standalone: true,
})
export class ModelConfigComponent implements OnInit {
  protected modelVersion = viewChild.required<ElementRef<HTMLInputElement>>('modelVersion');
  protected apiKey = viewChild.required<ElementRef<HTMLInputElement>>('apiKey');

  constructor(
    private log: LogService,
    protected gemini: GeminiService,
  ) { }

  useSystemInstruction = true;

  systemInstruction = `You are an AI database agent.

  1. Users describe what data they would like to store in plain language.
  
  2. You translate these descriptions into a suitable database schema.
     - Consider the tables, columns and data types that would be appropriate.
     - Expand the set of obvious columns to be added to include columns that
       are also likely to exist in production databases.
  
  3. Compare the current schema with the new schema.
     - Review the existing tables and columns in the current schema.
     - Ensure columns data types are still appropriate in the new schema.
     - Determine whether any tables and/or columns are missing.
     - Identify which columns need to moved to different tables.
     
  4. Respond with multiple function calls to fully update the schema.
     - Create all missing tables.
     - Alter existing tables to add missing columns.
     - Delete columns that have been moved to another table.
  `;

  ngOnInit(): void {
    // Set initial values that are hard-coded in the HTML.
    this.configure();
  }

  configure() {
    const modelVersion = this.modelVersion().nativeElement.value;
    const apiKey = this.apiKey().nativeElement.value
    if (modelVersion && apiKey) {
      this.gemini.configure(modelVersion, apiKey);
    }
  }

  setSystemInstruction(useSystemInstruction: boolean, systemInstruction: string) {
    this.gemini.setSystemInstruction(useSystemInstruction ? systemInstruction : "");
  }

}
