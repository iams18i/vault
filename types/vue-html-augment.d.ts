/** Allow shadcn-style `data-slot` on native <option>/<optgroup> (vue-tsc strictTemplates). */
declare module '@vue/runtime-dom' {
  interface OptionHTMLAttributes {
    'data-slot'?: string
  }
  interface OptgroupHTMLAttributes {
    'data-slot'?: string
  }
}

export {}
