# Design System — FS ECommerce

**Fecha:** 2026-04-03  
**Estado:** Aprobado

---

## Dirección estética

**Moderno / Energético — Gradientes oscuros + acentos luminosos**

Inspirado en startups de producto como Vercel y Linear. La tienda debe transmitir dinamismo y confianza digital. El catálogo vive sobre fondos claros para que los productos respiren; el hero y secciones destacadas usan fondos oscuros que anclan la identidad visual.

---

## Paleta de colores

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `white` / `gray-50` | Base de página |
| Surface | `white` + `shadow-sm` | Cards y paneles |
| Dark section | `slate-950 → slate-900` (gradiente) | Hero, banners, secciones alternas |
| **Acento** | `cyan-500` `#06b6d4` | CTAs, links activos, badges, highlights |
| Acento hover | `cyan-400` | Hover sobre botón primary |
| Texto primary | `slate-900` | Headings y body principal |
| Texto muted | `slate-500` | Subtítulos, metadatos |
| Borde | `slate-200` | Separadores, bordes de card |
| Error / Sale | `rose-500` | Badges de descuento, errores |
| Success / Stock | `emerald-500` | "En stock", confirmaciones |

**Token shadcn `--primary`:** cambiar de naranja ámbar a cyan.

---

## Tipografía

**Fuente:** [Satoshi](https://www.fontshare.com/fonts/satoshi) — geométrica moderna, Fontshare (libre).

Carga vía `next/font/local` con archivos descargados en `public/fonts/`.

| Rol | Peso | Clase Tailwind |
|-----|------|---------------|
| Display / Hero | 800 | `font-extrabold tracking-tight` |
| Heading H1-H2 | 700 | `font-bold tracking-tight` |
| Heading H3 | 600 | `font-semibold` |
| Body | 400 | `font-normal leading-relaxed` |
| UI / Labels | 500 | `font-medium text-sm` |

**Reemplaza:** Space Grotesk (violación del skill frontend-design — fuente sobre-usada en proyectos IA).

---

## Forma y Radio

- Cards: `rounded-2xl`
- Chips / Badges: `rounded-full`
- Botones: `rounded-xl` (no `rounded-lg`)
- Inputs: `rounded-xl`

---

## Componentes a actualizar

### `Button` atom
```
primary:   bg-cyan-500 text-slate-950 hover:bg-cyan-400   (← antes: indigo-600/white)
secondary: border-cyan-500 text-cyan-600 hover:bg-cyan-50
ghost:     sin cambio
icon:      sin cambio
```

### `NavLink` molecule
```
activo:  text-cyan-600 (← antes: indigo-600)
hover:   text-cyan-500
```

### `CartButton` badge
```
bg-cyan-500 (← antes: indigo-600)
```

### `ProductCard` — category chip
```
bg-cyan-50 text-cyan-700 (← antes: indigo-50/indigo-500)
```

### `ProductInfo` — category chip
```
bg-cyan-50 text-cyan-600 hover:bg-cyan-100 (← antes: indigo-50/indigo-600)
```

### `ProductFilters` — chip activo
```
bg-slate-950 text-white ring-cyan-500 (← antes: bg-gray-900)
```

### `globals.css` — token shadcn
```css
--primary: oklch(0.715 0.143 200);   /* cyan-500 */
--primary-foreground: oklch(0.148 0.004 228.8);  /* slate-950 */
```

---

## Lo que NO cambia

- Arquitectura Atomic Design
- Layout y grid system
- Tamaños, spacing, breakpoints responsivos
- Estructura de shadcn `Card`, `button` base

---

## Archivos a modificar

1. `frontend/public/fonts/` — agregar archivos Satoshi (woff2)
2. `frontend/app/layout.tsx` — cambiar Space Grotesk → Satoshi local font
3. `frontend/app/globals.css` — actualizar tokens `--primary`
4. `frontend/src/components/atoms/Button.tsx` — colores primary/secondary
5. `frontend/src/components/atoms/NavLink.tsx` — color activo
6. `frontend/src/components/molecules/CartButton.tsx` — badge color
7. `frontend/src/components/molecules/ProductCard.tsx` — category chip
8. `frontend/src/components/organisms/ProductInfo.tsx` — category chip
9. `frontend/src/components/organisms/ProductFilters.tsx` — chip activo
