require('dotenv').config();

const apiKey = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

const connectionName = process.argv[2];

if (!connectionName) {
  console.error('Usage: node run.cjs <connectionName>');
  process.exit(1);
}

function isServiceSchema(schemaName) {
  return /^p[0-9a-f]{40,}$/i.test(schemaName) || schemaName.startsWith('pre_aggregations');
}

async function run() {
  const resp = await fetch(`${BASE_URL}/api/v1/connections/${connectionName}/schemas`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  console.log(`${resp.status} ${resp.statusText}`);

  const schemas = await resp.json();

  const filtered = schemas.filter(s => !isServiceSchema(s.schemaName));

  console.log(JSON.stringify(filtered, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});