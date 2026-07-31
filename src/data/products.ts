import helmetRed from "@/assets/p-helmet-red.jpg";
import helmetPink from "@/assets/p-helmet-pink.jpg";
import helmetBlack from "@/assets/p-helmet-black.jpg";
import derailleur from "@/assets/p-derailleur.jpg";
import crank from "@/assets/p-crank.jpg";
import suspension from "@/assets/p-suspension.jpg";
import stem from "@/assets/p-stem.jpg";
import wheel from "@/assets/p-wheel.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  image: string;
  badge?: string;
  category: string;
};

export const products: Product[] = [
  {
    id: "mtb-derailleur",
    name: "MTB Mountain Bike Mech Derailleur In Black Long",
    price: 280,
    rating: 5,
    image: derailleur,
    category: "Bicycle Parts",
  },
  {
    id: "narwheel-hub",
    name: "Narwheel Thru Axle Bicycle Wheel Holder For Vans, Trucks",
    price: 246,
    rating: 5,
    image: wheel,
    category: "Bike Accessories",
  },
  {
    id: "toronto-crank",
    name: "New Toronto H20 Hybrid Cycle With Carbon Frame",
    price: 269,
    rating: 5,
    image: crank,
    category: "Bicycle Parts",
  },
  {
    id: "strauss-helmet",
    name: "Strauss Veloguard Cycling Light Weight Helmet",
    price: 325.5,
    oldPrice: 350,
    rating: 5,
    image: helmetRed,
    badge: "-7%",
    category: "Rider Clothing",
  },
  {
    id: "bullseye-wheels",
    name: "Bullseye MonsterWheels 26 Inch Aluminum Bike Wheels",
    price: 304,
    oldPrice: 320,
    rating: 5,
    image: wheel,
    badge: "-5%",
    category: "Bicycle Parts",
  },
  {
    id: "fcc-racing",
    name: "FCC Racing CNC Rear Thru Axle For Mountain Bike",
    price: 240,
    rating: 5,
    image: suspension,
    badge: "Out of stock",
    category: "Mountain Bikes",
  },
  {
    id: "shimano-rr",
    name: "Shimano RR Mech RX812 GRX 11 Speed Shadow+ Single 42T",
    price: 320,
    rating: 4,
    image: derailleur,
    category: "Bicycle Parts",
  },
  {
    id: "giro-syntax",
    name: "Giro Syntax MIPS Helmet Matte Black, M",
    price: 221,
    oldPrice: 260,
    rating: 5,
    image: helmetBlack,
    badge: "-15%",
    category: "Rider Clothing",
  },
  {
    id: "mzpwjd-wheelset",
    name: "MZPWJD Bicycle Wheelset 26 Inch MTB Bike Wheels",
    price: 230,
    rating: 5,
    image: wheel,
    category: "Bicycle Parts",
  },
  {
    id: "calandis-stem",
    name: "CALANDIS Bike Short Stem Aluminum Alloy Road Bicycle",
    price: 270,
    rating: 5,
    image: stem,
    category: "Bicycle Parts",
  },
  {
    id: "djc-chainring",
    name: "DJC Bike GXP Chainring Adapter Spider To 104BCD",
    price: 352.5,
    oldPrice: 375,
    rating: 5,
    image: crank,
    badge: "-6%",
    category: "Bicycle Parts",
  },
  {
    id: "bell-avenue",
    name: "BELL Avenue Led Adult Road Bike Helmet - Matte Pink",
    price: 280,
    rating: 5,
    image: helmetPink,
    category: "Rider Clothing",
  },
];

export const gearProducts = products.slice(0, 8);
export const partProducts = [products[6], products[3], products[5], products[2]];

export const categories = [
  { name: "Balance Bikes", count: 10 },
  { name: "Monocycles", count: 10 },
  { name: "Police Bicycles", count: 15 },
  { name: "Track Bikes", count: 6 },
];

export const filterGroups = [
  { title: "Availability", options: ["In stock (19)", "Not available (1)"] },
  { title: "Color", options: ["Red (1)", "Black (1)"] },
  { title: "Material", options: ["Aluminum (1)", "Carbon (2)", "Steel (3)", "Titanium (2)"] },
  { title: "Size", options: ["Small (4)", "Medium (8)", "Large (4)", "Extra Large (3)"] },
  {
    title: "Brand",
    options: ["Cyclify (3)", "RoamZone (4)", "GoShop (2)", "MegaMod (3)", "QuickCart (3)"],
  },
  { title: "Selections", options: ["Discounted (5)", "New product (20)"] },
  { title: "Condition", options: ["New (10)", "Refurbished (3)", "Used (7)"] },
];

export const sideMenu = [
  "Shop",
  "Bicycles",
  "Bicycle Parts",
  "Bike Accessories",
  "Mountain Bikes",
  "Maintenance & Tools",
  "Rider Clothing",
];
