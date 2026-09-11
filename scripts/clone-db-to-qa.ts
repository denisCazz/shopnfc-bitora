/**
 * Clona il DB in DATABASE_URL verso `qa-<nomeDb>` (stesso server/porta).
 *
 * 1) Se installato `pg_dump`/`psql` (es. brew install libpq): clona in locale.
 * 2) Altrimenti esegue `scripts/clone-db-to-qa-docker.sh` (richiede Docker).
 *
 * Uso: `npm run db:clone-qa` oppure `npx tsx scripts/clone-db-to-qa.ts`
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDatabaseUrlOnly(): string {
  const envPath = path.join(root, ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const prefix = "DATABASE_URL=";
  for (const line of raw.split("\n")) {
    if (line.startsWith(prefix)) {
      let v = line.slice(prefix.length).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return v;
    }
  }
  throw new Error("DATABASE_URL non trovato in .env");
}

function hasLocalPgTools(): boolean {
  const a = spawnSync("which", ["pg_dump"], { encoding: "utf8" });
  const b = spawnSync("which", ["psql"], { encoding: "utf8" });
  return a.status === 0 && b.status === 0;
}

function toHttpUrl(dbUrl: string): URL {
  return new URL(dbUrl.replace(/^postgres:\/\//, "postgresql://"));
}

function toPgCliUrl(u: URL): string {
  return u.toString().replace(/^postgresql:/, "postgres:");
}

function pipeDumpToPsql(sourceUri: string, targetUri: string): void {
  const pgDump = spawnSync(
    "pg_dump",
    ["--clean", "--if-exists", "--no-owner", "--no-acl", sourceUri],
    { encoding: "buffer", maxBuffer: 512 * 1024 * 1024 }
  );
  if (pgDump.status !== 0) {
    throw new Error(
      `pg_dump fallito (${pgDump.status}): ${pgDump.stderr?.toString() || ""}`
    );
  }
  const psql = spawnSync("psql", [targetUri], {
    input: pgDump.stdout,
    encoding: "utf-8",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (psql.status !== 0) {
    throw new Error(
      `psql restore fallito (${psql.status}): ${psql.stderr || psql.stdout || ""}`
    );
  }
}

function runDockerClone(): number {
  const sh = path.join(root, "scripts", "clone-db-to-qa-docker.sh");
  const r = spawnSync("bash", [sh], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  return r.status ?? 1;
}

const sourceUrl = process.env.DATABASE_URL?.trim() || loadDatabaseUrlOnly();
process.env.DATABASE_URL = sourceUrl;

const src = toHttpUrl(sourceUrl);
const baseName =
  src.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "";
if (!baseName) {
  console.error("DATABASE_URL senza nome database nel path.");
  process.exit(1);
}

const newDbName = `qa-${baseName}`;
if (baseName.startsWith("qa-")) {
  console.error(
    "Il database sorgente inizia già con qa-. Usa il DATABASE_URL principale."
  );
  process.exit(1);
}

if (!hasLocalPgTools()) {
  console.info("pg_dump/psql non trovati: uso Docker (clone-db-to-qa-docker.sh).\n");
  process.exit(runDockerClone());
}

const adminUrl = new URL(src.toString());
adminUrl.pathname = "/postgres";
const adminConn = toPgCliUrl(adminUrl);

const exists = spawnSync(
  "psql",
  [
    adminConn,
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = '${newDbName.replace(/'/g, "''")}'`,
  ],
  { encoding: "utf-8" }
);
if (exists.status !== 0) {
  console.error(exists.stderr || exists.stdout || "psql errore");
  process.exit(1);
}
if (exists.stdout.trim() === "1") {
  console.error(
    `Il database "${newDbName}" esiste già. DROP DATABASE se vuoi ricreare.`
  );
  process.exit(1);
}

const createSqlPath = path.join(root, `.create-qa-${process.pid}.sql`);
fs.writeFileSync(
  createSqlPath,
  `CREATE DATABASE "${newDbName.replace(/"/g, '""')}";\n`,
  "utf8"
);

const created = spawnSync("psql", [adminConn, "-v", "ON_ERROR_STOP=1", "-f", createSqlPath], {
  encoding: "utf-8",
});
fs.unlinkSync(createSqlPath);

if (created.status !== 0) {
  console.error(created.stderr || created.stdout || "CREATE DATABASE fallita");
  process.exit(1);
}

const targetUrl = new URL(src.toString());
targetUrl.pathname = "/" + newDbName;
const targetConn = toPgCliUrl(targetUrl);

console.info(`Sorgente: ...@${src.hostname}:${src.port}/${baseName}`);
console.info(`Dest:     ...@${src.hostname}:${src.port}/${newDbName}`);
console.info("Copia (pg_dump → psql)...");

try {
  pipeDumpToPsql(
    sourceUrl.replace(/^postgres:/, "postgresql:"),
    targetConn.replace(/^postgres:/, "postgresql:")
  );
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

console.info(
  "\nFatto. Imposta DATABASE_URL sostituendo /" +
    baseName +
    " con /" +
    newDbName +
    " (stessa password)."
);
