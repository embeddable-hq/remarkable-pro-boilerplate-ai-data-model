#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dir = process.argv[2];

if (!dir) {
  console.error('Usage: node validate-models.cjs <models-directory>');
  process.exit(1);
}

if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.cube.yaml'));

if (files.length === 0) {
  console.error(`No .cube.yaml files found in ${dir}`);
  process.exit(1);
}

const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;
const TECH_SUFFIXES = /_id$|_ms$|_bak$|_aud$|_raw$/;
const TIME_TYPES = ['timestamp', 'timestamp without time zone', 'timestamp with time zone', 'date'];

let totalFailures = 0;
let totalWarnings = 0;

function pass(msg) { return { type: 'pass', msg }; }
function fail(msg) { ++totalFailures; return { type: 'fail', msg }; }
function warn(msg) { ++totalWarnings; return { type: 'warn', msg }; }

function validateCube(cube, fileName) {
  const results = [];
  const name = cube.name || '(unnamed)';

  // Structural completeness
  const measures = cube.measures || [];
  const dimensions = cube.dimensions || [];

  measures.length > 0
    ? results.push(pass('has at least one measure'))
    : results.push(fail('no measures defined'));

  const nonPkDimensions = dimensions.filter(d => !d.primary_key);
  nonPkDimensions.length > 0
    ? results.push(pass('has at least one dimension'))
    : results.push(fail('no non-primary-key dimensions defined'));

  const hasTimeDim = dimensions.some(d => d.type === 'time');
  const sqlSource = cube.sql || cube.sql_table || '';
  // Warn about missing time dimension only if it's likely needed (can't inspect DB columns from YAML alone)
  if (!hasTimeDim) {
    results.push(warn('no time dimension — verify whether a date/timestamp column exists in the source table'));
  } else {
    results.push(pass('has time dimension'));
  }

  // Descriptions
  cube.description
    ? results.push(pass('cube has description'))
    : results.push(fail('cube is missing description'));

  const measuresWithoutDesc = measures.filter(m => !m.description).map(m => m.name);
  measuresWithoutDesc.length === 0
    ? results.push(pass('all measures have descriptions'))
    : results.push(fail(`measures missing description: ${measuresWithoutDesc.join(', ')}`));

  const dimsWithoutDesc = dimensions.filter(d => !d.description).map(d => d.name);
  dimsWithoutDesc.length === 0
    ? results.push(pass('all dimensions have descriptions'))
    : results.push(fail(`dimensions missing description: ${dimsWithoutDesc.join(', ')}`));

  // Join correctness
  const joins = cube.joins || [];
  if (joins.length > 0) {
    const hasPk = dimensions.some(d => d.primary_key === true);
    hasPk
      ? results.push(pass('primary key declared (required for joins)'))
      : results.push(fail('cube has joins but no primary_key dimension declared'));

    const joinsWithoutRelationship = joins.filter(j => !j.relationship).map(j => j.name);
    joinsWithoutRelationship.length === 0
      ? results.push(pass('all joins have relationship type'))
      : results.push(fail(`joins missing relationship: ${joinsWithoutRelationship.join(', ')}`));

    const joinsWithoutSql = joins.filter(j => !j.sql).map(j => j.name);
    joinsWithoutSql.length === 0
      ? results.push(pass('all joins have sql condition'))
      : results.push(fail(`joins missing sql condition: ${joinsWithoutSql.join(', ')}`));
  }

  // RLS check
  if (cube.sql && !cube.sql_table) {
    const sqlStr = typeof cube.sql === 'string' ? cube.sql : JSON.stringify(cube.sql);
    sqlStr.toUpperCase().includes('WHERE')
      ? results.push(pass('sql uses WHERE clause (RLS present)'))
      : results.push(warn('sql: used without WHERE clause — verify RLS intent'));
  }

  // Naming: snake_case and tech suffixes
  const allNames = [
    { type: 'cube', name },
    ...measures.map(m => ({ type: 'measure', name: m.name })),
    ...dimensions.map(d => ({ type: 'dimension', name: d.name })),
  ];

  const nonSnake = allNames.filter(n => n.name && !SNAKE_CASE.test(n.name));
  nonSnake.length === 0
    ? results.push(pass('all names are snake_case'))
    : results.push(fail(`non-snake_case names: ${nonSnake.map(n => `${n.type}:${n.name}`).join(', ')}`));

  const techNames = allNames.filter(n => n.name && TECH_SUFFIXES.test(n.name) && !n.name.endsWith('_id') || (n.name && /_ms$|_bak$|_aud$|_raw$/.test(n.name)));
  techNames.length === 0
    ? results.push(pass('no technical suffix names'))
    : results.push(warn(`technical suffix names (consider renaming): ${techNames.map(n => n.name).join(', ')}`));

  // Data source
  if (cube.data_source !== undefined) {
    typeof cube.data_source === 'string' && cube.data_source.trim().length > 0
      ? results.push(pass(`data_source: "${cube.data_source}"`))
      : results.push(fail('data_source is present but empty or invalid'));
  }

  return results;
}

for (const file of files) {
  const filePath = path.join(dir, file);
  let parsed;

  try {
    parsed = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`\nValidating: ${file}`);
    console.log(`  ❌ YAML parse error: ${e.message}`);
    totalFailures++;
    continue;
  }

  const cubes = parsed?.cubes || [];
  if (cubes.length === 0) {
    console.log(`\nValidating: ${file}`);
    console.log('  ❌ no cubes found in file');
    totalFailures++;
    continue;
  }

  console.log(`\nValidating: ${file}`);
  for (const cube of cubes) {
    if (cubes.length > 1) console.log(`  Cube: ${cube.name}`);
    const results = validateCube(cube, file);
    for (const r of results) {
      if (r.type === 'pass') console.log(`  ✅ ${r.msg}`);
      else if (r.type === 'fail') console.log(`  ❌ ${r.msg}`);
      else console.log(`  ⚠️  ${r.msg}`);
    }
  }
}

console.log(`\nSummary: ${files.length} file(s) — ${totalFailures} failure(s), ${totalWarnings} warning(s)`);
process.exit(totalFailures > 0 ? 1 : 0);
