import { writeFile, mkdirSync, existsSync } from 'fs';
import os from 'os';
import path from 'path';

// Load variables from .env if present (mostly for local testing of this script)
import 'dotenv/config';

const dir = './src/environments';
if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
}

const targetPath = path.join(dir, 'environment.ts');

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL || ''}',
  supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY || ''}',
};
`;

console.log('Generating environment file...');

writeFile(targetPath, envConfigFile, (err) => {
    if (err) {
        console.error('Error writing environment file:', err);
        process.exit(1);
    } else {
        console.log(`Environment file generated at ${targetPath}`);
    }
});
