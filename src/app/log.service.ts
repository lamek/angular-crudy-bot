import { Injectable } from '@angular/core';

enum Level {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}

interface LogMessage {
  level: Level;
  datetime: Date;
  message?: string;
  error?: Error;
};

@Injectable({
  providedIn: 'root'
})
export class LogService {

  logMessages: LogMessage[] = [];

  constructor() { }

  totext(...args: any[]): string {
    console.log("args", args);

    return args.reduce((prev: any, curr: any, i: number, arr: any[]) => {
      console.log("prev", prev, "curr", curr);
      prev = prev ? prev + " " : "";
      prev += JSON.stringify(curr, null, 2)
      return prev;
    });
  }

  debug(...args: any[]) {
    this.logMessages.push({ level: Level.debug, datetime: new Date(), message: this.totext(...args), error: undefined });
  }

  info(...args: any[]) {
    this.logMessages.push({ level: Level.info, datetime: new Date(), message: this.totext(...args), error: undefined });
  }

  warn(...args: any[]) {
    this.logMessages.push({ level: Level.warn, datetime: new Date(), message: this.totext(...args), error: undefined });
  }

  error(...args: any[]) {
    this.logMessages.push({ level: Level.error, datetime: new Date(), message: this.totext(...args), error: undefined });
  }

  catch(err: any) {
    if (err instanceof Error) {
      this.handle(err as Error);
    } else {
      this.logMessages.push({ level: Level.error, datetime: new Date(), message: undefined, error: new Error("caught", { cause: err }) });
    }
  }

  handle(err: Error) {
    this.logMessages.push({ level: Level.error, datetime: new Date(), message: undefined, error: err });
  }

}
