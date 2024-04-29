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

interface alterTableArgs {
  tableName: string,
  addColumns: Column[],
  removeColumns: Column[],
  alterColumns: Column[],
}

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
    return true;
  }

  getOrMakeTable(tableName: string): Table {
    return this.tables.find(t => t.tableName == tableName) || {} as Table;
  }

  alterTable(log: LogService, args: alterTableArgs): boolean {
    log.info("Altering table", args);
    const table = this.getOrMakeTable(args.tableName);

    // Remove specified columns.
    if (args.removeColumns) {
      args.removeColumns.forEach(col => {
        const i = table.columns.findIndex(c => c.columnName == col.columnName);
        if (i == -1) {
          this.log.warn("ALTER TABLE", table.tableName, "FAILED TO DELETE NON-EXISTENT COLUMN", col.columnName);
        } else {
          this.log.debug("ALTER TABLE", table.tableName, "DELETE COLUMN", col.columnName);
          table.columns.splice(i, 1);
        }
      });
    }

    // Alter existing columns.
    if (args.alterColumns) {
      args.alterColumns.forEach(col => {
        const c = table.columns.find(c => c.columnName == col.columnName);
        if (c) {
          this.log.debug("ALTER TABLE", args.tableName, "MODIFY COLUMN", col.columnName, "MODIFY TYPE", col.columnType, "->", c.columnType);
          c.columnType = col.columnType;
        }
      });
    }

    // Add new columns.
    if (args.addColumns) {
      args.addColumns.forEach(col => {
        this.log.debug("ALTER TABLE", args.tableName, "ADD COLUMN", col.columnName, "TYPE", col.columnType);
        table.columns.push(col);
      });
    }
    return true;
  }

  dbfunctions: { [functionName: string]: Function } = {
    createTable: this.createTable,
    alterTable: this.alterTable,
  };

  callFunction(fc: FunctionCall) {
    const f = this.dbfunctions[fc.name];
    return f.apply(this, [this.log, fc.args]);
  }
}
