import os
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage


SMTP_HOST = os.getenv("SMTP_HOST", "smtp.office365.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "educore@glimmora.ai")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
MAIL_TO = os.getenv("MAIL_TO", "sfayazmr@gmail.com")
MAIL_FROM = os.getenv("MAIL_FROM", f"Glimmora EduCore <{SMTP_USER}>")


def require_env(name: str, value: str | None) -> str:
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def build_message() -> EmailMessage:
    sent_at = datetime.now(timezone.utc).isoformat()

    message = EmailMessage()
    message["Subject"] = "Glimmora EduCore SMTP Test"
    message["From"] = MAIL_FROM
    message["To"] = MAIL_TO
    message.set_content(
        "SMTP test successful.\n\n"
        "This is a diagnostic email sent from backend/testing/test_smtp_mail.py "
        "to verify SMTP authentication and outbound delivery.\n\n"
        f"Sent at: {sent_at}\n"
    )
    message.add_alternative(
        f"""\
<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <h2 style="color: #111827;">SMTP test successful</h2>
    <p>
      This is a diagnostic email sent from
      <strong>backend/testing/test_smtp_mail.py</strong> to verify SMTP
      authentication and outbound delivery.
    </p>
    <p><strong>Sent at:</strong> {sent_at}</p>
  </body>
</html>
""",
        subtype="html",
    )
    return message


def send_test_mail() -> None:
    password = require_env("SMTP_PASSWORD", SMTP_PASSWORD)
    message = build_message()

    print("[smtp] host:", SMTP_HOST)
    print("[smtp] port:", SMTP_PORT)
    print("[smtp] user:", SMTP_USER)
    print("[smtp] password: set")
    print("[mail] from:", MAIL_FROM)
    print("[mail] to:", MAIL_TO)

    context = ssl.create_default_context()

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=60) as server:
                server.login(SMTP_USER, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=60) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(SMTP_USER, password)
                server.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        response = exc.smtp_error.decode("utf-8", errors="replace")
        raise SystemExit(f"[smtp] authentication failed: {exc.smtp_code} {response}") from exc
    except smtplib.SMTPException as exc:
        raise SystemExit(f"[smtp] send failed: {exc}") from exc

    print("[mail] sent successfully")


if __name__ == "__main__":
    send_test_mail()
