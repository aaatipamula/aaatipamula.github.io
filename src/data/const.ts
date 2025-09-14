import type { LSystem } from '../util/lsystem';

const DEFAULT_PAGE = '/about';
const L_SYSTEM: LSystem = {
  axiom: "X",
  generations: 4,
  degrees: 15,
  rules: {
    "F": [
      [0.7, "FF"],
      [0.3, "F+F"],
    ],
    "X": [
      [0.7, "F[+X]F[-X]+X"],
      [0.3, "F-[[X]+X]+F[+FX]-X"],
    ]
  }
};

export { DEFAULT_PAGE, L_SYSTEM, }
