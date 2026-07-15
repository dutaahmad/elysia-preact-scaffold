export function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function toCamelCase(kebab: string): string {
  if (!kebab) return ''
  const pascal = toPascalCase(kebab)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function toKebabCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
