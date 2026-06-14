import { readTextFile } from "@tauri-apps/plugin-fs";
import { marked, RendererObject } from "marked";
import mermaid from "mermaid";

export type Heading = {
  depth: number;
  text: string;
};

export const getRenderer = (
  diagramIndex: number,
  headingIndex: number,
): RendererObject => {
  return {
    code({ text, lang }) {
      if (lang === "mermaid") {
        return `{{${diagramIndex++}}}`;
      } else {
        return `<pre>${text}</pre>`;
      }
    },
    heading({ text, depth }) {
      return `<h${depth} id="${headingIndex++}">${text}</h${depth}>`;
    },
  };
};

export const extractMermaidDiagram = async (text: string): Promise<string[]> => {
  const matches = [
    ...text.matchAll(/^ *```mermaid *\n([\s\S]*?)^ *```$/gm),
  ].map((match) => match[1]);
  const diagrams = await Promise.all(
    matches.map(async (match, index) => {
      const { svg } = await mermaid.render(`diagram-${index}`, match);
      return svg;
    }),
  );
  return diagrams;
};

export const extractHeadings = (markdownHTML: string): Heading[] => {
  const dom = new DOMParser().parseFromString(markdownHTML, "text/html");
  const headings = [...dom.querySelectorAll("h1, h2, h3, h4, h5, h6").values()].map(heading => {
    return ({
      depth: Number(heading.tagName.substring(1)),
      text: heading.textContent ?? '',
    })
  })
  return headings;
};

export const getMarkdownWithMermaid = async (filePath: string) => {
  const content = await readTextFile(filePath);
  const diagrams = await extractMermaidDiagram(content);
  marked.use({ renderer: getRenderer(0, 0) });
  let markdown = await marked.parse(content);
  const headings = extractHeadings(markdown);
  markdown = diagrams.reduce((markdown, diagram, index) => {
    return markdown.replace(`{{${index}}}`, diagram);
  }, markdown);
  return { headings, markdown };
};
