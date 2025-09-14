import type { TabPage } from 'src/types/content';
import type { TrieNode } from 'src/types/trie';

export function buildFileTree(pages: TabPage[]) {
  const root: TrieNode[] = [];

  for (const page of pages) {
    const parts = page.slug.split('/');
    parts.shift(); // Remove leading "/"
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let node = current.find((n) => n.name === part);

      if (!node) {
        node = { name: part };
        current.push(node);
      }

      if (i === parts.length - 1) {
        node.slug = page.slug; // mark as file
      } else {
        if (!node.children) node.children = [];
        current = node.children;
      }
    }
  }

  return root;
}

