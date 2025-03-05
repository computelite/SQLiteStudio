import {
  DatabaseHeader,
  DatabaseResultSet,
  DatabaseRow,
} from "@/drivers/base-driver";
import { InStatement } from "@libsql/client";
import { BindParams, Database } from "sql.js";
import { SqliteLikeBaseDriver } from "./sqlite-base-driver";

export default class SqljsDriver extends SqliteLikeBaseDriver {
  protected db: Database;
  protected hasRowsChanged: boolean = false;
  protected dbName?: string;

  constructor(sqljs: Database, dbName?: string) {
    super();
    this.db = sqljs;
    this.dbName = dbName;
  }

  reload(sqljs: Database) {
    this.db = sqljs;
    this.hasRowsChanged = false;
  }

  async transaction(stmts: InStatement[]): Promise<DatabaseResultSet[]> {
    const r: DatabaseResultSet[] = [];

    for (const s of stmts) {
      r.push(await this.query(s));
    }

    return r;
  }

  async saveToOPFS() {
    const root = await navigator.storage.getDirectory();
    const dataFolder = await root.getDirectoryHandle('data', { create: true });
    const projectFolder = await dataFolder.getDirectoryHandle('Default', { create: true });
    const fileHandle = await projectFolder.getFileHandle(this.dbName ?? '', { create: false });
    const writable = await fileHandle.createWritable();

    const data = this.db.export();

    await writable.write(data);
    await writable.close();
    return { fileHandle, writable };
  }

  async query(stmt: InStatement): Promise<DatabaseResultSet> {
    const sql = typeof stmt === "string" ? stmt : stmt.sql;
    const bind =
      typeof stmt === "string" ? undefined : (stmt.args as BindParams);

    const startTime = Date.now();
    const s = this.db.prepare(sql, bind);
    const endTime = Date.now();

    // Do the transform result here
    const headerName = s.getColumnNames();
    const headerSet = new Set();

    const headers: DatabaseHeader[] = headerName.map((colName) => {
      let renameColName = colName;

      for (let i = 0; i < 20; i++) {
        if (!headerSet.has(renameColName)) break;
        renameColName = `__${colName}_${i}`;
      }

      return {
        name: renameColName,
        displayName: colName,
        originalType: null,
        type: undefined,
      };
    });

    const rows: DatabaseRow[] = [];
    while (s.step()) {
      const r = s.get();
      rows.push(
        headers.reduce((a, b, idx) => {
          a[b.name] = r[idx];
          return a;
        }, {} as DatabaseRow)
      );
    }

    if (this.db.getRowsModified() > 0) {
      this.hasRowsChanged = true;
    }

    const rowsAffected = headers.length === 0 ? this.db.getRowsModified() : 0;
    // let affectedSchema = false;
    if (
      sql.trim().substring(0, "select ".length).toLowerCase() !=
      "select "
    ) {
      if (this.dbName) {
        await this.saveToOPFS();
      }
    }
    // else if (
    //   sql.trim().substring(0, "drop ".length).toLowerCase() ===
    //   "drop "
    // ) {
    //   affectedSchema = true;
    // } else if (
    //   sql.trim().substring(0, "begin ".length).toLowerCase() ===
    //   "begin "
    // ) {
    //   affectedSchema = true;
    // }

    // if (affectedSchema || rowsAffected > 0) {
    //   if (this.dbName) {
    //     await this.saveToOPFS();
    //   }
    // }

    return {
      headers,
      rows,
      stat: {
        rowsAffected: rowsAffected,
        rowsRead: null,
        rowsWritten: null,
        queryDurationMs: endTime - startTime,
      },
    };
  }

  // Manually Added  -- VISHAL
  async executeScript(sqlScript: string): Promise<DatabaseResultSet[]> {
    const startTime = Date.now();
    const r: DatabaseResultSet[] = [];

    try {
      // Execute the entire script at once
      const result = this.db.exec(sqlScript);

      // Process the result and format it similarly to the query method
      for (const res of result) {
        const headers: DatabaseHeader[] = res.columns.map((colName) => ({
          name: colName,
          displayName: colName,
          originalType: null,
          type: undefined,
        }));

        const rows: DatabaseRow[] = res.values.map((r: any) => {
          return headers.reduce((a, b, idx) => {
            a[b.name] = r[idx];
            return a;
          }, {} as DatabaseRow);
        });

        r.push({
          headers,
          rows,
          stat: {
            rowsAffected: res.values.length,
            rowsRead: res.values.length,
            rowsWritten: null,
            queryDurationMs: Date.now() - startTime,
          },
        });
      }
      await this.saveToOPFS();
      return r;
    } catch (error) {
      console.error("Error executing SQL script:", error);
      throw new Error("Failed to execute SQL script");
    }
  }


  resetChange() {
    this.hasRowsChanged = false;
  }

  hasChanged() {
    return this.hasRowsChanged;
  }

  close(): void {
    // do nothing
  }
}
