import { Injectable } from '@angular/core';
import { LogService } from './log.service';
import { FunctionCall } from '@google/generative-ai';

export const ColumnTypeValues = ['string', 'integer', 'date'] as const;
type ColumnType = typeof ColumnTypeValues[number];

type Column = {
  columnName: string,
  columnType: ColumnType,
};

export type Table = {
  tableName: string,
  columns: Column[],
};

interface DatabaseFunction {
  (log: LogService, ...args: any[]): boolean;
}

interface DatabaseFunctions {
  [fname: string]: DatabaseFunction
};

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(
    private log: LogService,
  ) { }

  tables: Table[] = [];

  createTable(log: LogService, table: Table): boolean {
    log.info("Creating table", table);
    this.tables.push(table);
    // log.info(this.tables);
    return true;
  }

  dbfunctions: { [functionName: string]: Function } = {
    createTable: this.createTable,
  };

  callFunction(fc: FunctionCall) {
    const f = this.dbfunctions[fc.name];
    return f.apply(this, [this.log, fc.args]);
  }
}
