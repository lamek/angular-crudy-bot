import { Component, ElementRef, viewChild } from '@angular/core';
import { LogService as LogService } from './log.service';
import { FunctionCallingConfig, FunctionCallingMode, FunctionDeclaration, FunctionDeclarationSchema, FunctionDeclarationSchemaProperty, FunctionDeclarationSchemaType, GenerativeModel, GoogleGenerativeAI, ToolConfig } from '@google/generative-ai';

const ColumnTypeValues = ['string', 'integer', 'date'] as const;
type ColumnType = typeof ColumnTypeValues[number];

type Column = {
  columnName: string,
  columnType: ColumnType,
};

type Table = {
  tableName: string,
  columns: Column[],
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected apiKey = viewChild.required<ElementRef<HTMLInputElement>>('apiKey');
  protected prompt = viewChild.required<ElementRef<HTMLInputElement>>('prompt');

  protected tables: Table[] = [];

  constructor(public log: LogService) { }

  send() {
    const prompt = this.prompt().nativeElement.value;
    this.log.info("Sending", prompt);
    this.generateResponse(prompt);

    // Prevent form submission.
    return false;
  }

  async generateResponse(prompt: string) {
    try {
      const apiKey = this.apiKey().nativeElement.value;
      if (!apiKey) {
        this.log.error('API Key must be provided');
        return;
      }

      const tableColumnProperties: { [k: string]: FunctionDeclarationSchemaProperty } = {
        columnName: {
          type: FunctionDeclarationSchemaType.STRING,
          nullable: false,
          description:
            "Column name. Column names should be lowercase, and use snake_case.",
        },
        columnType: {
          type: FunctionDeclarationSchemaType.STRING,
          nullable: false,
          enum: [...ColumnTypeValues],
          description:
            "Column type. Specifies the type of data that can be stored in this column.",
        },
      };

      const tableColumnSchema: FunctionDeclarationSchema = {
        type: FunctionDeclarationSchemaType.OBJECT,
        description: "Table column. Specifies the properties of a table column.",
        properties: tableColumnProperties,
        required: ["columnName, columnType"],
      };

      const tableProperties: { [k: string]: FunctionDeclarationSchemaProperty } = {
        tableName: {
          type: FunctionDeclarationSchemaType.STRING,
          nullable: false,
          description:
            "Table name. Table names should be lowercase, and use snake_case.",
        },
        columns: {
          type: FunctionDeclarationSchemaType.ARRAY,
          nullable: false,
          description: "Array of table columns definitions.",
          items: tableColumnSchema,
        },
      };

      const createTableFunctionDeclaration: FunctionDeclaration = {
        name: "createTable",
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          description: "Create database table.",
          properties: tableProperties,
          required: ["tableName", "columns"],
        },
      };

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

      model.tools = [{ functionDeclarations: [createTableFunctionDeclaration] }];

      model.toolConfig = {
        functionCallingConfig: {
          // Require function calling response.
          // mode: FunctionCallingMode.ANY,
          // allowedFunctionNames: ["createTable"],
        }
      };

      model.systemInstruction = {
        role: "user",
        parts: [{
          text: "You are 'CRUDy bot', an AI database agent." +
            " Users write basic CRUD (Create, Read, Update, Delete) operations in plain text." +
            " For each such statement, you determine a suitable database table structure." +
            " You respond with the a function call that would create that table strucutre."
        }],
      };

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const calls = response.functionCalls();
      if (calls) {
        this.log.info("response.functionCalls():", calls);
        this.tables = calls.map(ddl => ddl['args']) as any;
        this.log.info("tables", this.tables);
      }
      if (response.text()) {
        this.log.info("response.text():", response.text());
      }
    } catch (e) {
      this.log.catch(e)
    }
  }
}