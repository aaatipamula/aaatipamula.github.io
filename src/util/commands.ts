import { toggleTheme } from "./theme";
import { scrollToSection } from "./scroll";

export interface CommandPaletteAction {
  type: string;
  name: string;
  action: () => void;
}

export const DEFAULT_ACTIONS: CommandPaletteAction[] = [
  {
    type: "Theme",
    name: "Toggle Theme",
    action: () => toggleTheme(),
  },
  {
    type: "Page",
    name: "Reload",
    action: () => window.location.reload(),
  },
  {
    type: "Page",
    name: "Scroll To Top",
    action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
  },
  {
    type: "Page",
    name: "Scroll To Bottom",
    action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
  },
];

export function createScrollAction(location: NavLinkItem) {
  return {
    type: "Go To",
    name: location.name,
    action: () => scrollToSection(location.id),
  }
}
