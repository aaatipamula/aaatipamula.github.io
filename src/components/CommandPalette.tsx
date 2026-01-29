import type { CommandPaletteAction } from "@util/commands";

import { useEffect, useState, useRef, useMemo} from "react";
import { DEFAULT_ACTIONS, createScrollAction } from "@util/commands";

interface CommandPaletteProps {
  locations: NavLinkItem[];
}

function CommandPalette({ locations }: CommandPaletteProps) {
  const [overlayShowing, setOverlayShowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ACTIONS = [...DEFAULT_ACTIONS, ...locations.map(createScrollAction)];
  
  // Focus the input whenever the overlay becomes visible
  useEffect(() => {
    if (overlayShowing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [overlayShowing]);

  // Filter and sort locations by best match
  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) {
      return ACTIONS;
    }

    const query = searchQuery.toLowerCase();
    
    return ACTIONS
      .map(action => {
        const idLower = action.name.toLowerCase();
        let score = 0;
        
        // Exact match gets highest score
        if (idLower === query) {
          score = 1000;
        }
        // Starts with query gets high score
        else if (idLower.startsWith(query)) {
          score = 500;
        }
        // Contains query gets medium score
        else if (idLower.includes(query)) {
          score = 100;
        }
        // No match
        else {
          return null;
        }
        
        return { action, score };
      })
      .filter((item): item is { action: CommandPaletteAction; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .map(item => item.action);
  }, [ACTIONS, searchQuery]);

  function toggleOverlay() {
    setOverlayShowing(v => {
      // Clear search when closing
      if (v) {
        setSearchQuery("");
      }
      return !v;
    });
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "p") {
      event.preventDefault();
      toggleOverlay();
    } else if (event.code === "Escape") {
      setOverlayShowing(false);
    } else if (event.code === "Slash") {
      event.preventDefault();
      toggleOverlay();
    }
  }

  function handleInputKeydown(event: React.KeyboardEvent) {
    if (event.code === "Enter" && filteredActions.length > 0) {
      console.log(filteredActions)
      filteredActions.at(0)!.action();
      toggleOverlay();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleWindowKeydown);
    return () => window.removeEventListener("keydown", handleWindowKeydown);
  }, [])

  return (
    <div
      id="command-palette-container"
      className={"fixed bg-black/50 top-0 bottom-0 right-0 left-0 z-50 " + (overlayShowing ? "" : "hidden")}
    >
      <div className="bg-zinc-200 dark:bg-zinc-800 w-3/4 m-auto mt-20 p-4 rounded">
        <input 
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleInputKeydown}
          className="w-full bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded
                      outline-2 outline-zinc-300 focus:outline-zinc-500 dark:outline-zinc-700 dark:focus:outline-zinc-500" 
          type="text" 
          placeholder="Enter Command"
        />
        <div id="command-palette-options" className="p-2">
          {filteredActions.length > 0 ? (
            filteredActions.map(action => (
              <button 
                key={action.name}
                onClick={() => {action.action(); toggleOverlay();}}
                className="w-full text-left !transition-none hover:bg-zinc-300 first:text-accent-light dark:hover:bg-zinc-700 dark:first:text-accent-dark
                  outline-none focus:bg-zinc-300 dark:focus:bg-zinc-700
                  p-2 cursor-pointer dark:first:text-accent-dark"
              >
                <span className="text-zinc-500">{action.type}: </span>{action.name}
              </button>
            ))
          ) : (
            <div className="p-2 text-zinc-500">No matches found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette;

