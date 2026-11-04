#!/usr/bin/env python3
"""
send-outreach.py - send the widget-outreach pitches from the site's OWN
Namecheap mailbox (contact@blueseasfishing.com) over SMTP, and update
internal-docs/outreach-tracker.xlsx only for emails the server actually
accepted (the tracker previously showed "sent" for mail that never left -
this script closes that hole).

Credentials live in mail-creds.py NEXT TO THIS FILE (same local-creds
pattern as deploy.py's FTP creds - do NOT commit it, do NOT paste the
password into chat):

    MAIL_HOST = "mail.blueseasfishing.com"    # cPanel SMTP host (or the server hostname)
    MAIL_PORT = 465                           # 465 = implicit SSL, 587 = STARTTLS
    MAIL_USE_SSL = True                       # False when using port 587
    MAIL_USER = "contact@blueseasfishing.com" # the mailbox, not the cPanel username
    MAIL_PASSWORD = "..."                     # the MAILBOX password (separate from FTP)

Usage:
    python send-outreach.py            # DRY RUN - prints exactly what would be sent
    python send-outreach.py --send     # actually dispatches

X-Head Fishing Charters has no published email - that pitch must go through
https://www.xheadfishingcharters.com/contact manually (see WIDGET-OUTREACH.md).
"""

import sys
import time
import smtplib
import datetime
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from pathlib import Path

BASE = Path(__file__).resolve().parent

# ---------------------------------------------------------------- credentials
try:
    from mail_creds import MAIL_HOST, MAIL_PORT, MAIL_USE_SSL, MAIL_USER, MAIL_PASSWORD
except ImportError:
    sys.exit("Missing mail_creds.py next to this script. Open mail_creds.py with\n"
             "Notepad and fill in the mailbox password (the same password your\n"
             "email app uses for contact@blueseasfishing.com). Never paste it in chat.")

# ------------------------------------------------------------------- messages
if not str(MAIL_PASSWORD).strip():
    sys.exit("mail_creds.py still has an empty password.\n"
             "Open mail_creds.py with Notepad, type the contact@ mailbox password\n"
             "between the quotes on the MAIL_PASSWORD line, save the file, and try again.")

# Bodies are the BATCH 2 drafts from internal-docs/WIDGET-OUTREACH.md
# (personalized, demo-first, no "free" in the subject - per the Sep 28
# post-mortem). Keep in sync with that file.
OUTREACH = [
    {
        "site": "Precision Backcountry Charters",
        "to": "ikemeier98@gmail.com",
        "subject": 'The "what was that fish?" question from your hogfish clients',
        "body": """Hi Capt. Michael,

Your site says redfish, kingfish, snook, hogfish - and hogfish is the one that always
gets a "what IS that?" from clients. We built a tool that answers it: upload a catch
photo, get the likely species in seconds, plus bait tips and a full profile from a
548-species database. Demo takes 30 seconds:
https://www.blueseasfishing.com/fish-id-widget.html

It can live right on your site as a small embed - two lines of HTML, we host and
maintain everything on our side, no signup. The only cost is a small "Powered by
Blue Seas Fishing" line inside it.

Want me to build a version styled to match precisionbackcountrycharters.com? Takes me
a minute and it's yours to paste in.

Serge
Blue Seas Fishing""",
    },
    {
        "site": "Steady Action Fishing Charters",
        "to": "captjasonp@gmail.com",
        "subject": "Instant fish IDs for Steady Action's trip reports",
        "body": """Hi Capt. Jason,

You've been running Tampa Bay charters since 2004, and your trip reports are exactly
where clients ask "what was that fish we just boated?" We built an AI fish-ID tool
that answers on the spot: upload a photo, get the species plus bait suggestions,
linked to full profiles for 548 species. Try it with any fish photo - 30 seconds:
https://www.blueseasfishing.com/fish-id-widget.html

It embeds on your site with two lines of HTML; we host and maintain everything. Free
to you - the only price is a small attribution line inside the widget.

Happy to style it to match your bay-boat branding if you're interested.

Serge
Blue Seas Fishing""",
    },
]

TRACKER = BASE / "internal-docs" / "outreach-tracker.xlsx"


def render(msg):
    m = MIMEText(msg["body"], "plain", "utf-8")
    m["Subject"] = msg["subject"]
    m["From"] = MAIL_USER
    m["To"] = msg["to"]
    m["Date"] = formatdate(localtime=True)
    m["Message-ID"] = make_msgid()
    return m


SENT_DIR = BASE / "internal-docs" / "sent-log"


def save_local_copy(mime, site):
    """Keep a .eml copy on this computer so there's always a local record."""
    try:
        SENT_DIR.mkdir(parents=True, exist_ok=True)
        safe = "".join(c if c.isalnum() or c in "-_" else "-" for c in site)
        stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        p = SENT_DIR / f"{stamp}-{safe}.eml"
        p.write_bytes(mime.as_bytes())
        print(f"    local copy saved: internal-docs\\sent-log\\{p.name}")
    except Exception as e:
        print(f"    (local copy could not be saved: {e})")


def save_server_sent_copy(mime):
    """Append the message to the mailbox's Sent folder over IMAP, so it shows
    up in webmail / your phone exactly like an email you sent by hand.
    SMTP alone never files a Sent copy - that's why the folder looked empty.
    Best-effort: a failure here never means the email wasn't sent."""
    import imaplib
    try:
        imap = imaplib.IMAP4_SSL(MAIL_HOST)
        imap.login(MAIL_USER, MAIL_PASSWORD)
    except Exception as e:
        print(f"    (server Sent copy skipped - IMAP login failed: {e})")
        return False
    try:
        for folder in ("Sent", "INBOX.Sent", "Sent Items", "[Gmail]/Sent Mail"):
            try:
                typ, _ = imap.append(
                    folder, "\\Seen",
                    imaplib.Time2Internaldate(time.time()),
                    mime.as_bytes(),
                )
                if typ == "OK":
                    print(f"    copy filed in the server Sent folder")
                    return True
            except Exception:
                continue
        print("    (server Sent copy skipped - no Sent folder found on the server)")
        return False
    finally:
        try:
            imap.logout()
        except Exception:
            pass


def mark_tracker(msg):
    """Flip the matching row to sent - only called after SMTP accepted it."""
    try:
        import openpyxl
    except ImportError:
        print("  (openpyxl missing - update the tracker by hand)")
        return
    wb = openpyxl.load_workbook(TRACKER)
    ws = wb["Tracker"]
    today = datetime.date.today().isoformat()
    for row in ws.iter_rows(min_row=2):
        if row[1].value and msg["site"].split()[0] in str(row[1].value):
            row[8].value = "sent"
            row[9].value = today
            row[11].value = f"Batch 2 sent via SMTP ({MAIL_USER})"
            break
    wb.save(TRACKER)


def main():
    send = "--send" in sys.argv
    print(f"Mode: {'SEND' if send else 'DRY RUN (pass --send to dispatch)'}")
    print(f"From: {MAIL_USER} via {MAIL_HOST}:{MAIL_PORT} "
          f"({'SSL' if MAIL_USE_SSL else 'STARTTLS'})\n")

    sent_ok = 0
    for msg in OUTREACH:
        print(f"--- {msg['site']} -> {msg['to']}")
        print(f"    Subject: {msg['subject']}")
        if not send:
            print("    [dry run] body:\n")
            for line in msg["body"].splitlines():
                print(f"      {line}")
            print()
            continue
        mime = render(msg)
        try:
            if MAIL_USE_SSL:
                with smtplib.SMTP_SSL(MAIL_HOST, MAIL_PORT, timeout=30) as s:
                    s.login(MAIL_USER, MAIL_PASSWORD)
                    s.sendmail(MAIL_USER, [msg["to"]], mime.as_string())
            else:
                with smtplib.SMTP(MAIL_HOST, MAIL_PORT, timeout=30) as s:
                    s.starttls()
                    s.login(MAIL_USER, MAIL_PASSWORD)
                    s.sendmail(MAIL_USER, [msg["to"]], mime.as_string())
            print("    OK - accepted by server; tracker updated")
            mark_tracker(msg)
            save_local_copy(mime, msg["site"])
            save_server_sent_copy(mime)
            sent_ok += 1
        except smtplib.SMTPAuthenticationError:
            sys.exit("    AUTH FAILED - check MAIL_USER/MAIL_PASSWORD in mail_creds.py\n"
                     "    (cPanel email passwords are separate from FTP/cPanel logins;\n"
                     "    reset it in cPanel > Email Accounts if unsure). Nothing was sent.")
        except Exception as e:
            print(f"    FAILED: {e} - NOT marked sent in the tracker")

    if send:
        print(f"\nDone: {sent_ok}/{len(OUTREACH)} accepted.")
        print("Reminder: X-Head still needs the /contact form filled manually.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
