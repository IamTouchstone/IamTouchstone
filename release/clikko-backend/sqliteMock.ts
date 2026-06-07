import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "clikko_db_mock.json");

interface DbSchema {
  org: any[];
  staff: any[];
  attendance: any[];
  leave_requests: any[];
  payments: any[];
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading Clikko mock DB, resetting:", e);
  }
  const defaultDb: DbSchema = {
    org: [],
    staff: [],
    attendance: [],
    leave_requests: [],
    payments: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
  return defaultDb;
}

function saveDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing Clikko mock DB:", e);
  }
}

class MockStatement {
  sql: string;
  constructor(sql: string) {
    this.sql = sql;
  }
  run(...params: any[]) {
    let callback: any = null;
    if (params.length > 0 && typeof params[params.length - 1] === "function") {
      callback = params.pop();
    }
    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/i;
    const match = this.sql.match(insertRegex);
    if (match) {
      const table = match[1].toLowerCase() as keyof DbSchema;
      const cols = match[2].split(",").map(c => c.trim().replace(/`/g, ''));
      const record: any = {};
      cols.forEach((col, idx) => {
        record[col] = params[idx];
      });
      
      const dbData = loadDb();
      const tableArray = dbData[table] || [];
      const newId = tableArray.length > 0 ? Math.max(...tableArray.map((row: any) => row.id || 0)) + 1 : 1;
      record.id = newId;

      if (table === "staff" && !record.created_at) {
        record.created_at = new Date().toISOString();
      }

      tableArray.push(record);
      dbData[table] = tableArray;
      saveDb(dbData);

      if (callback) {
        callback(null);
      }
    }
  }
  finalize(callback?: (err: Error | null) => void) {
    if (callback) callback(null);
  }
}

class MockDatabase {
  serialize(callback: () => void) {
    callback();
  }

  run(sql: string, params: any[] | any = [], callback?: (err: Error | null) => void) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    const trimmedSql = sql.trim();
    const upperSql = trimmedSql.toUpperCase();

    try {
      if (upperSql.startsWith("CREATE TABLE")) {
        if (callback) callback(null);
        return;
      }

      if (upperSql.startsWith("DELETE FROM")) {
        const parts = trimmedSql.split(/\s+/);
        const table = parts[2].toLowerCase() as keyof DbSchema;
        const dbData = loadDb();
        dbData[table] = [];
        saveDb(dbData);
        if (callback) callback(null);
        return;
      }

      if (upperSql.startsWith("INSERT INTO")) {
        const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/i;
        const match = trimmedSql.match(insertRegex);
        if (match) {
          const table = match[1].toLowerCase() as keyof DbSchema;
          const cols = match[2].split(",").map(c => c.trim().replace(/`/g, ''));
          const record: any = {};
          cols.forEach((col, idx) => {
            record[col] = params[idx];
          });
          
          const dbData = loadDb();
          const tableArray = dbData[table] || [];
          const newId = tableArray.length > 0 ? Math.max(...tableArray.map((row: any) => row.id || 0)) + 1 : 1;
          record.id = newId;

          if (table === "staff" && !record.created_at) {
            record.created_at = new Date().toISOString();
          }
          if (table === "attendance" && !record.time) {
            record.time = new Date().toISOString();
          }
          if (table === "leave_requests" && !record.status) {
            record.status = "Pending";
          }
          if (table === "payments" && !record.time) {
            record.time = new Date().toISOString();
          }

          tableArray.push(record);
          dbData[table] = tableArray;
          saveDb(dbData);

          const context = { lastID: newId };
          if (callback) {
            callback.call(context, null);
          }
        }
        return;
      }

      if (upperSql.startsWith("UPDATE")) {
        const updateRegex = /UPDATE\s+(\w+)\s+SET\s+([^WHERE]+)\s+WHERE\s+(.+)/i;
        const match = trimmedSql.match(updateRegex);
        if (match) {
          const table = match[1].toLowerCase() as keyof DbSchema;
          const dbData = loadDb();
          const tableArray = dbData[table] || [];

          if (table === "leave_requests") {
            const statusVal = params[0];
            const idVal = Number(params[1]);
            const item = tableArray.find((row: any) => row.id === idVal);
            if (item) {
              item.status = statusVal;
            }
          }
          dbData[table] = tableArray;
          saveDb(dbData);

          if (callback) callback(null);
        }
        return;
      }
    } catch (err: any) {
      if (callback) callback(err);
    }
  }

  get(sql: string, params: any[] | any = [], callback?: (err: Error | null, row: any) => void) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    const trimmedSql = sql.trim();
    const upperSql = trimmedSql.toUpperCase();

    try {
      if (upperSql.includes("FROM ORG")) {
        const dbData = loadDb();
        const row = dbData.org.length > 0 ? dbData.org[0] : null;
        if (callback) callback(null, row);
        return;
      }

      if (upperSql.includes("FROM STAFF") && upperSql.includes("WHERE PIN = ?")) {
        const dbData = loadDb();
        const pinVal = String(params[0]);
        const row = dbData.staff.find((r: any) => String(r.pin) === pinVal) || null;
        if (callback) callback(null, row);
        return;
      }

      if (upperSql.includes("FROM ATTENDANCE") && upperSql.includes("WHERE STAFF_ID = ?")) {
        const dbData = loadDb();
        const staffIdVal = Number(params[0]);
        const matches = dbData.attendance.filter((r: any) => Number(r.staff_id) === staffIdVal);
        matches.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
        const row = matches.length > 0 ? matches[0] : null;
        if (callback) callback(null, row);
        return;
      }
    } catch (err: any) {
      if (callback) callback(err, null);
    }
  }

  all(sql: string, params: any[] | any = [], callback?: (err: Error | null, rows: any[]) => void) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    const trimmedSql = sql.trim();
    const upperSql = trimmedSql.toUpperCase();

    try {
      if (upperSql.includes("FROM STAFF")) {
        const dbData = loadDb();
        if (callback) callback(null, dbData.staff);
        return;
      }

      if (upperSql.includes("FROM LEAVE_REQUESTS")) {
        const dbData = loadDb();
        const result = [...dbData.leave_requests].reverse();
        if (callback) callback(null, result);
        return;
      }

      if (upperSql.includes("FROM PAYMENTS")) {
        const dbData = loadDb();
        const result = [...dbData.payments];
        result.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
        const limited = result.slice(0, 100);
        if (callback) callback(null, limited);
        return;
      }

      if (upperSql.includes("FROM ATTENDANCE")) {
        const dbData = loadDb();
        const todayStr = new Date().toISOString().split("T")[0];
        const result: any[] = [];
        dbData.attendance.forEach((att: any) => {
          const attDate = String(att.time).substring(0, 10);
          if (attDate === todayStr) {
            const staff = dbData.staff.find((s: any) => s.id === att.staff_id);
            if (staff) {
              result.push({
                name: staff.name,
                type: att.type,
                time: att.time
              });
            }
          }
        });
        if (callback) callback(null, result);
        return;
      }
    } catch (err: any) {
      if (callback) callback(err, []);
    }
  }

  prepare(sql: string) {
    return new MockStatement(sql);
  }
}

export default {
  verbose: () => ({
    Database: class {
      db: MockDatabase;
      constructor(path: string) {
        this.db = new MockDatabase();
      }
      serialize(callback: () => void) {
        this.db.serialize(callback);
      }
      run(sql: string, params: any[] | any = [], callback?: (err: Error | null) => void) {
        this.db.run(sql, params, callback);
      }
      get(sql: string, params: any[] | any = [], callback?: (err: Error | null, row: any) => void) {
        this.db.get(sql, params, callback);
      }
      all(sql: string, params: any[] | any = [], callback?: (err: Error | null, rows: any[]) => void) {
        this.db.all(sql, params, callback);
      }
      prepare(sql: string) {
        return this.db.prepare(sql);
      }
    }
  })
};
