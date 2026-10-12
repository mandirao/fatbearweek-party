import { expect, test } from "vitest";
import { POTLUCK_ITEMS, isMyDish } from "../potluck";

const open = POTLUCK_ITEMS.find((i) => !i.host)!;
const hosted = POTLUCK_ITEMS.find((i) => i.host)!;

test("a visitor who isn't signed in owns no dishes, including unclaimed ones", () => {
  expect(isMyDish(open, null)).toBe(false);
  expect(isMyDish(open, undefined)).toBe(false);
});

test("a signed-in guest owns only the dish they claimed", () => {
  expect(isMyDish(open, { dishId: open.n })).toBe(true);
  expect(isMyDish(open, { dishId: null })).toBe(false);
  expect(isMyDish(open, { dishId: open.n + 1000 })).toBe(false);
});

test("the host's dishes are never a guest's", () => {
  expect(isMyDish(hosted, { dishId: hosted.n })).toBe(false);
});
