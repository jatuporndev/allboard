import {copyFile} from 'node:fs/promises';
await copyFile(new URL('../src/game/rules.js',import.meta.url),new URL('../functions/rules.js',import.meta.url));
