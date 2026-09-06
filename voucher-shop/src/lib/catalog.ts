export const CATEGORIES = [
  "Shopping",
  "Streaming",
  "Gaming",
  "Apps",
  "Delivery",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CardTheme =
  | "amazon"
  | "netflix"
  | "steam"
  | "spotify"
  | "google"
  | "apple"
  | "xbox"
  | "grab"
  | "shopee";

export type CatalogProduct = {
  slug: string;
  brand: string;
  name: string;
  category: Category;
  usdValue: number;
  description: string;
  theme: CardTheme;
  redeemUrl: string;
  redeemSteps: string[];
};

export const CATALOG: CatalogProduct[] = [
  {
    slug: "amazon",
    brand: "Amazon",
    name: "Amazon Gift Card",
    category: "Shopping",
    usdValue: 25,
    description:
      "Use this Amazon gift card to shop millions of products on Amazon. Delivered instantly after successful payment.",
    theme: "amazon",
    redeemUrl: "https://www.amazon.com/redeem",
    redeemSteps: [
      "Go to amazon.com/redeem",
      "Sign in to your Amazon account",
      "Enter your voucher code",
      "The balance is added to your Amazon account",
    ],
  },
  {
    slug: "netflix",
    brand: "Netflix",
    name: "Netflix Gift Card",
    category: "Streaming",
    usdValue: 15,
    description:
      "Watch TV shows and movies on Netflix. Delivered instantly after successful payment.",
    theme: "netflix",
    redeemUrl: "https://www.netflix.com/redeem",
    redeemSteps: [
      "Open Netflix and sign in",
      "Go to Account, then Gift Card",
      "Enter your voucher code",
      "Your membership credit is applied",
    ],
  },
  {
    slug: "steam",
    brand: "Steam",
    name: "Steam Gift Card",
    category: "Gaming",
    usdValue: 20,
    description:
      "Add funds to your Steam Wallet and buy games instantly after payment.",
    theme: "steam",
    redeemUrl: "https://store.steampowered.com/account/redeemwalletcode",
    redeemSteps: [
      "Open the Steam client or store",
      "Go to redeem a wallet code",
      "Enter your voucher code",
      "The credit appears in your Steam Wallet",
    ],
  },
  {
    slug: "spotify",
    brand: "Spotify",
    name: "Spotify Gift Card",
    category: "Streaming",
    usdValue: 10,
    description:
      "Credit for Spotify Premium. Delivered instantly after successful payment.",
    theme: "spotify",
    redeemUrl: "https://www.spotify.com/redeem",
    redeemSteps: [
      "Go to spotify.com/redeem",
      "Sign in to Spotify",
      "Enter your voucher code",
      "Premium credit is added to your account",
    ],
  },
  {
    slug: "google-play",
    brand: "Google Play",
    name: "Google Play Gift Card",
    category: "Apps",
    usdValue: 25,
    description:
      "Spend on apps, games, and more in Google Play. Delivered instantly after payment.",
    theme: "google",
    redeemUrl: "https://play.google.com/redeem",
    redeemSteps: [
      "Open Google Play",
      "Tap Profile, then Payments & subscriptions",
      "Choose Redeem gift code",
      "Enter your voucher code",
    ],
  },
  {
    slug: "apple",
    brand: "Apple",
    name: "App Store Gift Card",
    category: "Apps",
    usdValue: 25,
    description:
      "Use this App Store & iTunes credit on Apple services and apps.",
    theme: "apple",
    redeemUrl: "https://www.apple.com/redeem",
    redeemSteps: [
      "Open the App Store on your Apple device",
      "Tap your profile, then Redeem Gift Card",
      "Enter your voucher code",
      "Credit is added to your Apple ID",
    ],
  },
  {
    slug: "xbox",
    brand: "Xbox",
    name: "Xbox Gift Card",
    category: "Gaming",
    usdValue: 15,
    description:
      "Add Microsoft account credit for games and Xbox subscriptions.",
    theme: "xbox",
    redeemUrl: "https://www.microsoft.com/redeem",
    redeemSteps: [
      "Go to microsoft.com/redeem",
      "Sign in with your Microsoft account",
      "Enter your voucher code",
      "Credit is added to your Microsoft account",
    ],
  },
  {
    slug: "grab",
    brand: "Grab",
    name: "Grab Gift Card",
    category: "Delivery",
    usdValue: 10,
    description:
      "Use Grab credits for rides and food delivery. Delivered instantly after payment.",
    theme: "grab",
    redeemUrl: "https://www.grab.com",
    redeemSteps: [
      "Open the Grab app",
      "Go to Account, then Rewards or Payment",
      "Choose redeem a promo or gift code",
      "Enter your voucher code",
    ],
  },
  {
    slug: "shopee",
    brand: "Shopee",
    name: "Shopee Gift Card",
    category: "Shopping",
    usdValue: 20,
    description:
      "Shop on Shopee with this digital voucher. Delivered instantly after payment.",
    theme: "shopee",
    redeemUrl: "https://shopee.com",
    redeemSteps: [
      "Open the Shopee app",
      "Go to Me, then My Vouchers",
      "Tap input code",
      "Enter your voucher code and use it at checkout",
    ],
  },
];

export const POPULAR_SLUGS = ["amazon", "netflix", "steam"] as const;

export function catalogBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((item) => item.slug === slug);
}
