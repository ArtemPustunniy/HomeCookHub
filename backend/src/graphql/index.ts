import { Router } from 'express'
import { createHandler } from 'graphql-http/lib/use/express'
import { schema, createRoot } from './schema.js'
import { optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
// #region agent log
import { DBG } from '../debugLog.js'
// #endregion

const router = Router()

router.use(optionalAuth)

router.all(
  '/',
  createHandler({
    schema,
    rootValue: createRoot(),
    context: (req: { raw?: AuthenticatedRequest }) => {
      const user = req.raw?.user ?? null
      // #region agent log
      DBG('graphql/index.ts:18', 'context()', {
        hasRaw: !!req.raw,
        rawKeys: req.raw ? Object.keys(req.raw).slice(0, 10) : [],
        hasUser: !!user,
        userId: user?.userId,
      }, 'H1,H2,H3')
      // #endregion
      return { user }
    },
  }),
)

export default router
