import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('dialogs e regiões de status possuem semântica acessível', () => {
    const html = read('index.html');
    assert.match(html, /id="mulligan-overlay"[^>]+role="dialog"[^>]+aria-modal="true"/);
    assert.match(html, /id="game-over-modal"[^>]+role="dialog"[^>]+aria-modal="true"/);
    assert.match(html, /id="game-status"[^>]+aria-live="polite"/);
    assert.match(html, /id="error-status"[^>]+aria-live="assertive"/);
});

test('cartas e fileiras oferecem ativação sem drag and drop', () => {
    const render = read('js/ui/render.js');
    const interactions = read('js/ui/interactions.js');
    assert.match(render, /createElement\('button'\)/);
    assert.match(interactions, /event\.key === 'Enter'/);
    assert.match(interactions, /event\.key === ' '/);
    assert.match(interactions, /activateHandCard/);
});
