import { Injectable } from '@angular/core';
import { FunctionDeclaration, FunctionDeclarationSchema, FunctionDeclarationSchemaProperty, FunctionDeclarationSchemaType, GoogleGenerativeAI } from '@google/generative-ai';
import { LogService } from './log.service';
import { ColumnTypeValues, DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor(
    private log: LogService,
    private database: DatabaseService,
  ) { }

  async generateResponse(apiKey: string, prompt: string) {
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
      calls.forEach((fc, i) => {
        this.log.info("Received function call response:", fc);
        const success = this.database.callFunction(fc);
        this.log.info(fc.name + "(…):", success ? "success" : "FAILED");
      });
      // this.log.info("tables", this.tables);
    }
    if (response.text()) {
      this.log.info("Received text response:", response.text());
    }
  }
}
