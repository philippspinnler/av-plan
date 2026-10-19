import { readFileSync } from 'node:fs';
import { createDb } from '../src/lib/server/db';
import { importYouthCsv } from '../src/lib/server/import/youth-importer';

const [activitiesPath, classesPath] = process.argv.slice(2);
if (!activitiesPath || !classesPath) {
	console.error('Aufruf: npm run import:jugend -- <aktivitaeten.csv> <klassen.csv>');
	process.exit(1);
}
const db = createDb(process.env.DATABASE_PATH ?? 'data/app.db');
const report = importYouthCsv(db, readFileSync(activitiesPath, 'utf8'), readFileSync(classesPath, 'utf8'), { log: (s) => console.log(s) });
console.log(`\nImportiert: ${report.events} Termine, ${report.breaks} Pausen.`);
if (report.warnings.length) {
	console.log(`\nHinweise:`);
	for (const w of report.warnings) console.log(`  - ${w}`);
}
