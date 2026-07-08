import { cityOptions } from './referenceData'

export const normalizeSearch = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')

export const matchesSmartValue = (value: string, keyword: string, optionPools: Array<typeof cityOptions>) => {
  const normalizedKeyword = normalizeSearch(keyword)
  if (!normalizedKeyword) return true
  if (normalizeSearch(value).includes(normalizedKeyword)) return true

  const option = optionPools.flat().find((item) => item.value === value || item.label === value)
  if (!option) return false

  return [option.label, option.value, option.pinyin, option.initials, ...(option.aliases ?? [])]
    .map(normalizeSearch)
    .some((candidate) => candidate.includes(normalizedKeyword) || normalizedKeyword.includes(candidate))
}
