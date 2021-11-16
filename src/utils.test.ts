import { test, expect } from "@jest/globals";
import { extendGenerator } from "./utils";

test("extendGenerator returns a valid generator", async () => {
  async function* gen() {
    yield 1;
  }

  const g2 = extendGenerator(gen());

  for await (const v of g2) {
    expect(v).toBe(1);
  }
});

test("AugmentedIterator.toArray works without arguments", async () => {
  async function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const gen2 = extendGenerator(gen());

  expect(gen2.toArray()).resolves.toEqual([1, 2, 3]);
});

test("AugmentedIterator.toArray does not restart the iteration", async () => {
  async function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const gen2 = extendGenerator(gen());

  await gen2.next();
  expect(gen2.toArray()).resolves.toEqual([2, 3]);
});
