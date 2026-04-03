---
name: flat-code
description: "Detects and eliminates the Arrow Anti-Pattern (deep nesting of if/for/else). Apply when reviewing or writing code with more than 2 levels of indentation. Enforces guard clauses, early returns, and flat structure."
---

# Flat Code — Anti Arrow-Pattern Skill

## El Problema: Arrow Anti-Pattern

El código "flecha" (Arrow Anti-Pattern) ocurre cuando la lógica válida queda enterrada bajo capas de condiciones anidadas, empujando el código cada vez más a la derecha:

```js
// ❌ Arrow code — el happy path está al fondo de 4 niveles
function process(rows) {
  for (const row of rows) {
    if (row.id) {
      const existing = db.find(row.id);
      if (existing) {
        if (existing.team !== row.team) {
          if (row.team === HOME_TEAM) {
            // lógica real aquí — nivel 4
          }
        }
      }
    }
  }
}
```

### Síntomas
- Más de 2 niveles de indentación en lógica de negocio
- `else` después de un bloque que ya termina el flujo (`return`, `continue`, `break`, `throw`)
- Condiciones que envuelven el happy path en lugar de eliminar los casos inválidos
- Funciones largas con nesting creciente

---

## La Solución: Guard Clauses + Early Exit

Invierte las condiciones para **eliminar los casos inválidos primero** y dejar el happy path plano.

### Reglas

1. **Si el bloque `if` termina el flujo** (`return`/`continue`/`break`/`throw`), **nunca uses `else`**.
2. **Valida precondiciones al inicio** con guard clauses — un `if` invertido que sale temprano.
3. **Extrae lógica profunda a funciones** con su propio guard clause interno.
4. **Máximo 2 niveles** de indentación para lógica de negocio. El tercer nivel es señal de extracción.

---

## Patrones

### Guard Clause básico

```js
// ❌ Antes
function process(value) {
  if (value !== null) {
    if (value > 0) {
      doWork(value);
    }
  }
}

// ✅ Después
function process(value) {
  if (value === null) return;    // guard
  if (value <= 0) return;        // guard
  doWork(value);                 // happy path plano
}
```

### Early continue en loops

```js
// ❌ Antes
for (const row of rows) {
  if (row.id) {
    // toda la lógica aquí adentro...
  }
}

// ✅ Después
for (const row of rows) {
  if (!row.id) continue;         // guard
  // toda la lógica aquí — un nivel más plana
}
```

### Eliminar else tras return/continue

```js
// ❌ Antes
if (!existing) {
  inserted++;
} else {
  updated++;
  handleTeamChange(existing, record);
}

// ✅ Después
if (!existing) { inserted++; continue; }   // guard + early exit
updated++;
handleTeamChange(existing, record);        // happy path sin else
```

### Extraer lógica profunda

```js
// ❌ Antes — 4 niveles
for (const row of rows) {
  if (row.id) {
    const existing = find(row.id);
    if (existing) {
      if (existing.team !== row.team && row.team) {
        // lógica de cambio de equipo
      }
    }
  }
}

// ✅ Después — 2 niveles máximo
for (const row of rows) {
  if (!row.id) continue;
  const existing = find(row.id);
  if (!existing) continue;
  handleTeamChange(existing, row);   // lógica extraída
}

function handleTeamChange(existing, row) {
  if (!row.team || existing.team === row.team) return;  // guard interno
  // lógica aquí — plana
}
```

---

## Checklist de revisión

Antes de dar por terminado un bloque de código, verifica:

- [ ] ¿Hay `else` después de un `return`/`continue`/`throw`? → eliminarlo
- [ ] ¿El nesting supera 2 niveles? → aplicar guard clause o extraer función
- [ ] ¿La condición envuelve el happy path? → invertirla
- [ ] ¿Un `if` profundo puede ser un `continue`/`return` temprano? → hacerlo

---

## Cuándo NO aplicar

- Nesting estructural inevitable (e.g., SQL builder con condiciones múltiples interdependientes)
- Bloques `try/catch` que por naturaleza tienen un nivel extra — aceptable
- Máximo 1 nivel extra cuando las condiciones son semánticamente inseparables

---

## Relación con otras skills

- **SOLID/SRP**: la extracción de funciones para eliminar nesting también mejora SRP
- **naming-analyzer**: las funciones extraídas deben tener nombres que revelan intención (`handleTeamChange`, no `process`)
