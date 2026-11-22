/** Verifica que quien envía un formulario es una persona (CAPTCHA). */
export interface HumanVerifier {
  verify(token: string, ip: string): Promise<boolean>;
}
