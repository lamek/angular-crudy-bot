import { Component } from '@angular/core';
import { GeminiService } from '../gemini.service';
import { LogService } from '../log.service';

@Component({
  selector: 'app-gemini-response',
  standalone: true,
  imports: [],
  templateUrl: './gemini-response.component.html',
  styleUrl: './gemini-response.component.css'
})
export class GeminiResponseComponent {

  constructor(
    private log: LogService,
    protected gemini: GeminiService,
  ) { }

}
