---
name: namespace-objects
description: "Reduce cognitive overhead by grouping related functions into plain object namespaces instead of leaving them as loose top-level declarations. Apply when a file has more than ~5 top-level functions or when functions only make sense together."
---

# Namespace Objects — Principle of Least Exposure

---

## Fundamentos teóricos

### Cognitive Load Theory (John Sweller, 1988)
La memoria de trabajo humana tiene capacidad limitada (~7±2 ítems simultáneos, **Miller's Law**).
Cada variable o función visible en el scope activo ocupa un slot mental, aunque en ese momento no haga nada relevante.
Una función declarada 60 líneas antes de usarse mantiene ese slot ocupado durante toda la lectura intermedia.
Reducir el número de símbolos visibles desde un punto del código = reducir la carga cognitiva = leer más rápido y con menos errores.

### Locality of Behavior (HTMX / Carson Gross, también en Clean Code — Uncle Bob)
> "The behavior of a unit of code should be as visible as possible from the code itself."

Si para entender qué hace `runImport` necesito saltar a `buildRecord`, luego a `extractMeta`, luego a `handleTeamChange` dispersas por el archivo, el comportamiento **no está localizado**. Un namespace agrupa el comportamiento relevante en un lugar, aumentando la localidad.

### Principle of Least Scope (Teoría de lenguajes de programación)
Una variable, función o símbolo debe vivir en el scope mínimo necesario para cumplir su función.
Si solo es necesaria dentro de un método → va dentro del método.
Si solo es necesaria dentro de un namespace → es un método privado (`_`).
Si es necesaria globalmente → solo entonces vive al top-level.

### The Art of Readable Code (Boswell & Foucher, capítulo 7)
> "Make your variable visible for as few lines of code as possible.
> The more places a variable can be seen, the harder it is to reason about where it is and isn't set."

Aplicado a funciones: cuanto menor sea el scope en que una función es visible, más fácil es razonar sobre quién la llama, qué efectos tiene y si es seguro modificarla.

### Encapsulation (OOP, Parnas 1972 — Information Hiding)
El principio original de encapsulación no es sobre clases — es sobre **ocultar decisiones de diseño que pueden cambiar**.
Un namespace con métodos `_privados` aplica este principio sin necesitar una clase: el lector sabe que `_buildRecord` es un detalle de implementación y no parte del contrato público, igual que un método `private` en Java o C#.

---

## El Problema: Top-level Pollution

Igual que las variables globales generan ruido mental, las funciones globales en un módulo hacen lo mismo.
Cuando un archivo tiene 10+ funciones al top-level, leer `main()` obliga al lector a preguntarse:

> "¿`buildRecord` es una utilidad reutilizable en todo el módulo o un detalle interno de la importación?"

Si no hay respuesta obvia, hay que buscar todos los usos antes de entender el flujo.
Esto es **cognitive overhead innecesario**.

---

## La Solución: Object Namespace

Agrupa funciones relacionadas en un objeto literal. El nombre del objeto comunica el contexto; sus métodos son los detalles internos.

```js
// ❌ Antes — 6 funciones sueltas al top-level
function readRows(path) { ... }
function parseHeaders(row) { ... }
function buildRecord(row, map) { ... }
function extractMeta(json) { ... }
function runTransaction(db) { ... }
function printSummary(result) { ... }

// ✅ Después — 3 namespaces con responsabilidades claras
const ExcelReader = {
  readRows(path)        { ... },
  parseHeaders(row)     { ... },
};

const Importer = {
  _buildRecord(row, map)  { ... },   // _ = detalle interno, no parte del contrato público
  _extractMeta(json)      { ... },
  run(db, rows, headers)  { ... },   // único punto de entrada público
};

const Reporter = {
  printSummary(result) { ... },
};
```

---

## Reglas

### 1. Nombra por responsabilidad, no por tecnología
```js
// ❌ Mal — nombre técnico
const XlsxUtils = { ... };

// ✅ Bien — nombre de dominio
const ExcelReader = { ... };
const IncidentImporter = { ... };
```

### 2. Prefija con `_` los métodos internos
Los métodos que solo existen para ser llamados por otros métodos del mismo objeto no son parte del contrato público. Señálalo con `_`:
```js
const Importer = {
  _buildRecord(...) { ... },      // detalle interno
  _extractMeta(...) { ... },      // detalle interno
  run(db, rows, headers) { ... }, // contrato público ← lo único que main() necesita saber
};
```

### 3. El entry point (`main`, `handler`, etc.) solo ve namespaces
Si `main()` llama a funciones sueltas, alguna de ellas debería estar en un namespace.
```js
// ✅ main() como pipeline legible
function main() {
  const rows    = ExcelReader.readRows(path);
  const headers = ExcelReader.parseHeaders(rows[0]);
  const result  = Importer.run(db, rows, headers, fileName);
  Reporter.printSummary(result);
}
```

### 4. Funciones que solo se usan una vez → van dentro del método que las usa
No crees un method del namespace para algo que solo existe como helper de otro método. Ponla como función local dentro del método o como arrow function capturada por closure.

```js
const Importer = {
  run(db, rows, headers, fileName) {
    // handleTeamChange es un detalle de run(), no del namespace completo
    const handleTeamChange = (existing, record) => { ... };

    db.transaction(() => {
      for (const row of rows) {
        ...
        handleTeamChange(existing, record);
      }
    })();
  },
};
```

---

## Cuándo usar clase en lugar de object literal

| Criterio | Object Literal | Clase |
|---|---|---|
| Sin estado compartido entre llamadas | ✅ | innecesario |
| Estado compartido entre métodos | ❌ | ✅ |
| Múltiples instancias | ❌ | ✅ |
| Herencia o polimorfismo | ❌ | ✅ |
| Métodos que usan `this` para estado | ❌ | ✅ |

Para la mayoría de scripts CLI, módulos de utilidad y servicios sin estado → **object literal**.

---

## Heurística de agrupación

Pregúntate: "Si borrara esta función, ¿qué namespace perdería un método?"
- Si la respuesta es clara → ya pertenece a ese namespace.
- Si no hay respuesta → es candidata a ser una función local dentro del método que la usa.
- Si la respuesta es "todos podrían usarla" → puede ser una función helper global (legítima).

---

## Relación con otras skills

- **SRP (solid-architectural-governance)**: cada namespace tiene una razón para cambiar
- **flat-code**: las funciones locales dentro de métodos también reducen nesting
- **naming-analyzer**: el nombre del namespace debe revelar la responsabilidad del grupo
