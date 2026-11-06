// node tools/build-data.mjs <people.json> <admin password>  ->  writes data.json
import { readFileSync, writeFileSync } from "node:fs";
import { buildData, validate } from "../lib.js";

const [file, pw] = process.argv.slice(2);
if (!file || !pw) { console.error("usage: node tools/build-data.mjs <people.json> <admin password>"); process.exit(1); }
const people = JSON.parse(readFileSync(file, "utf8"));
const problems = validate(people);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
const data = await buildData(people, pw);
writeFileSync(new URL("../data.json", import.meta.url), JSON.stringify(data));
console.log(`data.json written: ${people.length} people, ${Object.keys(data.idx).length} accepted answers`);
