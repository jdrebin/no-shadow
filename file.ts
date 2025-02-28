// deno-lint-ignore-file no-unused-vars
import { a as g } from "./plugin.ts";
function a(a: number, d: number): void;
function a(a: number, d: number) {
  for (const a of [1]) {
    const a = 2;
    if (a) {
      const a = 3;
    } else {
      const a = 1;
      if (a) {
        const c = 4;
        const a = 3;
      } else {
        const b = 2;
        let a = 4;
        a = 5;
      }
    }
  }
}
g;
