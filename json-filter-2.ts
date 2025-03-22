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
 * Define the minimal cell structure interface.
 */
interface FlatCell {
  id: string;
  name: string;
  text_content: string;
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
  prompt = prompt.replace(/extract|update/gi, '');
  const parts = prompt.split(/[,&]+/);
  return parts.map(part => part.trim()).filter(part => part !== '');
}

/**
 * Extract row objects from the table based on the prompt using fuzzy search.
 * Each row is represented as an object where keys are the target column keywords
 * and values are FlatCell objects (with id, name, and text_content).
 */
function extractRowsFromPrompt(root: TreeNode, prompt: string): any[] {
  if (!root.children) return [];
  
  // Find the Table node (assumed to be "Data Table" -> "Table")
  const tableNode = root.children.find(child => child.name === "Table");
  if (!tableNode || !tableNode.children) return [];
  
  // Find the header row (with name "Header")
  const headerRow = tableNode.children.find(child => child.name === "Header");
  if (!headerRow || !headerRow.children) return [];
  
  // Extract header texts from each cell of the header row.
  const headerTexts: string[] = headerRow.children.map(cell => getDeepText(cell));
  
  // Parse the prompt to get target column keywords.
  const columnsToExtract = parsePromptColumns(prompt);
  
  // Use fuzzysort to find the best matching header cell for each keyword.
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
  
  // Create an array of rows. Each row is an object where each key (from the prompt)
  // maps to a FlatCell object.
  const rows: any[] = [];
  for (const row of tableNode.children) {
    if (row.name === "Row" && row.children) {
      const rowObj: { [key: string]: FlatCell } = {};
      for (const keyword in columnIndices) {
        const index = columnIndices[keyword];
        if (row.children.length > index) {
          const cell = row.children[index];
          rowObj[keyword] = {
            id: cell.id,
            name: cell.name,
            text_content: getDeepText(cell)
          };
        } else {
          // if the cell does not exist, provide an empty cell structure
          rowObj[keyword] = { id: '', name: '', text_content: '' };
        }
      }
      rows.push(rowObj);
    }
  }
  
  return rows;
}

/**
 * For testing, dynamically extract rows based on a given prompt and print the JSON.
 */
function runDynamicExtraction() {
  // Change the prompt as needed to test different scenarios.
  const prompt = "extract Product/Service & Quote Date & update with unit value";
  const extractedRows = extractRowsFromPrompt(data, prompt);
  console.log("Extracted Rows:", JSON.stringify(extractedRows, null, 2));
}

runDynamicExtraction();
