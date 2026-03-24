import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import os

# ── Email Config ──────────────────────────────────────────────────────────────
# Fill in your Gmail credentials here
EMAIL_HOST     = "smtp.gmail.com"
EMAIL_PORT     = 587
EMAIL_USER     = os.getenv("NGO_EMAIL_USER", "")   # your Gmail address
EMAIL_PASSWORD = os.getenv("NGO_EMAIL_PASS", "")   # your Gmail App Password
EMAIL_FROM_NAME = "NGO Funding Tracker"


def _is_configured() -> bool:
    return bool(EMAIL_USER and EMAIL_PASSWORD)


def _send_raw(to_email: str, subject: str, html_body: str) -> bool:
    """Send a single email. Returns True on success, False on failure."""
    if not _is_configured():
        print(f"[EMAIL] Not configured — would have sent to {to_email}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        print(f"[EMAIL] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False


# ── HTML Email Templates ──────────────────────────────────────────────────────

def _base_template(content: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }}
  .wrap {{ max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
  .header {{ background: linear-gradient(135deg, #041020 0%, #0c1428 100%); padding: 32px 36px 24px; text-align: center; }}
  .header .logo {{ font-size: 36px; margin-bottom: 8px; }}
  .header h1 {{ color: #00e5b0; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }}
  .header p {{ color: #5a7299; font-size: 13px; margin: 4px 0 0; }}
  .body {{ padding: 32px 36px; color: #2d3748; line-height: 1.7; }}
  .highlight {{ background: linear-gradient(135deg, #f0fdf8, #e6fffa); border-left: 4px solid #00e5b0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }}
  .highlight .amount {{ font-size: 28px; font-weight: 800; color: #00b894; }}
  .highlight .label {{ font-size: 13px; color: #636e72; margin-bottom: 4px; }}
  .info-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f4f8; font-size: 14px; }}
  .info-row .key {{ color: #636e72; }}
  .info-row .val {{ font-weight: 600; color: #2d3748; }}
  .btn {{ display: inline-block; background: linear-gradient(135deg, #00e5b0, #00bfa8); color: #041020 !important; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; margin: 20px 0 8px; }}
  .footer {{ background: #f8fafc; padding: 20px 36px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; }}
  .tag {{ display: inline-block; background: #e6fffa; color: #00b894; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }}
  .expense-row {{ background: #fffbf0; border-left: 4px solid #ffb547; border-radius: 8px; padding: 14px 18px; margin: 16px 0; }}
  .expense-row .exp-amount {{ font-size: 22px; font-weight: 800; color: #d4860a; }}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">🌱</div>
    <h1>NGO Funding Tracker</h1>
    <p>Transparent funding for a better world</p>
  </div>
  <div class="body">{content}</div>
  <div class="footer">
    You received this because you donated to a project on NGO Funding Tracker.<br>
    This is an automated notification — please do not reply to this email.
  </div>
</div>
</body>
</html>
"""


def send_donation_confirmation(to_email: str, donor_name: str, project_name: str, amount: float) -> bool:
    content = f"""
    <p>Hi <strong>{donor_name}</strong>,</p>
    <p>Thank you so much for your generous donation! 💚 Your contribution has been successfully recorded.</p>

    <div class="highlight">
      <div class="label">Amount Donated</div>
      <div class="amount">₹{amount:,.0f}</div>
    </div>

    <div class="info-row"><span class="key">Project</span><span class="val">{project_name}</span></div>
    <div class="info-row"><span class="key">Status</span><span class="val"><span class="tag">✓ Confirmed</span></span></div>

    <p style="margin-top:20px;">You can track exactly how your funds are being used on the project dashboard. Every expense is recorded with full transparency.</p>
    <p>Thank you for making a difference! 🙏</p>
    """
    return _send_raw(to_email, f"✅ Donation Confirmed — ₹{amount:,.0f} to {project_name}", _base_template(content))


def send_expense_update(to_email: str, donor_name: str, project_name: str, purpose: str, amount: float, remaining: float) -> bool:
    content = f"""
    <p>Hi <strong>{donor_name}</strong>,</p>
    <p>The NGO has recorded a new expense under a project you've supported. Here are the details:</p>

    <div class="expense-row">
      <div class="label" style="color:#636e72;font-size:13px;margin-bottom:4px;">Expense Recorded</div>
      <div class="exp-amount">₹{amount:,.0f}</div>
      <div style="font-size:14px;color:#2d3748;margin-top:4px;">for <strong>{purpose}</strong></div>
    </div>

    <div class="info-row"><span class="key">Project</span><span class="val">{project_name}</span></div>
    <div class="info-row"><span class="key">Remaining Balance</span><span class="val">₹{remaining:,.0f}</span></div>

    <p style="margin-top:20px;">Your donation is being put to work! You can see the full spending breakdown on the project dashboard anytime.</p>
    """
    return _send_raw(to_email, f"🧾 Fund Update — {project_name}", _base_template(content))


def send_ngo_broadcast(to_emails: List[str], subject: str, message: str, ngo_name: str) -> dict:
    """Send a custom broadcast email from NGO to a list of donor emails."""
    content = f"""
    <p>This is a message from <strong>{ngo_name}</strong>:</p>
    <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin:20px 0;border:1px solid #e2e8f0;font-size:15px;line-height:1.8;color:#2d3748;">
      {message.replace(chr(10), '<br>')}
    </div>
    <p style="color:#636e72;font-size:13px;">Thank you for your continued support of our mission.</p>
    """
    html = _base_template(content)
    results = {"sent": [], "failed": []}
    for email in to_emails:
        ok = _send_raw(email, subject, html)
        if ok:
            results["sent"].append(email)
        else:
            results["failed"].append(email)
    return results


def get_email_config_status() -> dict:
    return {
        "configured": _is_configured(),
        "email_user": EMAIL_USER if _is_configured() else "",
        "message": "Email sending is active" if _is_configured() else "Email not configured — set NGO_EMAIL_USER and NGO_EMAIL_PASS environment variables"
    }