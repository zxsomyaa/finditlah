import {
  Wallet, KeyRound, Backpack, Smartphone, Laptop, Watch, Headphones, Plug,
  FileText, IdCard, Gem, Shirt, BookOpen, GlassWater, Umbrella, Glasses,
  Dumbbell, Package, Footprints, ShoppingBag,
} from "lucide-react";

/* Lost & Found categories — values match what is already stored in the `items` table. */
export const LOST_CATEGORIES = [
  "general", "electronics", "wallet", "keys", "bags", "documents", "jewellery",
  "clothing", "phone", "laptop", "watch", "id card", "passport", "student card",
  "books", "water bottle", "umbrella", "accessories", "sports items",
  "headphones", "charger", "others",
];

/** @param {string} value */
export const labelFor = (value) =>
  (value || "")
    .split(" ")
    .map((w) => (w === "id" ? "ID" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

/* Thrift categories — clothes and small items only. */
export const THRIFT_CATEGORIES = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "bags", label: "Bags" },
  { value: "accessories", label: "Accessories" },
  { value: "books", label: "Books" },
  { value: "gadgets", label: "Small gadgets" },
  { value: "others", label: "Others" },
];

export const THRIFT_CONDITIONS = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

/** @param {string} value */
export const thriftCategoryLabel = (value) =>
  THRIFT_CATEGORIES.find((c) => c.value === value)?.label || labelFor(value);

/** @param {string} value */
export const conditionLabel = (value) =>
  THRIFT_CONDITIONS.find((c) => c.value === value)?.label || labelFor(value);

const ICONS = {
  wallet: Wallet, keys: KeyRound, bags: Backpack, phone: Smartphone,
  electronics: Laptop, laptop: Laptop, watch: Watch, headphones: Headphones,
  charger: Plug, documents: FileText, passport: FileText, "id card": IdCard,
  "student card": IdCard, jewellery: Gem, clothing: Shirt, books: BookOpen,
  "water bottle": GlassWater, umbrella: Umbrella, accessories: Glasses,
  "sports items": Dumbbell,
  /* thrift */
  tops: Shirt, bottoms: Shirt, dresses: Shirt, outerwear: Shirt, shoes: Footprints,
  gadgets: Headphones,
};

/** @param {string} category */
export const iconFor = (category, kind = "l") =>
  ICONS[category] || (kind === "t" ? ShoppingBag : Package);
