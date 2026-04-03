import type { Core } from '@strapi/strapi'
import fs from 'node:fs'
import path from 'node:path'

const PUBLIC_PERMISSIONS = [
  { action: 'api::product.product.find' },
  { action: 'api::product.product.findOne' },
  { action: 'api::category.category.find' },
  { action: 'api::category.category.findOne' },
  { action: 'api::tag.tag.find' },
]

async function setupPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } })

  if (!publicRole) return

  for (const perm of PUBLIC_PERMISSIONS) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action: perm.action, role: publicRole.id } })

    if (!existing) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action: perm.action, role: publicRole.id, enabled: true } })
    }
  }
}

async function setupSeedToken(strapi: Core.Strapi) {
  const TOKEN_NAME = 'seed-token'

  const existing = await strapi.db
    .query('admin::api-token')
    .findOne({ where: { name: TOKEN_NAME } })

  if (existing) return // ya existe, no recrear

  const result = await (strapi as any).admin.services['api-token'].create({
    name: TOKEN_NAME,
    type: 'full-access',
    lifespan: null,
    description: 'Token for seed scripts',
  })

  // result.accessKey is the raw token — only available at creation time
  const envPath = path.join(process.cwd(), '.env.local')
  fs.writeFileSync(envPath, `STRAPI_SEED_TOKEN=${result.accessKey}\n`)

  strapi.log.info(`✅ Seed token created and saved to strapi/.env.local`)
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setupPublicPermissions(strapi)
    await setupSeedToken(strapi)
  },
}
