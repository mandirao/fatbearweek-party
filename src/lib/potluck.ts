export const HOST = "Mandi";

export type PotluckItem = {
  n: number;
  name: string;
  desc: string;
  eff: string;
  host?: boolean;
};

export const POTLUCK_ITEMS: PotluckItem[] = [
  { n: 0, name: "Salmon Centerpiece", desc: "", eff: "👩‍🍳", host: true },
  { n: 1, name: "Salmon Dip + Accoutrements", desc: "Dip + crackers, dippin' veg, capers, etc.", eff: "👩‍🍳" },
  {
    n: 2,
    name: "Something Hearty from the Riverbank",
    desc: "A substantial savory casserole, grain dish, savory pie, etc.",
    eff: "👩‍🍳",
  },
  { n: 3, name: "Something Smoky", desc: "Smoked cheese, dip, trout, BBQ, etc.", eff: "👩‍🍳" },
  {
    n: 4,
    name: "Bear Food, But Make It Dinner",
    desc: "Vegetarian w/ squash, roots, mushrooms, grains, greens, etc.",
    eff: "👩‍🍳",
  },
  { n: 5, name: "Forest Floor Salad", desc: "Dark greens, nuts, berries, roasted veg, etc.", eff: "👩‍🍳" },
  { n: 6, name: "Hibernation Carb", desc: "Potatoes, rice, pasta, flatbread, stuffing, etc.", eff: "👩‍🍳" },
  {
    n: 7,
    name: "Something Pickled / Briny",
    desc: "Pickles, olives, capers, conservas, marinated things, etc.",
    eff: "🛒 / 👩‍🍳",
  },
  {
    n: 8,
    name: "Dark Fruit + Berry Forage",
    desc: "Berries, figs, plums, cherries, grapes, pomegranate, etc.",
    eff: "🛒 / 👩‍🍳",
  },
  {
    n: 9,
    name: "Something Nutty",
    desc: "Spiced nuts, nut brittle, smoked almonds, hazelnut fluff, etc",
    eff: "🛒 / 👩‍🍳",
  },
  { n: 10, name: "Tiny Tree Branches", desc: "Pretzel sticks. Literally.", eff: "🛒" },
  { n: 11, name: "Tree / Log / Forest Object", desc: "Chocolate logs, edible rocks, haribo berries, etc.", eff: "🤡" },
  { n: 12, name: "Salmon-Shaped Food", desc: "Goldfish, pastry, sandwiches, unnecessary molding.", eff: "🤡" },
  { n: 13, name: "Bear-Shaped Food", desc: "Cookies, Teddy Grahams, sandwiches, cheese cutouts, etc.", eff: "🤡" },
  { n: 14, name: "A Bag of Gummy Bears", desc: "That's the whole assignment.", eff: "🛒" },
  { n: 15, name: "Something Honeyed", desc: "Honeycomb, honey butter, cheese + honey, cake, etc.", eff: "🛒 / 👩‍🍳" },
  {
    n: 16,
    name: "Something Butterscotch / Caramel-Brown",
    desc: "Blondies, caramel corn, pudding, candy, etc.",
    eff: "🛒 / 👩‍🍳",
  },
  {
    n: 17,
    name: "Something Chocolatey + Brown-Bear Colored",
    desc: "Brownies, bark, cookies, truffles, mousse, etc.",
    eff: "🛒 / 👩‍🍳",
  },
  { n: 18, name: "Bear Bait", desc: "Snack mix, chips, cheesy things, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 19, name: "Brooks River", desc: "A fun nonalcoholic drink.", eff: "🛒 / 👩‍🍳" },
  { n: 20, name: "Wild Bear Card", desc: "Anything gloriously on-theme.", eff: "🛒 / 👩‍🍳 / 🤡" },
  { n: 21, name: "Dessert Centerpiece", desc: "", eff: "👩‍🍳", host: true },
  { n: 22, name: "Brooks River Support", desc: "Ice, sparkling water, and basic beverage support.", eff: "🛒" },
];

export type PotluckCourse = { label: string; ns: number[] };

export const POTLUCK_COURSES: PotluckCourse[] = [
  { label: "THE MEAL", ns: [0, 1, 2, 3, 4, 5, 6] },
  { label: "THE SPREAD", ns: [7, 8, 9, 18] },
  { label: "SOMETHING SWEET", ns: [21, 15, 16, 17] },
  { label: "TO POUR", ns: [19, 22] },
  { label: "COMMIT TO THE BIT", ns: [10, 11, 12, 13, 14, 20] },
];

export function findPotluckItem(n: number | null | undefined): PotluckItem | null {
  if (n == null) return null;
  return POTLUCK_ITEMS.find((i) => i.n === n) ?? null;
}
