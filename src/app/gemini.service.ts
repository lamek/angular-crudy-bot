import { Injectable } from "@angular/core";
import { FunctionDeclaration, FunctionDeclarationSchema, FunctionDeclarationSchemaProperty, FunctionDeclarationSchemaType, GoogleGenerativeAI } from "@google/generative-ai";
import { LogService } from "./log.service";
import { ColumnTypeValues, DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root"
})
export class GeminiService {

  constructor(
    private log: LogService,
    private database: DatabaseService,
  ) { }

  // Most recent response.
  public lastResponse = "";

  async generateResponse(apiKey: string, prompt: string) {
    this.lastResponse = "";

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

    model.systemInstruction = {
      role: "user",
      parts: [{
        text: "You are 'CRUDy bot', an AI database agent." +
          " Users write basic CRUD (Create, Read, Update, Delete) operations in plain text." +
          " For each such statement, you determine a suitable database table structure," +
          " taking into account the database tables that have already been created." +
          " You respond with the a function call that creates a new table if needed," +
          " or updates an existing tables. When updating an existing table, only remove" +
          " columns or update existing ones if explicitly asked to do so. Otherwise, you" +
          " should only add new columns to existing tables, or create new tables as necessary."
      }],
    };

    prompt = prompt + "\nThe current data model is:\n" +
      JSON.stringify(this.database.tables);
    this.log.info("Sending", JSON.stringify(prompt));
    try {

      const result = await model.generateContent(prompt);

      const response = await result.response;
      const calls = response.functionCalls();
      if (calls) {
        calls.forEach((fc, i) => {
          this.log.info("Received function call response:", fc);
          const success = this.database.callFunction(fc);
          this.log.info(fc.name + "(…):", success ? "success" : "FAILED");
          this.lastResponse = "Function call:\n" + JSON.stringify(fc, null, 2);
        });
      } else if (response.text()) {
        this.log.info("Received text response:", response.text());
        this.lastResponse = response.text();
      } else {
        this.lastResponse = "Unknown response: " + JSON.stringify(response);
      }
    } catch (e) {
      this.lastResponse = '' + e;
      // Rethrow.
      throw e;
    }
  }
}
