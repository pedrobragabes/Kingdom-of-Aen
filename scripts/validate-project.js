#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD_COLLECTION } from '../js/data/cards.js';
import { ABILITY_DESCRIPTIONS, ROW_ICONS } from '../js/utils/helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => fs.existsSync(path.join(root, relativePath));

function collectAudioReferences() {
    const matches = [...read('js/core/audio.js').matchAll(/['"]([^'"]+\.(?:ogg|mp3))['"]/gi)];
    return [...new Set(matches.map(match => `audio/${match[1]}`))];
}

function report(kind, message, list) {
    console.log(`\n${kind}: ${message}`);
    list.forEach(item => console.log(`  - ${item}`));
}

const errors = [];
const warnings = [];
const cards = CARD_COLLECTION;
const ids = new Set();
const duplicateIds = [];
cards.forEach(card => {
    if (ids.has(card.id)) duplicateIds.push(card.id);
    ids.add(card.id);
});
if (duplicateIds.length) errors.push(`IDs duplicados em CARD_COLLECTION: ${duplicateIds.join(', ')}`);

const baseIds = new Set(cards.map(card => card.baseId).filter(Boolean));
const missingPartners = cards
    .filter(card => card.ability === 'bond_partner' && card.partner)
    .filter(card => !cards.some(candidate => candidate.name === card.partner || candidate.baseId === card.partner))
    .map(card => `${card.id} -> ${card.partner}`);
if (missingPartners.length) warnings.push(`Parceiros nao encontrados: ${missingPartners.join(', ')}`);

const missingAbilityDescriptions = [...new Set(cards
    .map(card => card.ability)
    .filter(ability => ability && ability !== 'none' && !ABILITY_DESCRIPTIONS[ability]))];
if (missingAbilityDescriptions.length) warnings.push(`Habilidades sem descricao: ${missingAbilityDescriptions.join(', ')}`);

const missingImages = cards.filter(card => card.img && !exists(card.img)).map(card => `${card.id}: ${card.img}`);
if (missingImages.length) warnings.push(`Imagens referenciadas ausentes (${missingImages.length}): ${missingImages.join(', ')}`);

const missingRowIcons = Object.values(ROW_ICONS).filter(iconPath => !exists(iconPath));
if (missingRowIcons.length) errors.push(`Icones de fileira ausentes: ${missingRowIcons.join(', ')}`);

const missingAudio = collectAudioReferences().filter(audioPath => !exists(audioPath));
if (missingAudio.length) errors.push(`Audios referenciados ausentes: ${missingAudio.join(', ')}`);

const domainFiles = ['js/domain/card.js', 'js/domain/game-state.js', 'js/core/ai.js'];
const domainDomAccess = domainFiles.filter(relativePath => /\b(?:document|dataset)\b/.test(read(relativePath)));
if (domainDomAccess.length) errors.push(`Dominio ou IA consultando DOM: ${domainDomAccess.join(', ')}`);

if (!cards.length) errors.push('CARD_COLLECTION esta vazia.');

console.log('Kingdom of Aen project validation');
console.log(`Cards: ${cards.length}`);
console.log(`Base IDs: ${baseIds.size}`);

if (errors.length) report('ERROS', 'corrigir antes de release', errors);
if (warnings.length) report('AVISOS', 'revisar para melhorar consistencia', warnings);
if (!errors.length && !warnings.length) console.log('\nOK: nenhum problema encontrado.');
if (errors.length || (strict && warnings.length)) process.exitCode = 1;
