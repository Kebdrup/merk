import { exit } from "@tauri-apps/plugin-process";

export type Keybinding = {
  description: string;
  onKeyDown: () => void;
  key: string;
  modifier?: "ctrl" | "alt" | "shift" | "meta";
};

export const useKeybindings = (toggleSearch: () => void) => {
  const keybindings: Keybinding[] = [
    {
      key: "?",
      description: "Show help",
      onKeyDown: () => {
        console.log("Show help");
      },
    },
    {
      key: "d",
      description: "Scroll half a screen down",
      onKeyDown: () => {
        const root = document.getElementById("content");
        root?.scrollBy(0, window.innerHeight / 2);
      },
    },
    {
      key: "u",
      description: "Scroll half a screen up",
      onKeyDown: () => {
        const root = document.getElementById("content");
        root?.scrollBy(0, -window.innerHeight / 2);
      },
    },
    {
      key: "j",
      description: "Scroll half a screen up",
      onKeyDown: () => {
        const root = document.getElementById("content");
        root?.scrollBy(0, 16);
      },
    },
    {
      key: "k",
      description: "Scroll half a screen up",
      onKeyDown: () => {
        const root = document.getElementById("content");
        root?.scrollBy(0, -16);
      },
    },
    {
      key: "g",
      description: "Scroll half a screen up",
      onKeyDown: () => {
        const root = document.getElementById("content");
        root?.scrollTo(0, root.scrollHeight);
      },
    },
    {
      key: "G",
      description: "Scroll half a screen up",
      onKeyDown: () => {
        const root = document.getElementById("content");
        root?.scrollTo(0, 0);
      },
    },
    {
      key: "q",
      description: "Quit the application",
      onKeyDown: () => {
        exit(0);
      },
    },
    {
      key: "/",
      description: "Show search box",
      onKeyDown: () => {
        toggleSearch();
      },
    },
    {
      key: "Enter",
      description: "Show search box",
      onKeyDown: () => {
        console.log("Enter pressed");
      },
    },
  ];
  return keybindings;
}
