export interface FieldDef {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  default?: string | boolean | number
}
