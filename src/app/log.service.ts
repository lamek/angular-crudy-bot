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

  debug(msg: string) {
    this.logMessages.push({ level: Level.debug, datetime: new Date(), message: msg, error: undefined });
  }

  info(msg: string) {
    this.logMessages.push({ level: Level.info, datetime: new Date(), message: msg, error: undefined });
  }

  warn(msg: string) {
    this.logMessages.push({ level: Level.warn, datetime: new Date(), message: msg, error: undefined });
  }

  error(msg: string) {
    this.logMessages.push({ level: Level.error, datetime: new Date(), message: msg, error: undefined });
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
