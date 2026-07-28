"""
Envía por correo los recordatorios de vencimiento de préstamos EXTERNOS.

Se ejecuta una vez al día desde el Programador de tareas de Windows o cron:

    python manage.py enviar_recordatorios

No necesita que el servidor web esté corriendo ni que haya usuarios conectados:
es un proceso independiente que consulta la base de datos, envía los correos y
termina.

Manda dos avisos al cuentadante (prestador) de cada préstamo externo:
  - Un día antes de la fecha de entrega
  - El mismo día del vencimiento

Opciones:
  --dry-run   Muestra a quién se enviaría sin mandar correos ni tocar la BD
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

from backend_sigi.modules.loans.models import Loan


# Estados en los que ya no tiene sentido recordar nada: el préstamo terminó
# o está a la espera de que el cuentadante acepte la devolución.
ESTADOS_CERRADOS = ['finalizado', 'en_espera_aceptacion']


class Command(BaseCommand):
    help = 'Envía recordatorios de vencimiento de préstamos externos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula el envío: muestra los correos que se mandarían sin enviarlos',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        hoy     = timezone.localdate()
        manana  = hoy + timedelta(days=1)

        if dry_run:
            self.stdout.write(self.style.WARNING('MODO SIMULACIÓN — no se enviará ningún correo\n'))

        # Aviso previo: préstamos que vencen mañana y aún no recibieron ese correo
        previos = Loan.objects.select_related('loan_user_lender').filter(
            loan_type='externo',
            loan_date_in=manana,
            reminder_previo_sent_at__isnull=True,
        ).exclude(loan_status__in=ESTADOS_CERRADOS)

        # Aviso del día: préstamos que vencen hoy y aún no recibieron ese correo
        del_dia = Loan.objects.select_related('loan_user_lender').filter(
            loan_type='externo',
            loan_date_in=hoy,
            reminder_vence_sent_at__isnull=True,
        ).exclude(loan_status__in=ESTADOS_CERRADOS)

        enviados = 0
        fallidos = 0

        for loan in previos:
            ok = self._procesar(loan, es_hoy=False, dry_run=dry_run)
            enviados += 1 if ok else 0
            fallidos += 0 if ok else 1

        for loan in del_dia:
            ok = self._procesar(loan, es_hoy=True, dry_run=dry_run)
            enviados += 1 if ok else 0
            fallidos += 0 if ok else 1

        resumen = f'Recordatorios enviados: {enviados} | fallidos: {fallidos}'
        if enviados == 0 and fallidos == 0:
            self.stdout.write('No hay préstamos externos que requieran recordatorio hoy.')
        else:
            self.stdout.write(self.style.SUCCESS(resumen))

    # ──────────────────────────────────────────────────────────────
    def _procesar(self, loan, es_hoy, dry_run):
        """Envía el correo de un préstamo y marca la fecha de envío. True si tuvo éxito."""
        lender = loan.loan_user_lender

        if not lender or not lender.email:
            self.stdout.write(self.style.WARNING(
                f'  {loan.loan_code}: el prestador no tiene correo registrado, se omite'
            ))
            return False

        cuando = 'hoy' if es_hoy else 'mañana'
        self.stdout.write(f'  {loan.loan_code} → {lender.email} (vence {cuando})')

        if dry_run:
            return True

        html_body = self._html(loan, lender, es_hoy)
        try:
            send_mail(
                subject=f'SIGI - El préstamo {loan.loan_code} vence {cuando}',
                message=strip_tags(html_body),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[lender.email],
                html_message=html_body,
                fail_silently=False,
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Error enviando {loan.loan_code}: {e}'))
            return False

        # Se marca solo si el envío salió bien, para reintentar al día
        # siguiente en caso de que el correo haya fallado
        if es_hoy:
            loan.reminder_vence_sent_at = timezone.now()
            loan.save(update_fields=['reminder_vence_sent_at'])
        else:
            loan.reminder_previo_sent_at = timezone.now()
            loan.save(update_fields=['reminder_previo_sent_at'])

        return True

    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def _html(loan, lender, es_hoy):
        """Arma el correo del recordatorio con el mismo estilo del resto del sistema."""
        fecha = loan.loan_date_in.strftime('%d/%m/%Y')
        titulo = (
            'Un préstamo vence hoy' if es_hoy
            else 'Un préstamo vence mañana'
        )
        mensaje = (
            f'El préstamo <strong>{loan.loan_code}</strong> vence <strong>hoy ({fecha})</strong>.'
            if es_hoy else
            f'El préstamo <strong>{loan.loan_code}</strong> vence <strong>mañana ({fecha})</strong>.'
        )

        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif; color: #242424; }}
                .container {{ max-width: 500px; background-color: #ffffff; border-radius: 1rem; border: 2px solid #E1F2D8; margin: 20px auto; overflow: hidden; }}
                .header {{ background: linear-gradient(to right, #72277C, #163F5C); padding: 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 1px; }}
                .content {{ padding: 32px 24px; text-align: center; }}
                .datos {{ text-align: left; background-color: #fafafa; border-radius: 0.75rem; padding: 16px; margin-top: 16px; font-size: 0.9rem; }}
                .datos p {{ margin: 4px 0; }}
                .footer {{ padding: 24px; text-align: center; border-top: 1px solid #D1D1D1; background-color: #fafafa; }}
                .footer p {{ margin: 0; font-size: 0.75rem; color: #878787; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>SIGI</h1></div>
                <div class="content">
                    <h2 style="margin-top:0; color:#007A33;">{titulo}</h2>
                    <p>Hola {lender.first_name}, {mensaje}</p>
                    <div class="datos">
                        <p><strong>Código:</strong> {loan.loan_code}</p>
                        <p><strong>Solicitante:</strong> {loan.loan_user_requester.first_name} {loan.loan_user_requester.last_name}</p>
                        <p><strong>Ficha / Grupo:</strong> {loan.loan_students_group}</p>
                        <p><strong>Fecha de entrega:</strong> {fecha}</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Correo enviado automáticamente por SIGI. Por favor no respondas a este mensaje.</p>
                </div>
            </div>
        </body>
        </html>
        """
