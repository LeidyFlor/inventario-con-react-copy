"""
Backend de email personalizado para evitar errores de verificación SSL en desarrollo.
Usa este backend en development; en producción reemplazar por el estándar de Django.
"""
import ssl
import smtplib
from django.core.mail.backends.smtp import EmailBackend


class BrevoEmailBackend(EmailBackend):
    def open(self):
        if self.connection:
            return False
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

            self.connection = smtplib.SMTP(self.host, self.port, timeout=self.timeout)
            self.connection.ehlo()
            if self.use_tls:
                self.connection.starttls(context=context)
                self.connection.ehlo()
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            return True
        except Exception:
            if not self.fail_silently:
                raise
