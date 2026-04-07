import { Resend } from 'resend'

export async function sendVerificationEmail(params: {
  to: string
  verifyUrl: string
}): Promise<void> {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey as string
  const from = config.resendFromEmail as string

  if (!apiKey) {
    console.warn(
      '[email] RESEND_API_KEY missing — verification link (dev):',
      params.verifyUrl,
    )
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: 'Potwierdź konto Vault',
    html: `
      <p>Kliknij link, aby potwierdzić adres e-mail:</p>
      <p><a href="${params.verifyUrl}">${params.verifyUrl}</a></p>
      <p>Link wygasa za 24 godziny.</p>
    `,
  })

  if (error) {
    console.error('[email] Resend error:', error)
    throw createError({
      statusCode: 502,
      message: 'Nie udało się wysłać wiadomości e-mail.',
    })
  }
}
