import { toPascalCase, toCamelCase } from '../utils/name'
import type { FieldDef } from '../types'

export function feApiTemplate(name: string, _fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  return `import { api } from '../../../shared/fetchers/client'
import type { ${Pascal}, Create${Pascal}, Update${Pascal} } from '../types'

export const ${camel}Api = {
  getAll: () => api.get<${Pascal}[]>('/api/${name}'),
  getById: (id: number) => api.get<${Pascal}>(\`/api/${name}/\${id}\`),
  create: (data: Create${Pascal}) => api.post<${Pascal}>('/api/${name}', data),
  update: (id: number, data: Update${Pascal}) => api.patch<${Pascal}>(\`/api/${name}/\${id}\`, data),
  remove: (id: number) => api.delete<void>(\`/api/${name}/\${id}\`),
}
`
}
