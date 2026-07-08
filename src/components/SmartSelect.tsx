import { useMemo, useState } from 'react'
import { Select, Tag } from 'antd'
import type { SelectProps } from 'antd'
import type { SmartOption } from '../domain/referenceData'

interface SmartSelectProps {
  value?: string
  onChange?: (value?: string) => void
  options: SmartOption[]
  placeholder?: string
  allowManual?: boolean
  disabled?: boolean
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')

const createSearchText = (option: SmartOption) =>
  normalize([option.label, option.value, option.pinyin, option.initials, ...(option.aliases ?? [])].join(' '))

export function SmartSelect({
  value,
  onChange,
  options,
  placeholder,
  allowManual = true,
  disabled,
}: SmartSelectProps) {
  const [searchText, setSearchText] = useState('')
  const normalizedSearch = normalize(searchText)

  const selectOptions = useMemo<SelectProps['options']>(() => {
    const baseOptions = options.map((item) => ({
      label: (
        <span>
          {item.label}
          <span className="smart-select-meta"> {item.initials}</span>
        </span>
      ),
      value: item.value,
      searchText: createSearchText(item),
    }))

    const exists = options.some((item) => normalize(item.value) === normalizedSearch || normalize(item.label) === normalizedSearch)
    if (allowManual && searchText.trim() && !exists) {
      return [
        ...baseOptions,
        {
          label: (
            <span>
              手动添加 <Tag color="blue">{searchText.trim()}</Tag>
            </span>
          ),
          value: searchText.trim(),
          searchText: normalizedSearch,
        },
      ]
    }

    return baseOptions
  }, [allowManual, normalizedSearch, options, searchText])

  return (
    <Select
      showSearch
      allowClear
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      options={selectOptions}
      onChange={onChange}
      onSearch={setSearchText}
      filterOption={(input, option) => {
        const target = String(option?.searchText ?? '')
        const normalizedInput = normalize(input)
        return target.includes(normalizedInput) || normalizedInput.includes(target)
      }}
      onBlur={() => setSearchText('')}
    />
  )
}
