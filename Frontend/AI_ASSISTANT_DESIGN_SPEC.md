# AI Assistant Section - Visual Design Specification

## Layout Structure

### Section 1: AI Assistant Info (AiAssistant)
```
┌─────────────────────────────────────────────────────────────┐
│                     BLACK BACKGROUND                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │              │  │              │  │              │     │
│  │  Feature 1   │  │   AI Image   │  │  Feature 3   │     │
│  │  Feature 2   │  │   (466x508)  │  │  Feature 4   │     │
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Section 2: AI Assistant Interactive (AIAssistantSection)
```
┌─────────────────────────────────────────────────────────────┐
│                     BLACK BACKGROUND                         │
│                                                              │
│              Meet Your AI Crypto Mentor                      │
│         Stellara AI combines advanced artificial...         │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │                      │  │                      │        │
│  │   Chat Interface     │  │   🎓 Learn & Grow    │        │
│  │   ┌──────────────┐   │  │   Guided lessons...  │        │
│  │   │ AI: Hello!   │   │  │                      │        │
│  │   └──────────────┘   │  │   💬 Ask Anything    │        │
│  │   ┌──────────────┐   │  │   24/7 AI support... │        │
│  │   │ User: Hi     │   │  │                      │        │
│  │   └──────────────┘   │  │   📊 Market Insights │        │
│  │                      │  │   Real-time analysis │        │
│  │   [Input field...]   │  │                      │        │
│  │                      │  │   🔗 Stellar Native  │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette

### Primary Colors
- **Background**: `#000000` (Black)
- **Brand Blue**: `#2228D6`
- **Text Primary**: `#FFFFFF` (White)
- **Text Secondary**: `rgba(255, 255, 255, 0.8)`
- **Text Muted**: `rgba(255, 255, 255, 0.6)`

### UI Elements
- **Border**: `rgba(255, 255, 255, 0.1)`
- **Background Overlay**: `rgba(0, 0, 0, 0.5)`
- **Card Background**: `rgba(255, 255, 255, 0.1)`
- **User Message**: `#2228D6`
- **AI Message**: `rgba(255, 255, 255, 0.1)`

## Typography

### Headings
- **H2 (Section Title)**: 
  - Desktop: `text-6xl` (3.75rem)
  - Tablet: `text-5xl` (3rem)
  - Mobile: `text-4xl` (2.25rem)
  - Weight: `font-bold`

- **H3 (Subsection)**: 
  - Size: `text-xl` (1.25rem)
  - Weight: `font-semibold`

### Body Text
- **Large**: `text-lg` (1.125rem) to `text-xl` (1.25rem)
- **Regular**: `text-base` (1rem)
- **Small**: `text-sm` (0.875rem)
- **Feature Description**: `text-[1.5rem]` (1.5rem)

## Spacing

### Section Padding
- Desktop: `py-32` (8rem)
- Tablet: `py-24` (6rem)
- Mobile: `py-20` (5rem)

### Container
- Max Width: `max-w-[1140px]` (71.25rem)
- Padding: `px-10` (desktop), `px-7` (tablet), `px-5` (mobile)

### Grid Gaps
- Large: `gap-16` (4rem)
- Medium: `gap-12` (3rem)
- Small: `gap-8` (2rem)

## Components

### Chat Interface
- **Height**: `600px`
- **Border Radius**: `rounded-2xl` (1rem)
- **Border**: `1px solid rgba(255, 255, 255, 0.1)`
- **Background**: `rgba(0, 0, 0, 0.5)` with backdrop blur

### Message Bubbles
- **Border Radius**: `rounded-2xl` (1rem)
- **Padding**: `px-4 py-3`
- **Max Width**: `80%`
- **User**: Right-aligned, brand blue background
- **AI**: Left-aligned, white/10 background

### Input Field
- **Border Radius**: `rounded-xl` (0.75rem)
- **Padding**: `px-4 py-3`
- **Border**: `1px solid rgba(255, 255, 255, 0.1)`
- **Focus**: Brand blue border

### Capability Cards
- **Icon Size**: `48x48px` (h-12 w-12)
- **Icon Background**: `rgba(255, 255, 255, 0.1)`
- **Border Radius**: `rounded-xl`
- **Gap**: `gap-4`

## Animations

### Scroll Animations (Framer Motion)
```typescript
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.6 }}
```

### Message Animations
```typescript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0 }}
```

### Typing Indicator
- 3 dots with bounce animation
- Staggered delay: 0ms, 150ms, 300ms

## Responsive Breakpoints

### Desktop (lg: 1024px+)
- Three-column layout for info section
- Two-column layout for interactive section
- Full-width chat interface

### Tablet (sm: 640px - lg: 1023px)
- Single column layout
- Centered content
- Reduced padding

### Mobile (< 640px)
- Single column layout
- Full-width components
- Minimal padding
- Stacked elements

## Accessibility

### Color Contrast
- Text on black: WCAG AA compliant
- Brand blue: Sufficient contrast for large text
- Border visibility: Subtle but visible

### Interactive Elements
- Keyboard navigation support
- Enter key to send messages
- Focus states on inputs
- Clear visual feedback

### Semantic HTML
- Proper heading hierarchy
- Semantic section tags
- ARIA labels where needed
- Alt text for images

## Performance Optimizations

### Images
- Next.js Image component
- Lazy loading
- Proper sizing attributes
- WebP format support

### Animations
- GPU-accelerated transforms
- Viewport-triggered animations
- Once-only animations to reduce re-renders
- Optimized Framer Motion variants

### State Management
- Zustand for minimal re-renders
- Selective state updates
- Memoized components where needed
