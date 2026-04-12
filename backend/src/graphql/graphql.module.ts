import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { JwtService } from '@nestjs/jwt'
import depthLimit from 'graphql-depth-limit'
import { join } from 'path'
import type { AuthPayload } from '../types'
import { GraphqlOperationsService } from './graphql-operations.service'
import { GraphqlMutationResolver } from './resolvers/graphql-mutation.resolver'
import { GraphqlQueryResolver } from './resolvers/graphql-query.resolver'
import { RecipeFieldsResolver } from './resolvers/recipe-fields.resolver'

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [JwtService],
      useFactory: (jwtService: JwtService) => ({
        autoSchemaFile: join(__dirname, 'schema.gql'),
        sortSchema: true,
        // graphql-query-complexity как validationRule вызывает getVariableValues с variables: {} —
        // любые обязательные $variable падают с «was not provided». Ограничение сложности убрано из rules;
        // остаётся depthLimit. При необходимости complexity считать через plugin Apollo / отдельный этап execute.
        validationRules: [depthLimit(14)],
        context: ({ req }: { req: { headers: { authorization?: string | string[] } } }) => {
          let user: AuthPayload | null = null
          const raw = req.headers.authorization
          const auth = Array.isArray(raw) ? raw[0] : raw
          if (auth?.startsWith('Bearer ')) {
            try {
              user = jwtService.verify<AuthPayload>(auth.slice(7))
            } catch {
              /* optional auth */
            }
          }
          return { req, user }
        },
      }),
    }),
  ],
  providers: [
    GraphqlOperationsService,
    GraphqlQueryResolver,
    GraphqlMutationResolver,
    RecipeFieldsResolver,
  ],
})
export class GraphqlModule {}
