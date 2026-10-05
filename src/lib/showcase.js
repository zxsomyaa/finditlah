/*
 * Example posts shown while the site is still filling up.
 * They're tagged "Example", can't be opened, claimed or bought, and drop out
 * automatically once there are enough real posts (see withExamples below).
 *
 * To add more: put a photo in /public/showcase and add an entry here.
 */
const now = Date.now();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

export const EXAMPLE_ITEMS = [
  {
    id: "example-wallet",
    example: true,
    type: "found",
    title: "Black leather mini wallet",
    description: "Small black wallet with a gold clasp.",
    category: "wallet",
    location_name: "Orchard MRT",
    image_url: "/showcase/black-leather-wallet.jpg",
    created_date: daysAgo(0),
  },
  {
    id: "example-keys",
    example: true,
    type: "lost",
    title: "Keys on a pink card holder",
    description: "House key on a brown strap with charms and a pink card holder.",
    category: "keys",
    location_name: "Bugis Junction",
    image_url: "/showcase/keys-pink-card-holder.jpg",
    created_date: daysAgo(1),
  },
];

export const EXAMPLE_LISTINGS = [
  {
    id: "example-sneakers",
    example: true,
    title: "Suede sneakers",
    description: "Taupe suede with a gum sole.",
    category: "shoes",
    price: 45,
    condition: "like_new",
    size: "EU 38",
    location_name: "Tampines",
    image_url: "/showcase/suede-sneakers.jpg",
    created_at: daysAgo(0),
  },
];

/**
 * Add example posts after the real ones until there are `min` cards.
 * @template T
 * @param {T[]} real
 * @param {T[]} examples
 * @param {number} [min]
 * @returns {T[]}
 */
export function withExamples(real, examples, min = 6) {
  if (real.length >= min) return real;
  return [...real, ...examples.slice(0, min - real.length)];
}
