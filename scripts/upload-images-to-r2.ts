/**
 * Script di migrazione: carica tutte le immagini dalla cartella "foto sito ricambi"
 * su Cloudflare R2 e genera un report JSON per l'associazione ai prodotti.
 *
 * Uso: npx tsx scripts/upload-images-to-r2.ts [--dry-run]
 *
 * Prerequisiti:
 *   npm install @aws-sdk/client-s3 dotenv
 *
 * Variabili d'ambiente richieste nel .env.local:
 *   R2_ACCOUNT_ID=...
 *   R2_ACCESS_KEY_ID=...
 *   R2_SECRET_ACCESS_KEY=...
 *   R2_BUCKET_NAME=shopnfc-images
 *   R2_PUBLIC_URL=https://images.shopnfc.it  (o il dominio R2 custom)
 */

import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  FOLDER_CATEGORY_MAP,
  EXCLUDED_FOLDERS,
  IMAGE_EXTENSIONS,
  generateR2Key,
} from "./image-folder-mapping";

// Carica .env.local
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

// Path della cartella sorgente - MODIFICA SE NECESSARIO
const SOURCE_DIR = path.resolve(
  __dirname,
  "../../foto sito ricambi/foto sito ricambi"
);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".tif": "image/tiff",
};

interface UploadResult {
  localPath: string;
  r2Key: string;
  r2Url: string;
  categoryId: number;
  categorySlug: string;
  filename: string;
  sizeMB: number;
}

interface UploadReport {
  timestamp: string;
  dryRun: boolean;
  sourceDir: string;
  totalImages: number;
  uploaded: number;
  failed: number;
  skipped: number;
  byCategory: Record<string, UploadResult[]>;
  errors: Array<{ file: string; error: string }>;
}

async function main() {
  console.log("=== Migrazione Immagini → Cloudflare R2 ===\n");
  console.log(`Sorgente: ${SOURCE_DIR}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Cartella sorgente non trovata: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Inizializza R2 client
  let r2: S3Client | null = null;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL || `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.dev`;

  if (!DRY_RUN) {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !bucketName) {
      console.error("❌ Variabili R2 mancanti nel .env.local");
      process.exit(1);
    }
    r2 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  const report: UploadReport = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    sourceDir: SOURCE_DIR,
    totalImages: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    byCategory: {},
    errors: [],
  };

  // Scansiona cartelle
  const folders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const folder of folders) {
    const folderName = folder.name;

    // Skip cartelle escluse
    if (EXCLUDED_FOLDERS.includes(folderName)) {
      console.log(`⏭️  Cartella esclusa: ${folderName}`);
      continue;
    }

    // Trova mapping categoria
    const mapping = FOLDER_CATEGORY_MAP.find((m) => m.folderName === folderName);
    if (!mapping) {
      console.warn(`⚠️  Nessun mapping per cartella: ${folderName}`);
      report.skipped++;
      continue;
    }

    console.log(`\n📁 ${folderName} → ${mapping.categorySlug} (ID: ${mapping.categoryId})`);

    const folderPath = path.join(SOURCE_DIR, folderName);
    const files = fs.readdirSync(folderPath).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });

    report.byCategory[mapping.categorySlug] = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const r2Key = generateR2Key(mapping.categorySlug, file);
      const r2Url = `${publicUrl}/${r2Key}`;
      const sizeMB = Math.round((stat.size / 1024 / 1024) * 100) / 100;

      report.totalImages++;

      if (DRY_RUN) {
        console.log(`  📷 [DRY] ${file} → ${r2Key} (${sizeMB} MB)`);
        const result: UploadResult = {
          localPath: filePath,
          r2Key,
          r2Url,
          categoryId: mapping.categoryId,
          categorySlug: mapping.categorySlug,
          filename: file,
          sizeMB,
        };
        report.byCategory[mapping.categorySlug].push(result);
        report.uploaded++;
      } else {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const contentType = MIME_TYPES[ext] || "application/octet-stream";

          await r2!.send(
            new PutObjectCommand({
              Bucket: bucketName!,
              Key: r2Key,
              Body: fileBuffer,
              ContentType: contentType,
            })
          );

          console.log(`  ✅ ${file} → ${r2Key}`);
          const result: UploadResult = {
            localPath: filePath,
            r2Key,
            r2Url,
            categoryId: mapping.categoryId,
            categorySlug: mapping.categorySlug,
            filename: file,
            sizeMB,
          };
          report.byCategory[mapping.categorySlug].push(result);
          report.uploaded++;
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`  ❌ ${file}: ${errorMsg}`);
          report.errors.push({ file: filePath, error: errorMsg });
          report.failed++;
        }
      }
    }

    console.log(`  → ${files.length} immagini processate`);
  }

  // Salva report
  const reportPath = path.join(__dirname, `r2-upload-report${DRY_RUN ? "-dry" : ""}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== RIEPILOGO ===");
  console.log(`Totale immagini: ${report.totalImages}`);
  console.log(`Caricate: ${report.uploaded}`);
  console.log(`Errori: ${report.failed}`);
  console.log(`Cartelle saltate: ${report.skipped}`);
  console.log(`\nReport salvato: ${reportPath}`);

  if (DRY_RUN) {
    console.log("\n💡 Esegui senza --dry-run per caricare effettivamente su R2.");
  }
}

main().catch(console.error);
