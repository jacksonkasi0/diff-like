import fuzzysort from 'fuzzysort';
import { data } from './json-data';

/**
 * Define the TreeNode interface.
 */
interface TreeNode {
  id: string;
  name: string;
  text_content: string;
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
 * Removes common command words like "extract" or "update" and splits on '&' or commas.
 */
function parsePromptColumns(prompt: string): string[] {
  prompt = prompt.replace(/extract|update/gi, '');
  const parts = prompt.split(/[,&]+/);
  return parts.map(part => part.trim()).filter(part => part !== '');
}

/**
 * For an unstructured row (i.e. without a header), search all its cells (recursively)
 * and pick the best matching cell for the given keyword using fuzzysort.
 *
 * Returns the FlatCell for the best match if found, or an empty FlatCell if no cell qualifies.
 */
function findBestMatchingCell(row: TreeNode, keyword: string): FlatCell {
  let bestMatch: { cell: TreeNode; score: number } | null = null;

  // Recursive function to search the row's subtree.
  function search(node: TreeNode) {
    // Use both the node's name and deep text for matching.
    const candidate = node.name || getDeepText(node);
    const result = fuzzysort.single(keyword, candidate);
    if (result) {
      // In fuzzysort, a higher (less negative) score is better.
      if (bestMatch === null || result.score > bestMatch.score) {
        bestMatch = { cell: node, score: result.score };
      }
    }
    if (node.children) {
      for (const child of node.children) {
        search(child);
      }
    }
  }

  search(row);

  if (bestMatch && bestMatch.score > -100) {
    const cell = bestMatch.cell;
    return {
      id: cell.id,
      name: cell.name,
      text_content: getDeepText(cell)
    };
  } else {
    return { id: '', name: '', text_content: '' };
  }
}

/**
 * Extract rows from unstructured JSON (without relying on a header).
 *
 * For each row node (node with name "Row"), for each prompt keyword,
 * this function scans all cells and uses fuzzy search to pick the best matching cell.
 * The row is then returned as an object mapping the keyword to the selected FlatCell.
 */
function extractRowsFromPromptUnstructured(root: TreeNode, prompt: string): any[] {
  const keywords = parsePromptColumns(prompt);
  const rows: any[] = [];

  // Assume that the rows are all nodes with name "Row" somewhere in the tree.
  // Here we recursively search for all nodes with name "Row" under root.
  function collectRows(node: TreeNode): TreeNode[] {
    let collected: TreeNode[] = [];
    if (node.name === "Row") {
      collected.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        collected = collected.concat(collectRows(child));
      }
    }
    return collected;
  }

  const rowNodes = collectRows(root);

  for (const row of rowNodes) {
    const rowObj: { [key: string]: FlatCell } = {};
    for (const keyword of keywords) {
      rowObj[keyword] = findBestMatchingCell(row, keyword);
    }
    rows.push(rowObj);
  }
  return rows;
}

/**
 * For testing, extract rows based on a given prompt from unstructured JSON.
 */
function runDynamicExtraction() {
  // Example prompt. Change as needed.
  const prompt = "extract Final Price (₹) & Quote Date & update with unit value";
  const extractedRows = extractRowsFromPromptUnstructured(data, prompt);
  console.log("Extracted Rows:", JSON.stringify(extractedRows, null, 2));
}

runDynamicExtraction();
