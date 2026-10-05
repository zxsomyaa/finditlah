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
  {
    id: "example-tumbler",
    example: true,
    type: "found",
    title: "Mint tumbler with palm tree gems",
    description: "Mint green tumbler with a straw lid and a rhinestone palm tree.",
    category: "water bottle",
    location_name: "East Coast Park",
    image_url: "/showcase/rhinestone-tumblers.jpg",
    created_date: daysAgo(2),
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
  {
    id: "example-backpack",
    example: true,
    title: "Floral canvas backpack",
    description: "Cream canvas with a pink and orange hibiscus print.",
    category: "bags",
    price: 28,
    condition: "good",
    size: "",
    location_name: "Punggol",
    image_url: "/showcase/floral-backpack.jpg",
    created_at: daysAgo(1),
  },
  {
    id: "example-pouch",
    example: true,
    title: "Pink embroidered palm pouch",
    description: "Woven pouch with a tassel zip pull.",
    category: "accessories",
    price: 16,
    condition: "like_new",
    size: "",
    location_name: "Bishan",
    image_url: "/showcase/pink-palm-pouch.jpg",
    created_at: daysAgo(1),
  },
  {
    id: "example-slides",
    example: true,
    title: "Denim flower slides",
    description: "Square-toe slides with a cut-out flower strap. New with tags.",
    category: "shoes",
    price: 22,
    condition: "like_new",
    size: "EU 38",
    location_name: "Clementi",
    image_url: "/showcase/denim-flower-slides.jpg",
    created_at: daysAgo(2),
  },
  {
    id: "example-watch",
    example: true,
    title: "Gold square watch",
    description: "Gold-tone link bracelet watch, comes with the box.",
    category: "accessories",
    price: 85,
    condition: "like_new",
    size: "",
    location_name: "Orchard",
    image_url: "/showcase/gold-square-watch.jpg",
    created_at: daysAgo(3),
  },
  {
    id: "example-dress",
    example: true,
    title: "Pink jewelled halter dress",
    description: "Pale pink mini dress with a crystal-trim halter neck.",
    category: "dresses",
    price: 38,
    condition: "like_new",
    size: "S",
    location_name: "Orchard",
    image_url: "/showcase/pink-halter-dress.jpg",
    created_at: daysAgo(0),
  },
  {
    id: "example-floral-pouch",
    example: true,
    title: "Floral embroidered pouch",
    description: "Cream canvas pouch with hand-embroidered flowers and a gold zip.",
    category: "bags",
    price: 14,
    condition: "like_new",
    size: "",
    location_name: "Tiong Bahru",
    image_url: "/showcase/floral-embroidered-pouch.jpg",
    created_at: daysAgo(1),
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

/** Look up an example Lost & Found post by id (for its detail page). @param {string} id */
export function findExampleItem(id) {
  const x = EXAMPLE_ITEMS.find((e) => e.id === id);
  return x ? { ...x, status: "active" } : null;
}

/** Look up an example thrift listing by id (for its detail page). @param {string} id */
export function findExampleListing(id) {
  const x = EXAMPLE_LISTINGS.find((e) => e.id === id);
  return x ? { ...x, status: "active", seller_name: "FindItLah" } : null;
}
