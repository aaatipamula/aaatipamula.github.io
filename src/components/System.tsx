import type { JSX } from 'preact';

import { useEffect, useRef, useState } from "preact/hooks";
import styles from './System.module.css'

interface Props {
  system: string;
  degrees: number;
}

const System = ({ system, degrees }: Props) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [showModal, setShowModal] = useState(false);

  const closeStyles: JSX.CSSProperties = {
    color: 'var(--red)',
    position: 'absolute',
    top: '1rem',
    right: '1rem',
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowModal(false);
    }
  }

  useEffect(() => {
    if (!canvas.current) return;

    const ctx = canvas.current.getContext('2d')!; // Should never be null
    ctx.reset() // Reset the canvas state
    // TODO: Change color to orange
    ctx.strokeStyle = "#1abc9c";

    // Setup for drawing L-System
    const stack: [number, number, number][] = [];
    let angle = -90;
    let x = canvas.current.width / 2;
    let y = canvas.current.height;

    // Count how many "F" commands (forward draw) are in the final string
    let fcount = (system.match(/F/g) || []).length;

    // Determine segment length based on canvas width/height and drawing complexity
    let len = Math.min(canvas.current.width, canvas.current.height) / (Math.log(fcount) + 1) ** 2;

    // Start drawing
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Draw the system created by the L-System
    for (const rule of system) {
      switch (rule) {
        case 'F':
          const rad = angle * Math.PI / 180
          x += len * Math.cos(rad);
          y += len * Math.sin(rad);

          ctx.lineTo(x, y);
          ctx.stroke();
          break;
        case '+':
          angle += degrees;
          break;
        case '-':
          angle -= degrees;
          break;
        case '[':
          stack.push([x, y, angle]);
          break;
        case ']':
          [x, y, angle] = stack.pop()!;
          ctx.moveTo(x, y);
          break;
        /*
        case '>':
          len *= CURRENT_RULE.len_factor;
          break;
        case '<':
          len /= CURRENT_RULE.len_factor;
          break;
        */
        case '|':
          angle += 180
        default: break;
      }
    }

    ctx.stroke();

  }, [system]);

  useEffect(() => {
    if (showModal) {
      window.addEventListener('keydown', handleKeydown);
    } else {
      window.removeEventListener('keydown', handleKeydown);
    }
  }, [showModal])

  return (
    <>
      <canvas
        onClick={() => setShowModal(true)}
        class={styles.painter}
        ref={canvas}
        height="200"
        width="200"
      >
      </canvas>
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          class={styles.modalBackdrop}
        >
          <div class={styles.textContainer}>
            <i style={closeStyles} class="bi bi-x-lg"></i>
            <h2>What is the <i style={{ color: 'var(--green)' }} class="bi bi-tree-fill var-green"></i>?</h2>
            <p>
              The tree looking structure you clicked on is an <a href="https://en.wikipedia.org/wiki/L-system">L-System</a>.
              An L-System is a <a href="https://en.wikipedia.org/wiki/Formal_grammar">formal grammar</a> containing
                a simple alphabet, rules, and an axiom to construct a larger string of symbols.
              L-Systems were first introduced and developed by <b>Aristid Lindenenmayer</b>, a theoretical biologist and botanist, in 1968.
            </p>
            <p>
              You may notice that the tree changes for each page.
              This is because a seeded <a href="https://en.wikipedia.org/wiki/Pseudorandom_number_generator">pseudo-random number generator</a> is 
                used to generate each tree based on the url.
            </p>
            <p>
              This tree represents my interest in formal grammars and programming languages.
              Its an interesting way to showcase how formal grammars can be simple but also incredibly complex
            </p>
            <p>
              The unrendered, stringified form of the tree is shown <b>below</b>. <i style={{ color: 'var(--yellow)' }} class="bi bi-caret-down-fill"></i>
            </p>
            <div class={styles.systemTextContainer}>
              {system}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default System;

