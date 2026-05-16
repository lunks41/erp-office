export interface EmailRequest {
  to: string
  toName?: string
  subject: string
  htmlBody: string
  textBody?: string
}

export interface EmailResponse {
  result: number
  message: string
}

export interface SendWelcomeRequest {
  email: string
  name?: string
}

class EmailService {
  private readonly baseUrl = "/api/send-email"

  isConfigured(): boolean {
    return true // actual config check happens server-side
  }

  async send(request: EmailRequest): Promise<EmailResponse> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", ...request }),
    })
    return res.json()
  }

  async sendPasswordReset(
    toEmail: string,
    toName: string,
    resetToken: string
  ): Promise<EmailResponse> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password-reset", toEmail, toName, resetToken }),
    })
    return res.json()
  }

  async sendWelcome(toEmail: string, toName?: string): Promise<EmailResponse> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "welcome", email: toEmail, name: toName }),
    })
    return res.json()
  }

  async testConnection(): Promise<EmailResponse> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test-connection" }),
    })
    return res.json()
  }
}

export const emailService = new EmailService()
