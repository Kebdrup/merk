import { useEffect, useRef, useState } from "react";
import "./App.css";
import { getMatches } from "@tauri-apps/plugin-cli";
import { readTextFile, UnwatchFn, watchImmediate } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { join, isAbsolute } from "@tauri-apps/api/path";
import mermaid from "mermaid";
import { marked, RendererObject } from "marked";
import DOMpurify from "dompurify";

type Heading = {
  depth: number;
  text: string;
};

const getRenderer = (
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

const extractMermaidDiagram = async (text: string): Promise<string[]> => {
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

const extractHeadings = (text: string): Heading[] => {
  const headings = [...text.matchAll(/(#+) (.+)/g)].map((match) => ({
    depth: match[1].length,
    text: match[2],
  }));
  return headings;
};

const getMarkdownWithMermaid = async (filePath: string) => {
  const content = await readTextFile(filePath);
  const diagrams = await extractMermaidDiagram(content);
  const headings = extractHeadings(content);
  marked.use({ renderer: getRenderer(0, 0) });
  let markdown = await marked.parse(content);
  markdown = diagrams.reduce((markdown, diagram, index) => {
    return markdown.replace(`{{${index}}}`, diagram);
  }, markdown);
  return { headings, markdown };
};

function App() {
  const [content, setContent] = useState<{
    headings: Heading[];
    markdown: string;
  }>({ headings: [], markdown: "" });
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });

    let unwatch: UnwatchFn;
    (async () => {
      try {
        const matches = await getMatches();
        const input = matches.args.input?.value as string | null;
        if (input) {
          const absolute = await isAbsolute(input);
          const filePath = absolute
            ? input
            : await join(await invoke<string>("get_cwd"), input);

          // Setup watcher
          unwatch = await watchImmediate(input, async (event) => {
            if (
              typeof event.type === "object" &&
              "modify" in event.type &&
              event.type.modify.kind === "data"
            ) {
              const markdown = await getMarkdownWithMermaid(filePath);
              setContent(markdown);
            }
          });

          // Do initial render
          const markdown = await getMarkdownWithMermaid(filePath);
          setContent(markdown);
        }
      } catch (e) {
        console.error("Failed to parse CLI arguments:", e);
      }
    })();

    return () => {
      unwatch?.();
    };
  }, []);

  return (
    <>
      <div id="overview">
        {content.headings.map((heading, index) => (
          <a
            className={`depth-${heading.depth}`}
            href={`#${index}`}
            key={index}
          >
            {heading.text}
          </a>
        ))}
      </div>
      <main
        ref={mainRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{
          __html: DOMpurify.sanitize(content.markdown),
        }}
      />
    </>
  );
}

export default App;
