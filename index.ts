// First, install the diff package if you haven't already:
// npm install diff

import { createTwoFilesPatch } from 'diff';

/**
 * Generates a unified diff between the original and updated content.
 * It strips out the header (file names and timestamps) so that only the changes remain.
 *
 * @param fileName - The name of the file being compared.
 * @param oldContent - The original file content.
 * @param newContent - The updated file content.
 * @returns A diff string or undefined if there are no changes.
 */
function diffFiles(fileName: string, oldContent: string, newContent: string): string | undefined {
  // Generate the full unified diff (includes header information)
  let unifiedDiff = createTwoFilesPatch(fileName, fileName, oldContent, newContent);

  // Define the header pattern that we want to remove.
  const patchHeaderEnd = `--- ${fileName}\n+++ ${fileName}\n`;
  const headerEndIndex = unifiedDiff.indexOf(patchHeaderEnd);

  // If the header is found, remove it to leave only the patch (diff) details.
  if (headerEndIndex >= 0) {
    unifiedDiff = unifiedDiff.slice(headerEndIndex + patchHeaderEnd.length);
  }

  // If the resulting diff is empty, return undefined (indicating no changes).
  return unifiedDiff === '' ? undefined : unifiedDiff;
}

// -----------------------------
// Sample data for testing
// -----------------------------

// Original content simulating the "What's Next?" section of the blog post.
const oldContent = `## What's Next?

xxxxxxxxx Here are some interesting topics we could explore:

1. The future of web development
2. Building amazing user experiences
3. Creating engaging content
4. Sharing knowledge with others`;

// New content where the heading "What's Next?" is updated to "what tommo"
const newContent = `## what tommo

xxxxxxxxx Here are some interesting topics we could explore:

1. The future of web development
2. Building amazing user experiences
3. Creating engaging content
4. Sharing knowledge with others`;

// Generate the diff for the file "first-post.md"
const diffResult = diffFiles('first-post.md', oldContent, newContent);

// Output the diff to the console
if (diffResult) {
  console.log('Generated Diff:\n', diffResult);
} else {
  console.log('No changes detected.');
}
