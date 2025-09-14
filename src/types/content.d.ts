import type { MarkdownInstance } from "astro";

export type MarkdownFrontmatter = {
  title: string;
  tags: string[];
}

export type MarkdownPage = MarkdownInstance<MarkdownFrontmatter>;

export type TabPage = {
  slug: string;
  title: string;
  content: string;
  lSystem: string;
  degrees: number;
};

