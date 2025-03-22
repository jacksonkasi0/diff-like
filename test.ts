// First, install the diff package if you haven't already:
// npm install diff

import { createTwoFilesPatch, applyPatch } from 'diff';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate a unified diff between the original and updated content,
 * and strip out the header so that only the patch instructions remain.
 */
function generateDiff(fileName: string, oldContent: string, newContent: string): string | undefined {
  let unifiedDiff = createTwoFilesPatch(fileName, fileName, oldContent, newContent);
  const patchHeaderEnd = `--- ${fileName}\n+++ ${fileName}\n`;
  const headerEndIndex = unifiedDiff.indexOf(patchHeaderEnd);
  if (headerEndIndex >= 0) {
    unifiedDiff = unifiedDiff.slice(headerEndIndex + patchHeaderEnd.length);
  }
  return unifiedDiff === '' ? undefined : unifiedDiff;
}

/**
 * Apply a patch (diff) to the original content to produce the full updated content.
 */
function applyDiff(oldContent: string, patch: string): string | false {
  // applyPatch returns the updated text or false if the patch fails
  return applyPatch(oldContent, patch);
}

// -----------------------------
// Sample usage with file input
// -----------------------------

const sampleFolder = join(__dirname, 'sample');
const fileName = 'first-post.md';
const originalContent = readFileSync(join(sampleFolder, 'original.txt'), 'utf-8');
const updatedContent = readFileSync(join(sampleFolder, 'updated.txt'), 'utf-8');

// Generate the diff that only contains changes
const diffPatch = generateDiff(fileName, originalContent, updatedContent);

if (diffPatch) {
  console.log('Generated Diff:\n', diffPatch);

  // Now, apply the diff to the original content.
  const patchedContent = applyDiff(originalContent, diffPatch);
  if (patchedContent !== false) {
    console.log('\nPatched (Updated) Full Content:\n', patchedContent);
  } else {
    console.log('Failed to apply patch.');
  }
} else {
  console.log('No changes detected.');
}
