# Design Brief

## Direction

Signal — a warm ink-teal chat workspace where the current user's voice burns coral and everyone else stays cool teal.

## Tone

Refined dark productivity: restrained decoration, high information density, one confident warm accent so "my message" reads instantly.

## Differentiation

The asymmetric bubble tail plus coral-vs-teal voice coding means you can read an entire thread's who-said-what from across the room, without reading a word.

## Color Palette

| Token      | OKLCH         | Role                                            |
| ---------- | ------------- | ----------------------------------------------- |
| background | 0.17 0.02 205 | Deep warm ink-teal app canvas (dark mode)       |
| foreground | 0.94 0.008 210 | Primary text, near-white with cool cast       |
| card       | 0.21 0.022 205 | Conversation surface, header, composer          |
| primary    | 0.68 0.18 30  | Signal coral — current user's own messages/CTA  |
| accent     | 0.72 0.12 190 | Presence teal — online dots, active room, links |
| muted      | 0.26 0.024 205 | Sidebar rows, secondary surfaces, dividers      |
| success    | 0.72 0.16 155 | Online presence dot                             |
| destructive| 0.62 0.2 25   | Leave room, errors                              |

## Typography

- Display: Space Grotesk — wordmark, room names, section headings, UI labels
- Body: DM Sans — message text, descriptions, form inputs
- Mono: Geist Mono — timestamps, member counts, read-receipt metadata
- Scale: hero `text-3xl font-bold tracking-tight`, h2 `text-xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Flat layered surfaces with one soft shadow tier: app canvas darkest, sidebar recessed, cards and composer raised by `shadow-elevated`; bubbles use no shadow so color alone carries identity.

## Structural Zones

| Zone          | Background        | Border         | Notes                                                    |
| ------------- | ----------------- | -------------- | -------------------------------------------------------- |
| App header    | `bg-card`         | `border-b`     | Wordmark, signed-in user + avatar, sign-out              |
| Room sidebar  | `bg-sidebar`      | `border-r`     | Search, My Rooms, All Rooms, presence dots               |
| Room header   | `bg-card`         | `border-b`     | Room name, member count, stacked avatars, typing status  |
| Message thread| `bg-background` + `surface-grid` | — | Day separators, own coral bubbles, other teal-slate bubbles |
| Composer      | `bg-card`         | `border-t`     | Rounded input, emoji trigger, coral send button          |
| Empty states  | `bg-muted/30`     | dashed `border`| Prompt to send the first message                         |

## Spacing & Rhythm

Sidebar rows sit on a tight 8px rhythm; the thread breathes at 16–24px between message groups and 4px within a group; page gutters 16px mobile / 24px desktop.

## Component Patterns

- Buttons: pill `rounded-full` for send, `rounded-lg` for secondary; coral fill for primary action, ghost + `bg-secondary` for the rest; hover lifts to `brightness-110`
- Cards: `rounded-2xl` `bg-card` `border-border` `shadow-elevated`; room rows are `rounded-xl` and gain `bg-sidebar-accent` when active
- Badges: pill `rounded-full` for member counts and day separators; presence dot is an 8px `bg-success` circle with a `presence-ring` halo
- Bubbles: own = solid `bg-primary text-primary-foreground` `bubble-own`; other = `bg-secondary text-secondary-foreground` `bubble-other` with sender name in `text-accent`

## Motion

- Entrance: thread messages fade-and-rise 8px over 180ms, staggered 30ms for the initial history load
- Hover: room rows and buttons transition `transition-smooth` background/brightness over 200ms
- Decorative: typing indicator dots bounce on a 1.2s loop; presence dot pulses opacity on a 2.4s loop; new message scales in at 0.97 → 1

## Constraints

- Dark mode is the primary intended experience; light mode is a cool paper companion, never a plain inversion
- Never use raw hex, `rgb()`, or arbitrary Tailwind color classes — semantic tokens only
- Coral is reserved for the current user and the single primary action per view; teal is reserved for presence and active state
- No gradients on surfaces, no glow/neon shadows; depth comes from layered surfaces and one shadow tier
- Message bubbles carry no shadow — identity comes from color and the asymmetric tail corner

## Signature Detail

The asymmetric bubble tail paired with strict coral/teal voice coding — a two-color conversation grammar that makes authorship legible at a glance.
