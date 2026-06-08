import { useEffect, useRef, useState } from "react";
import "./App.css";
import { getMatches } from "@tauri-apps/plugin-cli";
import { UnwatchFn, watchImmediate } from "@tauri-apps/plugin-fs";
import { resolve } from "@tauri-apps/api/path";
import DOMpurify from "dompurify";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useKeybindings } from "./useKeybindings";
import { getMarkdownWithMermaid, Heading } from "./markdowUtils";

function App() {
  const [content, setContent] = useState<{
    headings: Heading[];
    markdown: string;
  }>({ headings: [], markdown: "" });
  const mainRef = useRef<HTMLElement>(null);
  const [showSearch, setShowSearch] = useState(false);

  const keybindings = useKeybindings(() => setShowSearch((show) => !show));

  useEffect(() => {
    const processKeybind = (event: KeyboardEvent) => {
      const keybind = keybindings.find((keybinding) => {
        if (keybinding.key != event.key) {
          return false;
        }
        return true;
      });
      if (keybind) {
        keybind.onKeyDown();
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", processKeybind);
    let unwatch: UnwatchFn;
    (async () => {
      try {
        const matches = await getMatches();
        const input = matches.args.input?.value as string | null;
        if (input) {
          const path = await resolve(input);
          await getCurrentWindow().setTitle(path);

          // Setup watcher
          unwatch = await watchImmediate(path, async (event) => {
            if (
              typeof event.type === "object" &&
              "modify" in event.type &&
              event.type.modify.kind === "data"
            ) {
              // Render on modify
              const markdown = await getMarkdownWithMermaid(path);
              setContent(markdown);
            }
          });

          // Do initial render
          const markdown = await getMarkdownWithMermaid(path);
          setContent(markdown);
        }
      } catch (e) {
        console.error("Failed to parse CLI arguments:", e);
      }
    })();

    return () => {
      unwatch?.();
      document.removeEventListener("keydown", processKeybind);
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
        id="content"
        ref={mainRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{
          __html: DOMpurify.sanitize(content.markdown),
        }}
      />
      {showSearch && (
        <div className="searchBox">
          <p>Search:</p>
          <input autoFocus />
        </div>
      )}
    </>
  );
}

export default App;
