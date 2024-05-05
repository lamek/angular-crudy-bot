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

import { Injectable } from "@angular/core";
import { FunctionDeclaration, FunctionDeclarationSchema, FunctionDeclarationSchemaProperty, FunctionDeclarationSchemaType, GoogleGenerativeAI } from "@google/generative-ai";
import { LogService } from "./log.service";
import { ColumnTypeValues, DatabaseService } from "./database.service";

type ResponseType = "none" | "waiting" | "unknown" | "functionCall" | "invalidFunctionCall" | "text" | "error";

type Response = {
  type: ResponseType,
  response?: string,
};

@Injectable({
  providedIn: "root"
})
export class GeminiService {

  constructor(
    private log: LogService,
    private database: DatabaseService,
  ) { }

  // Most recent response.
  public lastResponse: Response = { type: "none" };

  async generateResponse(apiKey: string, prompt: string, systemInstruction?: string) {
    this.lastResponse = { type: "waiting" };

    const tableNameSchema: FunctionDeclarationSchemaProperty = {
      type: FunctionDeclarationSchemaType.STRING,
      nullable: false,
      description:
        "Table name. Table names should be lowercase, and use snake_case.",
    };

    const columnNameSchema: FunctionDeclarationSchemaProperty = {
      type: FunctionDeclarationSchemaType.STRING,
      nullable: false,
      description:
        "Column name. Column names should be lowercase, and use snake_case.",
    };

    const columnTypeSchema: FunctionDeclarationSchemaProperty = {
      type: FunctionDeclarationSchemaType.STRING,
      nullable: false,
      enum: [...ColumnTypeValues],
      description:
        "Column type. Specifies the type of data that can be stored in this column.",
    };

    const tableColumnProperties: { [k: string]: FunctionDeclarationSchemaProperty } = {
      columnName: columnNameSchema,
      columnType: columnTypeSchema,
    };

    const columnSchema: FunctionDeclarationSchema = {
      type: FunctionDeclarationSchemaType.OBJECT,
      description: "Table column. Specifies the properties of a table column.",
      properties: tableColumnProperties,
      required: ["columnName, columnType"],
    };

    const columnsSchema: FunctionDeclarationSchemaProperty = {
      type: FunctionDeclarationSchemaType.ARRAY,
      nullable: false,
      description: "Array of table columns definitions.",
      items: columnSchema,
    };

    const createTableSchema: { [k: string]: FunctionDeclarationSchemaProperty } = {
      tableName: tableNameSchema,
      columns: columnsSchema,
    };

    const aterTableSchema: { [k: string]: FunctionDeclarationSchemaProperty } = {
      tableName: tableNameSchema,
      addColumns: columnsSchema,
      removeColumns: columnsSchema,
      alterColumns: columnsSchema,
    };

    const createTableFunctionDeclaration: FunctionDeclaration = {
      name: "createTable",
      parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        description: "Create database table.",
        properties: createTableSchema,
        required: ["tableName", "columns"],
      },
    };

    const alterTableFunctionDeclaration: FunctionDeclaration = {
      name: "alterTable",
      parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        description: "Alter database table. Modifies column definitions",
        properties: aterTableSchema,
        required: ["tableName"],
      },
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    model.tools = [{
      functionDeclarations: [
        createTableFunctionDeclaration,
        alterTableFunctionDeclaration,
      ]
    }];

    model.toolConfig = {
      functionCallingConfig: {
        // Require function calling response.
        // mode: FunctionCallingMode.ANY,
        // allowedFunctionNames: ["createTable", "alterTable"],
      }
    };

    if (systemInstruction) {
      model.systemInstruction = {
        role: "user",
        parts: [{ text: systemInstruction }],
      };
    }

    prompt = prompt + "\nThe current data model is:\n" +
      JSON.stringify(this.database.tables);
    this.log.info("Sending", JSON.stringify(prompt));
    try {

      const result = await model.generateContent(prompt);

      const calls = result.response.functionCalls();
      if (calls) {
        calls.forEach((fc, i) => {
          this.log.info("Received function call response:", fc);
          const err = this.database.callFunction(fc);
          if (err) {
            this.log.error("Error calling function: " + fc.name, err);
            this.lastResponse = {
              type: "invalidFunctionCall",
              response: JSON.stringify(fc, null, 2),
            };
          } else {
            this.log.info("Successfully called function " + fc.name);
            this.lastResponse = {
              type: "functionCall",
              response: JSON.stringify(fc, null, 2),
            };
          }
        });
      } else if (result.response.text()) {
        this.log.info("Received text response:", result.response.text());
        this.lastResponse = {
          type: "text",
          response: result.response.text(),
        };
      } else {
        this.lastResponse = {
          type: "unknown",
          response: JSON.stringify(result.response),
        }
      }
    } catch (e) {
      this.lastResponse = {
        type: "error",
        response: '' + e,
      }
      // Rethrow.
      throw e;
    }
  }
}
