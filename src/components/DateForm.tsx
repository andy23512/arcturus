import { useState } from 'react'
import type { FormEvent } from 'react'
import { validateInput } from '../lib/weeks'
import type { DateFormValues, LifeWeeksInput, ValidationErrors } from '../types'
import './DateForm.css'

interface DateFormProps {
  onSubmit: (input: LifeWeeksInput) => void
}

const EMPTY_VALUES: DateFormValues = { birthday: '', charaStart: '', charaFull: '' }

export function DateForm({ onSubmit }: DateFormProps) {
  const [values, setValues] = useState<DateFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<ValidationErrors>({})

  function handleChange(field: keyof DateFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const { errors: nextErrors, input } = validateInput(values)
    setErrors(nextErrors)
    if (input) {
      onSubmit(input)
    }
  }

  return (
    <form className="date-form" onSubmit={handleSubmit} noValidate>
      <div className="date-form-field">
        <label htmlFor="birthday">Your birthday</label>
        <input
          id="birthday"
          type="date"
          value={values.birthday}
          onChange={(e) => handleChange('birthday', e.target.value)}
        />
        {errors.birthday && <p className="date-form-error">{errors.birthday}</p>}
      </div>

      <div className="date-form-field">
        <label htmlFor="charaStart">Date you started using CharaChorder</label>
        <input
          id="charaStart"
          type="date"
          value={values.charaStart}
          onChange={(e) => handleChange('charaStart', e.target.value)}
        />
        {errors.charaStart && <p className="date-form-error">{errors.charaStart}</p>}
      </div>

      <div className="date-form-field">
        <label htmlFor="charaFull">
          Date you fully switched to CharaChorder <span className="optional-tag">(optional)</span>
        </label>
        <input
          id="charaFull"
          type="date"
          value={values.charaFull}
          onChange={(e) => handleChange('charaFull', e.target.value)}
        />
        {errors.charaFull && <p className="date-form-error">{errors.charaFull}</p>}
      </div>

      <button type="submit" className="date-form-submit">
        Draw my weeks
      </button>
    </form>
  )
}
