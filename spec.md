# MVP WALLET — Google Wallet Redesign

## Current State
The app uses a dark-themed fintech design with deep navy/dark blue backgrounds, purple/teal gradients, and a neon aesthetic. The layout includes a balance card, quick action buttons, recent transactions, and a bottom navigation bar.

## Requested Changes (Diff)

### Add
- Light, clean Material You design system (Google Wallet style)
- Soft pastel card backgrounds (blue, green, purple tones)
- Google-style card visuals with subtle shadows and rounded corners
- Light background (white/light gray surface)
- Floating bottom navigation styled like Google's app shell
- Profile avatar circle in header (initials or icon)

### Modify
- Background: from dark navy gradient → white/light gray (#F8F9FA / #FFFFFF)
- Balance card: flat, colorful card style (like a Google Pay card) with bold white text on colored background
- Quick actions: pill/rounded icon buttons with subtle fill, Google-style (light blue tint icons)
- Transaction icons: colorful circle avatars on light surface
- Typography: clean sans-serif, high contrast dark text on light background
- Colors: Google Blue (#1A73E8), Google Green (#34A853), Google Red (#EA4335), Google Yellow (#FBBC04)
- Bottom nav: white background with subtle top border, active item in Google Blue
- Login screen: white card centered, Google blue button, clean minimal layout
- All screens: consistent light theme with card surfaces (white with shadow)
- Toaster: light theme

### Remove
- Dark background gradients
- Neon/glow effects
- Purple/teal color scheme

## Implementation Plan
1. Update index.css with light theme CSS variables (white/gray surfaces, dark text)
2. Rewrite App.tsx visual styles:
   - Login screen: white centered card, Google blue CTA
   - Home: white header with avatar, colorful payment card, icon action buttons, light transaction list
   - All sub-screens: white card surfaces, Google blue accents
   - Bottom nav: white background, Google blue active state
3. Keep all logic, hooks, data-ocid attributes, and backend integration untouched
