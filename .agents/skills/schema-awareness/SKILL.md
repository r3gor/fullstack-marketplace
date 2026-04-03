---
name: schema-awareness
description: "Provides the backlog-agent with full knowledge of the SQLite database schema, table relationships, and field semantics to generate accurate SQL queries."
---

# Schema Awareness — backlog-agent

## Database Location
`/Users/rogerramosparedes/dev/antigravity-cert/backlog-agent/db/backlog_agent.db`
Access via the **SQLite MCP**.

---

## Tables Overview

| Table | Purpose |
|-------|---------|
| `incidents` | Unified Ivanti incidents + Salesforce OTs |
| `incident_relations` | Links OTs to derived Ivanti incidents || `incident_team_history` | Audit trail of team changes per incident — detecta derivaciones y regresos || `backlog` | Team planning items (tickets, OTs, HUs, tasks) |
| `releases` | Production deployments |
| `import_log` | Audit trail of every import |

---

## Table: `incidents`

The core table. Both Ivanti and Salesforce records live here, distinguished by `source`.

```sql
id              -- auto PK
source          -- 'ivanti' | 'salesforce'
ticket_number   -- Ivanti: Incident#  |  Salesforce: OT#
title           -- Ivanti: Summary    |  Salesforce: first line of Descripción
status          -- Ivanti: Assigned/Resolved/Closed  |  SF: En atención/Registro y Análisis
priority        -- Ivanti: 1-4 or text  |  SF: NULL
customer_name   -- the affected customer/account
owner           -- assigned agent
team            -- Ivanti: team name  |  SF: owner group
created_at      -- ISO datetime
started_at      -- when work started
resolved_at     -- when resolved/closed
description     -- full description text
resolution      -- resolution notes
modified_on     -- ISO datetime from source — Ivanti 'Modified On' field. Used for stale-import protection.
extra_data      -- JSON: all source-specific fields not mapped above
imported_at     -- when this record was loaded
import_file     -- source Excel filename
```

**Querying extra_data (SQLite JSON):**
```sql
-- Extract a specific Ivanti field
SELECT json_extract(extra_data, '$.SLA') FROM incidents WHERE source='ivanti';
SELECT json_extract(extra_data, '$.CauseCode') FROM incidents WHERE source='ivanti';
SELECT json_extract(extra_data, '$.Urgency') FROM incidents WHERE source='ivanti';
SELECT json_extract(extra_data, '$.Patrón') FROM incidents WHERE source='ivanti';
```

**Stale-import protection:**
El upsert solo sobreescribe si `excluded.modified_on > incidents.modified_on OR incidents.modified_on IS NULL`.
Si el archivo importado es más viejo que el dato en DB, el registro se salta y **no** se registra cambio de equipo.
```

**Common status values:**
- Ivanti: `Assigned`, `Resolved`, `Closed`, `Pending`
- Salesforce: `En atención`, `Registro y Análisis`, `Cerrado`

---

## Table: `incident_relations`

```sql
id                    -- auto PK
source_incident_id    -- FK → incidents.id (usually the Salesforce OT)
related_incident_id   -- FK → incidents.id (usually the derived Ivanti ticket)
relation_type         -- 'derived_from' | 'blocks' | 'duplicates'
notes                 -- how the relation was detected
created_at
```

**Joining pattern** — "Give me OT #01082819 and all its derived Ivanti tickets":
```sql
SELECT ot.ticket_number AS ot_number, ot.title AS ot_title,
       iv.ticket_number AS ivanti_number, iv.title AS ivanti_title, iv.status
FROM incidents ot
JOIN incident_relations ir ON ot.id = ir.source_incident_id
JOIN incidents iv ON iv.id = ir.related_incident_id
WHERE ot.ticket_number = '01082819' AND ot.source = 'salesforce';
```

---

## Table: `backlog`

```sql
id                  -- auto PK
periodo             -- '02-26', '03-26' (month-year sprint period)
canal               -- App | Web Privada | Web Pública | Estar Bien
producto            -- Cross | Salud | Vehicular | Vida
title               -- full item name (may contain 'OT #XXXXX' or 'Ticket #XXXXX')
item_type           -- 'ot' | 'ticket' | 'task' | 'hu'
status              -- '1. Por hacer' | '2. En progreso' | '3. Cerrado' | 'Bloqueado' | 'Derivado'
category            -- Performance | Negocio
subcategory         -- Incidentes | BAU Digital | Correctivos | Mejoras
requester           -- Salesforce | Ivanti | Correo | Digital | área
responsible         -- team member name or 'TBD'
priority            -- Urgente | Alta | Media | Baja
size                -- S | M | L | XL (t-shirt)
estimated_close     -- ISO date or 'TBD'
is_critical         -- 1 = critical incident, 0 = normal
notes               -- extra observations
hu_code             -- HU identifier (only for items going to production)
linked_incident_id  -- FK → incidents.id (auto-detected from title prefix)
source_row          -- original Excel row number (for overwrite detection)
import_file         -- source filename
imported_at
```

**Common queries:**
```sql
-- All open items for a team member
SELECT * FROM backlog WHERE responsible = 'Roger' AND status != '3. Cerrado';

-- Blocked items this period
SELECT * FROM backlog WHERE status = 'Bloqueado' AND periodo = '03-26';

-- Items linked to a specific OT
SELECT b.* FROM backlog b
JOIN incidents i ON b.linked_incident_id = i.id
WHERE i.ticket_number = '01082819';

-- HUs that went to production (have a release)
SELECT b.*, r.release_date, r.result
FROM backlog b
JOIN releases r ON b.hu_code = r.hu_code
WHERE b.hu_code IS NOT NULL;
```

---

## Table: `releases`

```sql
id               -- auto PK
periodo          -- month-year sprint
tipo             -- Back | Front | Web
canal
producto
title            -- release name
category / subcategory
requester / team / responsible
status           -- En producción | Revertido | Fallido
release_date     -- ISO date
committee_date   -- ISO date
dev_responsible  -- developer
qa_responsible   -- QA engineer
result           -- Exitoso | Fallido | Revertido
notes
hu_code          -- joins with backlog.hu_code
import_file / imported_at
```

**Common queries:**
```sql
-- Failed releases this period
SELECT * FROM releases WHERE result = 'Fallido' AND periodo = '03-26';

-- A release and its backlog item
SELECT r.*, b.title AS backlog_title, b.status AS backlog_status
FROM releases r
LEFT JOIN backlog b ON r.hu_code = b.hu_code
WHERE r.hu_code IS NOT NULL;
```

---

## Table: `incident_team_history`

Registra cada vez que el campo `team` de un incident cambia entre imports.
- `is_return = 1` significa que el ticket **volvió a "Soporte CD Operaciones"** desde otro equipo — acción requerida inmediata.

```sql
id            -- auto PK
incident_id   -- FK → incidents.id
ticket_number -- copia denormalizada para queries rápidas
from_team     -- team anterior
to_team       -- nuevo team
is_return     -- 1 = regresó a Soporte CD Operaciones, 0 = derivado a otro equipo
import_file   -- qué archivo del import detectó el cambio
meta          -- JSON: {"modified_on": "2026-03-17 14:22:00", "last_mod_by": "jorge.garcia@rimac.com.pe"}
detected_at   -- datetime del import
```

**Indexes:** `idx_team_history_ticket` (ticket_number), `idx_team_history_return` (is_return)

**Queries útiles:**
```sql
-- Tickets que regresaron al equipo y aún están abiertos
SELECT i.ticket_number, i.status, i.priority, i.customer_name,
       h.from_team, json_extract(h.meta, '$.modified_on') as modified_on,
       json_extract(h.meta, '$.last_mod_by') as last_mod_by
FROM incidents i
JOIN incident_team_history h ON h.incident_id = i.id
WHERE h.is_return = 1
  AND i.status NOT IN ('Resolved', 'Closed', 'Cerrado', 'Closed/Resolved')
ORDER BY i.priority ASC;

-- Historial completo de un ticket
SELECT from_team, to_team, is_return,
       json_extract(meta, '$.modified_on') as modified_on,
       detected_at
FROM incident_team_history
WHERE ticket_number = '5279511'
ORDER BY detected_at;
```

---

## Table: `import_log`

```sql
id / source / file_name / imported_at
records_inserted / records_updated / records_skipped / records_warned
imported_by / notes
```

---

## Key Query Patterns

### Full picture of an OT
```sql
-- 1. Get the OT
SELECT * FROM incidents WHERE source='salesforce' AND ticket_number='01082819';

-- 2. Get its backlog entry
SELECT b.* FROM backlog b
JOIN incidents i ON b.linked_incident_id = i.id
WHERE i.source='salesforce' AND i.ticket_number='01082819';

-- 3. Get derived Ivanti tickets
SELECT iv.* FROM incidents iv
JOIN incident_relations ir ON iv.id = ir.related_incident_id
JOIN incidents ot ON ot.id = ir.source_incident_id
WHERE ot.source='salesforce' AND ot.ticket_number='01082819';
```

### Reporte de tickets regresados sin resolver
```sql
SELECT
  i.ticket_number, i.status, i.priority, i.customer_name, i.description,
  h.from_team, h.to_team,
  json_extract(h.meta, '$.modified_on') as modified_on,
  json_extract(h.meta, '$.last_mod_by')  as last_mod_by,
  b.title  as ot_title,
  b.status as ot_status
FROM incidents i
JOIN incident_team_history h ON h.incident_id = i.id
LEFT JOIN backlog b ON b.linked_incident_id = i.id
WHERE i.status NOT IN ('Resolved', 'Closed', 'Cerrado', 'Closed/Resolved')
  AND h.is_return = 1
ORDER BY i.priority ASC, i.ticket_number;
```

### Cross-source: same customer in both systems
```sql
SELECT sf.ticket_number AS ot, iv.ticket_number AS ivanti_ticket,
       sf.customer_name, sf.created_at, iv.status
FROM incidents sf
JOIN incidents iv ON sf.customer_name = iv.customer_name
WHERE sf.source='salesforce' AND iv.source='ivanti';
```
