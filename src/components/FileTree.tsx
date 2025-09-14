import type { TrieNode } from 'src/types/trie';

import styles from './FileTree.module.css'

interface Props {
  node: TrieNode;
  activeTab: string;
  click: (slug: string) => void;
}

const FileTree = ({ node, activeTab, click }: Props) => {
  const isActive = node.slug && node.slug === activeTab;
  const isFolder = !!node.children;

  const handleFolderClick = (e: MouseEvent) => {
    e.stopPropagation();
    click(node.slug!);
  };

  return (
    <div class={styles.componentContainer}>
      {isFolder ? (
        <details open>
          <summary>
            <span 
              onClick={handleFolderClick}
              class={styles.folderSpan}
            >
              {node.name}
            </span>
          </summary>
          {node.children!.map((child) => (
            <FileTree
              click={click}
              key={child.name}
              node={child}
              activeTab={activeTab}
            />
          ))}
        </details>
      ) : (
        <button
          onClick={() => click(node.slug!)}
          class={`${styles.fileButton} ${isActive && styles.purpleText}`}
        >
          <i class="bi bi-markdown" style={{ marginRight: '0.5rem'}}></i>
          {node.name}.md
        </button>
      )}
    </div>
  );
}

export default FileTree;

