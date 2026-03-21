import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const rehypeWrapTables: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table') return;
      if (!parent || index === undefined) return;

      // Don't double-wrap if already inside a .table-wrapper
      const isAlreadyWrapped =
        parent.type === 'element' &&
        (parent as Element).properties?.className?.toString().includes('table-wrapper');
      if (isAlreadyWrapped) return;

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrapper'] },
        children: [node],
      };

      parent.children.splice(index, 1, wrapper);
    });
  };
};

export default rehypeWrapTables;
