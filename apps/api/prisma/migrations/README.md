# Migraciones de Prisma

## Estructura

- `20260118000000_initial_schema/` - **Migración inicial**
  - Crea el schema completo desde cero
  - Usar cuando la base de datos aún no existe
  - Esta es la migración que debe aplicarse en producción

## Uso

### Producción (BD nueva)
```bash
npx prisma migrate deploy
# Aplicará la migración inicial
```

### Desarrollo
```bash
npx prisma migrate deploy
# Aplicará la migración inicial
```
