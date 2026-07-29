const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const apiUrl = process.env.API_URL || process.env.NG_APP_API_URL || 'https://bulkwhatsappbackend.onrender.com/api/v1';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`[ENV CONFIG] Generated environment.prod.ts with apiUrl: ${apiUrl}`);
