# Plan de Migración a AWS Cognito

> **Estado:** Referencia futura — la autenticación actual usa JWT propio (HS256) con refresh tokens en SQLite.  
> Este documento describe cómo migrar a AWS Cognito cuando el proyecto escale o requiera features de identidad avanzados.

---

## Por qué migrar a Cognito

El sistema de auth actual es funcional para un proyecto de aprendizaje, pero Cognito agrega sin esfuerzo:

- MFA (TOTP, SMS)
- Social login (Google, Facebook, Apple)
- Passwordless (passkeys, email OTP)
- Password recovery automático
- Detección de credenciales comprometidas (tier Plus)
- Compliance (SOC 2, HIPAA, ISO 27001) heredado de AWS

---

## Modelo de precios (2025)

| Tier | Free tier | Precio tras free tier | Incluye |
|---|---|---|---|
| **Lite** | 10,000 MAU/mes | $0.0055–$0.0025/MAU | Login, social, SAML/OIDC |
| **Essentials** | 10,000 MAU/mes | $0.015/MAU (flat) | + Passwordless, UI administrada, tokens custom |
| **Plus** | Sin free tier | $0.020/MAU | + Autenticación adaptativa, detección de riesgo |

**Para este proyecto:** Con < 10,000 usuarios activos mensuales → **$0**. El free tier es permanente (no expira a los 12 meses).

**Comparativa:**

| Servicio | Free tier | Costo a escala |
|---|---|---|
| Cognito Lite | 10k MAU | ~$0.005/MAU |
| Auth0 | 7,500 MAU | $0.07/MAU |
| Clerk | 10k MAU | $0.02/MAU |
| Supabase Auth | Ilimitado (self-hosted) | $0 |

---

## Qué cambia en el backend Go

### Arquitectura hexagonal — el payoff

Los únicos archivos que cambian son los **adaptadores de infraestructura**. El dominio y los servicios de negocio no se tocan.

### Lo que se elimina

| Archivo | Razón |
|---|---|
| `application/auth_service.go` | Cognito gestiona Register/Login/Logout/Refresh |
| `infrastructure/http/handler/auth_handler.go` | Frontend llama directo a Cognito |
| `infrastructure/sqlite/refresh_token_repository.go` | Cognito gestiona refresh tokens |
| `core/port/repositories.go` → `RefreshTokenRepository` | Ya no necesaria |
| Migración `002_create_refresh_tokens.up.sql` | Tabla ya no necesaria |

### Lo que cambia

**`infrastructure/http/middleware/auth.go`** — el cambio más importante:

```go
// HOY: valida JWT HS256 con secreto propio
token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
    if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, fmt.Errorf("unexpected signing method")
    }
    return []byte(cfg.JWTSecret), nil
})

// CON COGNITO: valida JWT RS256 contra JWKS públicas de AWS
// Usar: github.com/lestrrat-go/jwx/v2
keySet, err := jwk.Fetch(ctx, "https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json")
token, err := jwt.Parse(tokenStr, jwt.WithKeySet(keySet), jwt.WithValidate(true))
userID := token.Subject() // el "sub" de Cognito = UUID del usuario
```

**`bootstrap/config/config.go`** — nuevas variables:

```go
// Reemplaza JWTSecret
CognitoUserPoolID string // us-east-1_XXXXXXXX
CognitoRegion     string // us-east-1
CognitoClientID   string // para el frontend
```

### Lo que NO cambia

- `core/domain/` — entidades y errores
- `application/user_service.go` — GetMe/UpdateMe
- `application/favorite_service.go`
- `application/order_service.go`
- `application/review_service.go`
- Todos los handlers excepto `auth_handler.go`
- Tablas: `users` (parcial), `orders`, `order_items`, `favorites`, `review_submissions`

---

## Migración de usuarios existentes

### Estrategia recomendada: Lazy Migration (trigger Lambda)

Los usuarios migran automáticamente la primera vez que hacen login post-migración. Sin impacto en UX.

**Flujo:**

```
Usuario hace login en Cognito
  → Cognito: "no existe este usuario"
  → Dispara Lambda "User Migration Trigger"
  → Lambda consulta tu DB: ¿existe? ¿bcrypt.CompareHashAndPassword() OK?
  → Si sí: devuelve { email, name, sub: tu_uuid_existente }
  → Cognito crea el usuario con ese sub
  → Las FKs en orders/favorites/review_submissions permanecen válidas
  → Próximo login ya va directo a Cognito (sin tocar tu DB)
```

**Por qué funciona con los UUIDs existentes:** El `sub` de Cognito es un UUID. Si en el trigger devuelves el mismo UUID que tenías en tu DB como `sub`, todas las relaciones en `orders`, `favorites` y `review_submissions` permanecen intactas sin modificar ninguna fila.

**Lambda de migración (pseudocódigo Go):**

```go
func handler(ctx context.Context, event CognitoEvent) (CognitoEvent, error) {
    if event.TriggerSource != "UserMigration_Authentication" {
        return event, nil
    }

    email := event.Request.Password // Cognito pasa el email aquí
    password := event.Request.Password

    // Consultar DB existente
    user, err := db.GetUserByEmail(ctx, email)
    if err != nil || !bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(password)) {
        return event, errors.New("invalid credentials")
    }

    // Devolver atributos a Cognito
    event.Response.UserAttributes = map[string]string{
        "email":          user.Email,
        "name":           user.Name,
        "email_verified": "true",
        "sub":            user.ID, // preserva el UUID original
    }
    event.Response.FinalUserStatus = "CONFIRMED"
    event.Response.MessageAction = "SUPPRESS" // no enviar email de bienvenida
    return event, nil
}
```

### Estrategia alternativa: Bulk Import

Solo viable si fuerzas reset de contraseña a todos (Cognito no acepta hashes bcrypt directamente). **No recomendado** — mala UX.

---

## Infraestructura con AWS CDK (TypeScript)

### SDK vs CDK

| | AWS SDK | AWS CDK |
|---|---|---|
| **Qué hace** | Llamadas imperativas a la API de AWS | Describe infraestructura como código |
| **Analogía** | SQL `INSERT` manual | ORM con migraciones |
| **Gestiona estado** | No | Sí (vía CloudFormation) |
| **Uso típico** | Runtime de la app (validar tokens, crear usuarios) | Deploy time (crear el User Pool, configurar triggers) |
| **Relación** | El CDK genera infraestructura que el SDK luego usa | Complementarios, no alternativos |

### Estructura CDK recomendada

```typescript
// infrastructure/lib/auth-stack.ts
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda de migración
    const migrationFn = new lambda.Function(this, 'UserMigration', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../backend/lambda/migration'),
    });

    // User Pool
    const userPool = new cognito.UserPool(this, 'EcommerceUsers', {
      userPoolName: 'ecommerce-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        fullname: { required: true, mutable: true },
        email: { required: true, mutable: false },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: false,
        requireSymbols: false,
      },
      lambdaTriggers: {
        userMigration: migrationFn, // lazy migration
      },
      removalPolicy: RemovalPolicy.RETAIN, // nunca borrar usuarios en prod
    });

    // Client para el frontend
    const webClient = userPool.addClient('WebClient', {
      userPoolClientName: 'web',
      authFlows: {
        userPassword: true,
        userSrp: true,
        refreshToken: true,
      },
      accessTokenValidity: Duration.minutes(15),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Outputs para el backend y frontend
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: webClient.userPoolClientId });
    new CfnOutput(this, 'JwksUrl', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}/.well-known/jwks.json`,
    });
  }
}
```

---

## Plan de ejecución

### Fase 1 — Infraestructura
1. Crear proyecto CDK en `infrastructure/`
2. Definir `AuthStack` con User Pool + Lambda trigger
3. `cdk deploy` → obtener `UserPoolId`, `ClientId`, `JwksUrl`

### Fase 2 — Backend Go
1. Agregar `github.com/lestrrat-go/jwx/v2` al `go.mod`
2. Reemplazar `middleware/auth.go` para validar RS256 con JWKS
3. Actualizar `config.go`: eliminar `JWTSecret`, agregar `CognitoUserPoolID`, `CognitoRegion`
4. Eliminar `auth_service.go`, `auth_handler.go`, `refresh_token_repository.go`
5. Eliminar rutas `/auth/*` de `routes.go`
6. Ejecutar migración `002_create_refresh_tokens.down.sql`

### Fase 3 — Frontend Next.js
1. Instalar `aws-amplify` o `amazon-cognito-identity-js`
2. Reemplazar fetch a `/api/v1/auth/*` por llamadas a Cognito SDK
3. El access token JWT de Cognito se envía en header `Authorization: Bearer` o cookie
4. Actualizar `middleware.ts` para verificar el nuevo formato de token

### Fase 4 — Migración de usuarios
1. Desplegar Lambda de migración junto con el User Pool
2. Hacer el cutover (apuntar frontend al nuevo auth)
3. Usuarios existentes migran automáticamente en su primer login
4. Monitorear CloudWatch Logs del trigger durante las primeras semanas
5. Una vez que el % de usuarios migrados sea alto, desactivar el trigger

---

## Variables de entorno — antes y después

| Variable | Hoy | Con Cognito |
|---|---|---|
| `JWT_SECRET` | HS256 signing secret | **Eliminar** |
| `JWT_EXPIRY` | `15m` | **Eliminar** (Cognito lo gestiona) |
| `REFRESH_TOKEN_EXPIRY` | `720h` | **Eliminar** |
| `COGNITO_USER_POOL_ID` | — | `us-east-1_XXXXXXXX` |
| `COGNITO_REGION` | — | `us-east-1` |
| `COGNITO_CLIENT_ID` | — | para el frontend |

---

## Consideraciones finales

- **Lock-in moderado:** Si en el futuro quisieras salir de Cognito (ej. a Auth0 o sistema propio), solo cambias el `middleware/auth.go` otra vez — el dominio nunca sabe cómo se autentica.
- **Tier recomendado para este proyecto:** Lite — básico, gratuito hasta 10k MAU, suficiente para login/register/social.
- **No migrar prematuramente:** El sistema actual de JWT propio es perfectamente válido para un proyecto de aprendizaje/portfolio. Migrar a Cognito tiene sentido cuando necesites MFA, social login, o compliance.
