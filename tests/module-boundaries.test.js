import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('index carrega um único entry point ES Module', () => {
    const scripts = [...read('index.html').matchAll(/<script\b([^>]*)>/gi)].map(match => match[1]);
    assert.equal(scripts.length, 1);
    assert.match(scripts[0], /type="module"/);
    assert.match(scripts[0], /src="js\/main\.js"/);
});

test('código não mantém alias global ou fallbacks de ordem', () => {
    const sources = fs.readdirSync(path.join(root, 'js'), { recursive: true })
        .filter(relativePath => relativePath.endsWith('.js'))
        .map(relativePath => read(path.join('js', relativePath)))
        .join('\n');
    assert.doesNotMatch(sources, /\ballCardsData\b/);
    assert.doesNotMatch(sources, /typeof\s+[A-Za-z_$]/);
});

test('fluxo principal não usa console ou diálogos nativos', () => {
    const sources = fs.readdirSync(path.join(root, 'js'), { recursive: true })
        .filter(relativePath => relativePath.endsWith('.js'))
        .map(relativePath => read(path.join('js', relativePath)))
        .join('\n');
    assert.doesNotMatch(sources, /console\./);
    assert.doesNotMatch(sources, /\b(?:alert|confirm)\s*\(/);
});
