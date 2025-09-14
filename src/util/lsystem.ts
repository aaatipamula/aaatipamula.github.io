import { seededRandom } from "./random";

export type LSystem = {
  axiom: string;
  rules: Record<string, [number, string][]>;
  generations: number;
  degrees: number;
};

export function generateSystem(seed: string, {axiom, rules, generations}: LSystem) {
  const rand = seededRandom(seed);

  let initial_string = axiom;
  let next_string = '';
  for (let i = 0; i < generations; i++) {
    for (let letter of initial_string) {
      const options = rules[letter];
      if (options) {
        let r = rand();
        let cumulative = 0;
        for (let [prob, replacement] of options) {
          cumulative += prob;
          if (r <= cumulative) {
            next_string += replacement;
            break;
          }
        }
      } else {
        next_string += letter
      }
    }
    initial_string = next_string;
    next_string = '';
  }

  return initial_string;
}
