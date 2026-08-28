// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BaseInput from '@/components/ui/BaseInput.vue'

describe('BaseInput bileşeni', () => {
  it('kullanıcı yazdığında yeni değeri üst bileşene iletir', async () => {
    const baseInputWrapper = mount(BaseInput, {
      props: {
        id: 'full-name',
        label: 'Ad Soyad',
        modelValue: '',
      },
    })

    await baseInputWrapper.get('input').setValue('Oktay Tontaş')

    expect(baseInputWrapper.emitted('update:modelValue')).toEqual([['Oktay Tontaş']])
  })

  it('doğrulama hatasını erişilebilir biçimde gösterir', () => {
    const validationErrorMessage = 'Ad soyad alanı zorunludur.'
    const baseInputWrapper = mount(BaseInput, {
      props: {
        errorMessage: validationErrorMessage,
        id: 'full-name',
        label: 'Ad Soyad',
        modelValue: '',
      },
    })
    const inputElement = baseInputWrapper.get('input')
    const validationErrorElement = baseInputWrapper.get('[role="alert"]')

    expect(validationErrorElement.text()).toBe(validationErrorMessage)
    expect(inputElement.attributes('aria-invalid')).toBe('true')
    expect(inputElement.attributes('aria-describedby')).toBe('full-name-error')
  })
})
