import fuzzysort from 'fuzzysort';
import { data } from './json-data';

/**
 * Define the TreeNode interface.
 */
interface TreeNode {
  id: string;
  name: string;
  text_content: string;
  path: string;
  children?: TreeNode[];
}

/**
 * Recursively extract non-empty text from a node or its descendants.
 */
function getDeepText(node: TreeNode): string {
  if (node.text_content && node.text_content.trim() !== "") {
    return node.text_content.trim();
  }
  if (node.children) {
    for (const child of node.children) {
      const text = getDeepText(child);
      if (text) return text;
    }
  }
  return "";
}

/**
 * Parse the prompt to extract column keywords.
 * This function removes common command words like "extract" or "update"
 * and then splits the remaining string using ampersand or commas.
 */
function parsePromptColumns(prompt: string): string[] {
  // Remove command words (case-insensitive)
  prompt = prompt.replace(/extract|update/gi, '');
  // Split on '&' or commas and trim extra whitespace
  const parts = prompt.split(/[,&]+/);
  return parts.map(part => part.trim()).filter(part => part !== '');
}

/**
 * Extract columns from the table based on the prompt using fuzzy search.
 * Returns an object mapping each column keyword (from the prompt)
 * to an array of the corresponding cell values from each row.
 */
function extractColumnsFromPrompt(root: TreeNode, prompt: string): { [key: string]: string[] } {
  if (!root.children) return {};
  
  // Find the "Table" node under the root (assumed to be "Data Table")
  const tableNode = root.children.find(child => child.name === "Table");
  if (!tableNode || !tableNode.children) return {};
  
  // Find the header row (node with name "Header")
  const headerRow = tableNode.children.find(child => child.name === "Header");
  if (!headerRow || !headerRow.children) return {};
  
  // Extract header texts from each cell of the header row
  const headerTexts: string[] = headerRow.children.map(cell => getDeepText(cell));
  
  // Parse the prompt to get target column keywords
  const columnsToExtract = parsePromptColumns(prompt);
  
  // For each keyword, use fuzzysort to find the best matching header cell
  const columnIndices: { [keyword: string]: number } = {};
  for (const keyword of columnsToExtract) {
    const results = fuzzysort.go(keyword, headerTexts, { limit: 1 });
    // Accept the match if its score is not too negative (score > -100)
    if (results.total > 0 && results[0].score > -100) {
      const index = headerTexts.indexOf(results[0].target);
      columnIndices[keyword] = index;
    } else {
      console.warn(`Column matching "${keyword}" not found.`);
    }
  }
  
  // Prepare the result object for each keyword.
  const extracted: { [key: string]: string[] } = {};
  for (const keyword in columnIndices) {
    extracted[keyword] = [];
  }
  
  // Iterate over each "Row" node in the table to extract cell values
  for (const row of tableNode.children) {
    if (row.name === "Row" && row.children) {
      for (const keyword in columnIndices) {
        const index = columnIndices[keyword];
        if (row.children.length > index) {
          const cell = row.children[index];
          const cellText = getDeepText(cell);
          extracted[keyword].push(cellText);
        }
      }
    }
  }
  
  return extracted;
}

/**
 * For testing, dynamically extract columns based on a given prompt.
 */
function runDynamicExtraction() {
  // Example prompt: Change this prompt to test different scenarios.
  const prompt = "extract Product/Service & Quote Date & update with unit value";
  const extractedData = extractColumnsFromPrompt(data, prompt);
  console.log("Extracted Data:", extractedData);
}

runDynamicExtraction();
