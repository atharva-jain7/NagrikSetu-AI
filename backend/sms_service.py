"""
NagrikSetu AI — Twilio SMS & OTP Service
Supports sending real SMS for OTP and Grievance Registration via Twilio REST API.
Gracefully falls back to local dispatch logging if Twilio credentials are not configured.
"""
import os
import datetime
from typing import Optional, Dict, Any

LOG_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(LOG_DIR, ".env")
SENT_SMS_LOG = os.path.join(LOG_DIR, "sent_sms.log")

def _load_env_file():
    """Lightweight .env parser without external dependencies."""
    env_vars = {}
    if os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'").strip('"')
                        env_vars[k] = v
        except Exception as e:
            print(f"[TwilioSMS] Error reading .env: {e}")
    return env_vars

_file_env = _load_env_file()

# Global memory credentials (reads from OS env, then .env file, or dynamically updated via API / UI)
_TWILIO_CONFIG = {
    "account_sid": os.environ.get("TWILIO_ACCOUNT_SID", "") or _file_env.get("TWILIO_ACCOUNT_SID", ""),
    "auth_token": os.environ.get("TWILIO_AUTH_TOKEN", "") or _file_env.get("TWILIO_AUTH_TOKEN", ""),
    "phone_number": os.environ.get("TWILIO_PHONE_NUMBER", "") or _file_env.get("TWILIO_PHONE_NUMBER", "")
}


def set_twilio_credentials(account_sid: str, auth_token: str, phone_number: str) -> Dict[str, Any]:
    """Dynamically sets Twilio credentials and persists to .env."""
    _TWILIO_CONFIG["account_sid"] = account_sid.strip()
    _TWILIO_CONFIG["auth_token"] = auth_token.strip()
    _TWILIO_CONFIG["phone_number"] = phone_number.strip()
    
    # Save to .env for persistence
    try:
        lines = []
        if os.path.exists(ENV_FILE):
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        updated_keys = set()
        new_lines = []
        for line in lines:
            if line.startswith("TWILIO_ACCOUNT_SID="):
                new_lines.append(f"TWILIO_ACCOUNT_SID={account_sid.strip()}\n")
                updated_keys.add("TWILIO_ACCOUNT_SID")
            elif line.startswith("TWILIO_AUTH_TOKEN="):
                new_lines.append(f"TWILIO_AUTH_TOKEN={auth_token.strip()}\n")
                updated_keys.add("TWILIO_AUTH_TOKEN")
            elif line.startswith("TWILIO_PHONE_NUMBER="):
                new_lines.append(f"TWILIO_PHONE_NUMBER={phone_number.strip()}\n")
                updated_keys.add("TWILIO_PHONE_NUMBER")
            else:
                new_lines.append(line)
        
        if "TWILIO_ACCOUNT_SID" not in updated_keys:
            new_lines.append(f"TWILIO_ACCOUNT_SID={account_sid.strip()}\n")
        if "TWILIO_AUTH_TOKEN" not in updated_keys:
            new_lines.append(f"TWILIO_AUTH_TOKEN={auth_token.strip()}\n")
        if "TWILIO_PHONE_NUMBER" not in updated_keys:
            new_lines.append(f"TWILIO_PHONE_NUMBER={phone_number.strip()}\n")
            
        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as save_err:
        print(f"[TwilioSMS] Note: Failed to persist to .env: {save_err}")

    print(f"[TwilioSMS] Credentials updated for Account SID: {account_sid[:6]}... / Phone: {phone_number}")
    return get_twilio_status()


def get_twilio_status() -> Dict[str, Any]:
    """Returns the current Twilio integration status."""
    is_conf = bool(_TWILIO_CONFIG["account_sid"] and _TWILIO_CONFIG["auth_token"] and _TWILIO_CONFIG["phone_number"])
    sid = _TWILIO_CONFIG["account_sid"]
    masked_sid = f"{sid[:6]}...{sid[-4:]}" if len(sid) > 10 else ("Configured" if sid else "Not Configured")
    return {
        "configured": is_conf,
        "account_sid": masked_sid,
        "phone_number": _TWILIO_CONFIG["phone_number"] or "Not Set",
        "mode": "Live Twilio SMS Gateway" if is_conf else "Local Simulation Mode (Console & sent_sms.log)"
    }


def format_indian_mobile(mobile: str) -> str:
    """Ensure mobile has +91 country code prefix."""
    clean = mobile.strip().replace(" ", "").replace("-", "")
    if clean.startswith("+"):
        return clean
    if clean.startswith("91") and len(clean) == 12:
        return f"+{clean}"
    if len(clean) == 10:
        return f"+91{clean}"
    return f"+91{clean}"


def send_twilio_sms(to_mobile: str, message_body: str) -> Dict[str, Any]:
    """
    Sends SMS using Twilio Client if credentials are provided.
    Always logs to sent_sms.log.
    """
    if not to_mobile:
        return {"success": False, "error": "Missing phone number"}

    phone = format_indian_mobile(to_mobile)
    is_configured = bool(_TWILIO_CONFIG["account_sid"] and _TWILIO_CONFIG["auth_token"] and _TWILIO_CONFIG["phone_number"])

    # Log to sent_sms.log
    timestamp_now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp_now}] TO: {phone} | MESSAGE: {message_body}\n"
    try:
        with open(SENT_SMS_LOG, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"[TwilioSMS] Log error: {e}")

    if is_configured:
        try:
            from twilio.rest import Client
            client = Client(_TWILIO_CONFIG["account_sid"], _TWILIO_CONFIG["auth_token"])
            message = client.messages.create(
                body=message_body,
                from_=_TWILIO_CONFIG["phone_number"],
                to=phone
            )
            print(f"[TwilioSMS] Real SMS sent to {phone} (SID: {message.sid})")
            return {"success": True, "sid": message.sid, "live_sent": True}
        except Exception as err:
            print(f"[TwilioSMS] Twilio dispatch failed: {err}")
            return {"success": False, "error": str(err), "live_sent": False}
    else:
        print(f"[TwilioSMS] Local Simulation Mode. SMS logged for {phone}: '{message_body}'")
        return {"success": True, "live_sent": False, "message": "Logged to sent_sms.log"}


def send_otp_sms(to_mobile: str, otp: str) -> Dict[str, Any]:
    """Sends OTP SMS."""
    body = f"[NagrikSetu] Your verification OTP is: {otp}. Valid for 5 minutes. Do not share this code with anyone."
    return send_twilio_sms(to_mobile, body)


def send_grievance_sms(to_mobile: str, complaint_id: str, defect: str, department: str) -> Dict[str, Any]:
    """Sends Grievance Registration Confirmation SMS."""
    body = f"[NagrikSetu] Grievance #{complaint_id} ({defect}) registered & assigned to {department}. Target SLA: 24-48h. Track live on portal."
    return send_twilio_sms(to_mobile, body)
