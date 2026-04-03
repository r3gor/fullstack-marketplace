---
name: react-frontend
description: "Architecture patterns for React frontend apps. Use when creating a new React project, adding state management, setting up an API client, handling HTTP errors, building forms with validation, or applying component styling. Covers: Zustand + TanStack Query v5 state strategy, Axios facade with interceptors, ApiError class with centralized error codes, React Hook Form + Zod (two-way binding and submit-based patterns), Tailwind CSS v4 + CVA component variants."
compatibility: React 19+, Vite, Tailwind CSS v4
metadata:
  author: pdzen
  version: "1.0"
---

# React Frontend Architecture

## 1. State Management Strategy

Two tools, two responsibilities — never mix them:

| Tool | Responsibility | Examples |
|---|---|---|
| **TanStack Query v5** | All server/persisted data | notebooks list, cells, databases, SSO profiles |
| **Zustand** | UI/ephemeral state only | selected item, expanded sections, editing mode, dialog open |

**Rule:** If the data survives a page refresh → TanStack Query. If it resets on unmount → Zustand.

Zustand stores are created per-component-tree via `createStore` (not global `create`) and injected through React Context.

---

## 2. TanStack Query v5 Conventions

### QueryClient config (`config/reactQueryClient.js`)
```js
export const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 min default
      gcTime: 1000 * 60 * 60 * 24,    // 24h — allows localStorage persistence
      retry: 2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Persist cache to localStorage
export const reactQueryPersister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: 'app-query-cache',
  throttleTime: 1000,
});
// Wrap app in <PersistQueryClientProvider client={...} persistOptions={{ persister }}>
```

### Query Keys — factory pattern (`queries/queryKeys.js`)
```js
export const notebookQueryKeys = {
  all: ['notebooks'],
  detail: (id) => [...notebookQueryKeys.all, 'detail', id],
  cells: (notebookId) => [...notebookQueryKeys.all, notebookId, 'cells'],
  cell: (notebookId, cellId) => [...notebookQueryKeys.cells(notebookId), cellId],
};
```
Every module has its own `queryKeys.js`. Never inline string arrays in hooks.

### Query hooks (`queries/useXxx.js`)
```js
export const useNotebooks = () => {
  return useQuery({
    queryKey: notebookQueryKeys.all,
    queryFn: NotebookRepo.getNotebooks,
    staleTime: 2 * 60 * 1000,   // always explicit per hook
    gcTime: 10 * 60 * 1000,
  });
};
```

### Mutation hooks (`queries/useXxxAction.js`)
```js
export const useCreateNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: NotebookRepo.createNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookQueryKeys.all });
    },
    onError: (error) => console.error('Error:', error),
    meta: { feature: 'notebooks', action: 'create' }, // for debugging
  });
};
```

Use `isPending` for mutations (not `isLoading`).

---

## 3. API Client — Axios Facade

### Structure
```
lib/api-client/
  client.js        ← public facade (the only thing services import)
  axios-client.js  ← Axios instance + interceptors
  errors.js        ← ApiError class
  error-codes.js   ← shared error code constants
```

### Facade (`client.js`)
```js
import { axiosClient } from './axios-client';

export const api = {
  get:    (url, config = {})        => axiosClient.get(url, config),
  post:   (url, data, config = {})  => axiosClient.post(url, data, config),
  put:    (url, data, config = {})  => axiosClient.put(url, data, config),
  patch:  (url, data, config = {})  => axiosClient.patch(url, data, config),
  delete: (url, config = {})        => axiosClient.delete(url, config),
};
```
Services always import `api`, never `axiosClient` directly.

### Axios config + interceptors (`axios-client.js`)
```js
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api/v1',
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: logging
axiosClient.interceptors.request.use((config) => {
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response: unwrap data + transform errors to ApiError
axiosClient.interceptors.response.use(
  (response) => response.data,           // unwrap — callers receive data directly
  (axiosError) => {
    const { status, data } = axiosError.response ?? {};
    const errorInfo = data?.error ?? {};
    return Promise.reject(new ApiError(
      errorInfo.message || axiosError.message,
      errorInfo.code    || AllErrorCodes.UNKNOWN_ERROR,
      status            || 0,
      errorInfo.details || null,
    ));
  }
);
```

---

## 4. Error Handling

### Error codes (`lib/api-client/error-codes.js`)
```js
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
export const AWSErrorCodes = {
  CREDENTIALS_EXPIRED: 'CREDENTIALS_EXPIRED',
  LOG_GROUP_NOT_FOUND: 'LOG_GROUP_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  THROTTLING: 'THROTTLING',
  // ...add domain-specific codes
};
export const AllErrorCodes = { ...ErrorCodes, ...AWSErrorCodes };
```
These must match backend error codes exactly.

### ApiError class (`lib/api-client/errors.js`)
```js
export class ApiError extends Error {
  constructor(message, code, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.userMessage = ErrorMessages[code] || message; // user-facing
  }
  is(errorCode) { return this.code === errorCode; }
}
```

### User-friendly messages
Map error codes to human-readable strings (in the app's language):
```js
const ErrorMessages = {
  [AllErrorCodes.CREDENTIALS_EXPIRED]: 'Las credenciales han expirado.',
  [AllErrorCodes.ACCESS_DENIED]: 'Acceso denegado. Verifica los permisos.',
  [AllErrorCodes.THROTTLING]: 'Demasiadas peticiones. Intenta de nuevo.',
  // ...
};
```

### Toast notifications
Use any toast library or custom solution. Configure globally in the app root with at minimum success/error visual variants. Show `error.userMessage` (from `ApiError`) in error toasts, not the raw technical message.

---

## 5. Forms — React Hook Form + Zod

### Pattern A: Two-way binding (form child, logic in parent)

Use when: the parent holds the state, the form is a "dumb" capture component that reflects parent changes in real time.

```js
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  endpoint: z.string().min(1).default(''),
  environment: z.enum(['test', 'prod']).default('test'),
});

const SearchForm = ({ value = {}, onChange = () => {} }) => {
  // Zod generates defaults, parent values override them
  const normalizedValue = { ...schema.parse({}), ...value };

  const { register, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    values: normalizedValue,   // `values` not `defaultValues` — continuous sync
    mode: 'onChange',
  });

  // Notify parent on every change (child → parent)
  useEffect(() => {
    const sub = watch((formData) => onChange(formData));
    return () => sub.unsubscribe();
  }, [watch, onChange]);

  return <input {...register('endpoint')} />;
};
```

### Pattern B: Submit-based (modal/dialog, autonomous form)

Use when: the form manages its own state and the parent only receives data on submit.

```js
const CreateDialog = ({ isOpen, onClose, onConfirm }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: schema.parse({}),  // `defaultValues` — one-time initialization
    mode: 'onChange',
  });

  // Reset when dialog closes
  useEffect(() => { if (!isOpen) reset(); }, [isOpen, reset]);

  const onSubmit = (data) => {
    onConfirm(data);
    reset();
    onClose();
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
};
```

| | Pattern A (two-way) | Pattern B (submit-based) |
|---|---|---|
| RHF config | `values:` | `defaultValues:` |
| Delivers data | on every change | only on submit |
| Parent role | holds state | receives final data |

**Rule:** Always use `zodResolver`. Never use inline validation (`register('field', { required: true })`). Zod schema is the single source of truth for defaults and validation.

---

## 6. Styling

- **Tailwind CSS v4** via Vite plugin — no `tailwind.config.js` needed
- **`cva`** (class-variance-authority) for component variants
- **`cn` = `clsx`** for conditional class merging

### Component variants with CVA
```js
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:   "bg-emerald-500 text-white hover:bg-emerald-600",
        secondary: "bg-gray-600 text-white hover:bg-gray-700",
        danger:    "bg-red-600 text-white hover:bg-red-700",
        outline:   "border border-gray-600 text-gray-300 hover:bg-gray-700",
      },
      size: {
        sm:      "h-9 px-3 text-sm",
        default: "h-11 px-6",
        lg:      "h-12 px-8 text-lg",
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

const Button = forwardRef(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
```

### Dark theme palette
```
Backgrounds:  bg-gray-900 (page), bg-gray-800 (card), bg-slate-800 (cell/panel)
Borders:      border-gray-700, border-slate-700
Text:         text-white, text-gray-300, text-gray-400, text-gray-500
Accent:       emerald-500 (primary action), slate-400 (secondary)
Error:        text-red-400 / bg-red-900/20 / border-red-500/50
```

### Icon library
Always use **Lucide React** (`lucide-react`). Never mix with other icon libraries.

### cn utility
```js
// utils/cn.js
import { clsx } from 'clsx';
export function cn(...inputs) { return clsx(inputs); }
```
