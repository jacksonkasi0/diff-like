import { createTwoFilesPatch } from 'diff';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Generates a unified diff between the original and updated content.
 * It strips out the header so that only the actual changes remain.
 */
function diffFiles(fileName: string, oldContent: string, newContent: string): string | undefined {
  let unifiedDiff = createTwoFilesPatch(fileName, fileName, oldContent, newContent);
  const patchHeaderEnd = `--- ${fileName}\n+++ ${fileName}\n`;
  const headerEndIndex = unifiedDiff.indexOf(patchHeaderEnd);
  if (headerEndIndex >= 0) {
    unifiedDiff = unifiedDiff.slice(headerEndIndex + patchHeaderEnd.length);
  }
  return unifiedDiff === '' ? undefined : unifiedDiff;
}

// Read sample contents from files in the sample/ folder
const sampleFolder = join(__dirname, 'sample');
const originalContent = readFileSync(join(sampleFolder, 'original.txt'), 'utf-8');
const updatedContent = readFileSync(join(sampleFolder, 'updated.txt'), 'utf-8');

const diffResult = diffFiles('first-post.md', originalContent, updatedContent);

if (diffResult) {
  console.log('Generated Diff:\n', diffResult);
} else {
  console.log('No changes detected.');
}
