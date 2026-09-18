/** Nafeesa Ali — Exact brand values extracted from nafeesaali.com */
export const BRAND = {
  // Colors
  colors: {
    bg:       "#09090b",       // dark obsidian background
    accent:   "#DA4D01",       // primary orange (rgba(218,77,1,0.9) → solid)
    text:     "#FAFAFA",       // headings on dark bg
    textDim:  "#A1A1AA",       // zinc-400 for subtext
    white:    "#FFFFFF",
    lightBg:  "#F9FAFB",       // for light-background template variants
    lightLine:"#E5E7EB",       // divider on light bg
  },

  // Typography
  fonts: {
    heading: "Space Grotesk",  // weight 700
    body:    "Inter",          // weight 500
  },

  // Contact & social
  contact: {
    website:   "https://nafeesaali.com",
    linkedin:  "https://linkedin.com/in/nafeesaali/",
    whatsapp:  "https://wa.me/923184274017",
    waDisplay: "+92 318 427 4017",
  },

  // Profile image (public-folder relative URL)
  profileImage: "/brand/profile.jpg",

  // Owner name
  ownerName: "Nafeesa Ali",
  tagline:   "AI • WordPress • Automation • SEO",
} as const;
