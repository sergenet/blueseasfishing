#!/usr/bin/env python3
"""
social-autoposter.py - Automated Daily Social Media Poster for Blue Seas Fishing
Rotates images and MP4 videos daily across social channels (Facebook, Instagram,
Twitter/X, TikTok, Pinterest) with full UTM tracking and attribution logging.

Usage:
    python social-autoposter.py --run-today
    python social-autoposter.py --day 1
    python social-autoposter.py --status
    python social-autoposter.py --preview 2
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error
from datetime import datetime

SCHEDULE_FILE = r"C:\blueseasfishing\tools\campaign-30day-schedule.json"
STATE_FILE = r"C:\blueseasfishing\logs\social-campaign\campaign-state.json"
LOG_DIR = r"C:\blueseasfishing\logs\social-campaign"
ENV_FILE = r"C:\blueseasfishing\.env"

def load_env():
    env = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env

def load_schedule():
    if not os.path.isfile(SCHEDULE_FILE):
        raise FileNotFoundError(f"Schedule file not found: {SCHEDULE_FILE}")
    with open(SCHEDULE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_state():
    if os.path.isfile(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"posts": [], "last_run": None, "total_posted": 0}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    # Automatically sync control-room data
    try:
        control_data_file = r"C:\blueseasfishing\control-room\campaign-data.js"
        sched_data = load_schedule()
        data_js = f"window.CAMPAIGN_DATA = {json.dumps(sched_data, indent=2)};\nwindow.CAMPAIGN_STATE = {json.dumps(state, indent=2)};\n"
        with open(control_data_file, "w", encoding="utf-8") as f:
            f.write(data_js)
    except Exception:
        pass

def dispatch_webhook(webhook_url, payload):
    """Sends payload to a configured webhook (e.g., Make, Zapier, Buffer, Discord)."""
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "BlueSeasSocialBot/1.0"
    }
    
    # Check if Discord webhook
    if "discord.com" in webhook_url:
        discord_data = {
            "content": f"**[Blue Seas Fishing - Day {payload['day']} Social Dispatch]**\n"
                       f"**Theme:** {payload['theme']}\n"
                       f"**Asset:** `{payload['primary_asset']}` ({payload['asset_type'].upper()})\n\n"
                       f"**Facebook / Link:** {payload['platforms']['facebook']['tracking_url']}\n"
                       f"**Twitter:** {payload['platforms']['twitter']['text']}"
        }
        req_data = json.dumps(discord_data).encode("utf-8")
    else:
        req_data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(webhook_url, data=req_data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return True, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP Error {e.code}: {e.reason}"
    except Exception as e:
        return False, str(e)

def format_daily_markdown(item):
    md = []
    md.append(f"# Blue Seas Fishing - Social Post for Day {item['day']} ({item['date']})")
    md.append(f"**Day of Week:** {item['day_of_week']}")
    avatar = item.get('profile_picture') or r"C:\blueseasfishing\Assets\android\icon-new-512.png"
    md.append(f"**Theme:** {item['theme']}")
    md.append(f"**Target Profile:** Blue Seas Fishing (@blueseasfishing)")
    md.append(f"**Profile Picture:** `{avatar}`")
    md.append(f"**Hook:** *\"{item['hook']}\"*")
    md.append(f"**Asset Type:** {item['asset_type'].upper()}")
    md.append(f"**Primary Asset:** `{item['primary_asset_path']}`")
    if item.get("secondary_asset_path"):
        md.append(f"**Vertical (9:16) Asset:** `{item['secondary_asset_path']}`")
    md.append(f"**Target Landing Page:** {item['target_landing_page']}")
    md.append("\n---\n")

    p = item["platforms"]
    
    md.append("## 1. Facebook Post (Feed + Groups)")
    md.append(f"**Asset:** `{item['primary_asset']}`")
    md.append("```text")
    md.append(p["facebook"]["text"])
    md.append("```")
    md.append(f"**Trackable Link:** {p['facebook']['tracking_url']}\n")

    md.append("## 2. Instagram Post (Feed / Reel / Story)")
    md.append(f"**Asset:** `{item.get('secondary_asset') or item['primary_asset']}`")
    md.append("```text")
    md.append(p["instagram"]["text"])
    md.append("```")
    md.append(f"**Bio / Sticker Link:** {p['instagram']['tracking_url']}\n")

    md.append("## 3. X / Twitter (Feed Tweet)")
    md.append(f"**Asset:** `{item['primary_asset']}`")
    md.append("```text")
    md.append(p["twitter"]["text"])
    md.append("```")
    md.append(f"**Trackable Link:** {p['twitter']['tracking_url']}\n")

    md.append("## 4. TikTok / YouTube Shorts (Short-form Video)")
    if item["asset_type"] == "video":
        md.append(f"**Video File:** `{item['primary_asset']}`")
    else:
        md.append(f"**Photo Mode / Story Slides:** `{item.get('secondary_asset') or item['primary_asset']}`")
    md.append("```text")
    md.append(p["tiktok"]["text"])
    md.append("```")
    md.append(f"**Bio Link:** {p['tiktok']['tracking_url']}\n")

    md.append("## 5. Pinterest (Rich Visual Pin)")
    md.append(f"**Asset:** `{item.get('secondary_asset') or item['primary_asset']}`")
    md.append(f"**Pin Title:** {p['pinterest']['title']}")
    md.append(f"**Pin Description:** {p['pinterest']['description']}")
    md.append(f"**Destination URL:** {p['pinterest']['tracking_url']}\n")

    md.append("---\n")
    md.append("## Effectiveness & KPI Measurement")
    md.append(f"- **Primary Metric:** {item['kpis']['primary_metric']}")
    md.append(f"- **Secondary Metric:** {item['kpis']['secondary_metric']}")
    md.append(f"- **Benchmark Goal:** {item['kpis']['benchmark_target']}")

    return "\n".join(md)

def execute_post(day_num, test_only=False):
    schedule_data = load_schedule()
    schedule = schedule_data["schedule"]
    
    target_item = None
    for item in schedule:
        if item["day"] == day_num:
            target_item = item
            break
            
    if not target_item:
        print(f"Error: Day {day_num} not found in campaign schedule (1-30).")
        sys.exit(1)
        
    print(f"\n=======================================================")
    print(f" BLUE SEAS FISHING - AUTO SOCIAL POSTER")
    print(f" Day {target_item['day']} ({target_item['date']}) - {target_item['day_of_week']}")
    print(f"=======================================================")
    print(f"Theme: {target_item['theme']}")
    print(f"Asset: {target_item['primary_asset']} ({target_item['asset_type'].upper()})")
    print(f"Path:  {target_item['primary_asset_path']}")
    
    # Verify file exists
    if not os.path.isfile(target_item["primary_asset_path"]):
        print(f"WARNING: Primary asset file missing: {target_item['primary_asset_path']}")
    else:
        size_mb = round(os.path.getsize(target_item["primary_asset_path"]) / (1024*1024), 2)
        print(f"Asset Verified: OK ({size_mb} MB)")
        
    # Check Webhook
    env = load_env()
    webhook_url = env.get("SOCIAL_WEBHOOK_URL") or os.environ.get("SOCIAL_WEBHOOK_URL")
    
    webhook_status = "Not Configured"
    if webhook_url:
        if test_only:
            webhook_status = f"Simulated OK (Dry Run to {webhook_url[:30]}...)"
        else:
            success, msg = dispatch_webhook(webhook_url, target_item)
            webhook_status = f"Dispatched: {msg}" if success else f"Failed: {msg}"
            print(f"Webhook Notification: {webhook_status}")
    else:
        print("Note: SOCIAL_WEBHOOK_URL not configured. Recording to daily dispatch logs.")

    # Write daily markdown file
    os.makedirs(LOG_DIR, exist_ok=True)
    daily_md_path = os.path.join(LOG_DIR, f"daily-post-{target_item['date']}.md")
    daily_json_path = os.path.join(LOG_DIR, f"daily-post-{target_item['date']}.json")
    
    md_content = format_daily_markdown(target_item)
    with open(daily_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    with open(daily_json_path, "w", encoding="utf-8") as f:
        json.dump(target_item, f, indent=2)
        
    print(f"Daily Post Pack saved to: {daily_md_path}")
    
    # Update state
    if not test_only:
        state = load_state()
        post_record = {
            "day": target_item["day"],
            "date": target_item["date"],
            "timestamp": datetime.now().isoformat(),
            "theme": target_item["theme"],
            "asset_type": target_item["asset_type"],
            "primary_asset": target_item["primary_asset"],
            "webhook_status": webhook_status,
            "md_log": daily_md_path
        }
        # Avoid duplicate records for same day
        state["posts"] = [p for p in state["posts"] if p["day"] != target_item["day"]]
        state["posts"].append(post_record)
        state["last_run"] = datetime.now().isoformat()
        state["total_posted"] = len(state["posts"])
        save_state(state)
        print(f"Campaign State Updated: {state['total_posted']}/30 days posted.")

    print("\n--- Platform Summary & Attribution Links ---")
    for plat, pdata in target_item["platforms"].items():
        print(f"[{plat.upper()}]: {pdata['tracking_url']}")
    print("=======================================================\n")

def get_day_for_today():
    schedule_data = load_schedule()
    start_dt = datetime.strptime(schedule_data["start_date"], "%Y-%m-%d").date()
    today_dt = datetime.now().date()
    diff = (today_dt - start_dt).days + 1
    if diff < 1:
        return 1
    elif diff > 30:
        return ((diff - 1) % 30) + 1
    return diff

def main():
    parser = argparse.ArgumentParser(description="Blue Seas Fishing Social Autoposter")
    parser.add_argument("--run-today", action="store_true", help="Execute post for today's scheduled rotation")
    parser.add_argument("--day", type=int, help="Execute specific campaign day (1-30)")
    parser.add_argument("--preview", type=int, help="Preview post copy and assets for day N without recording")
    parser.add_argument("--status", action="store_true", help="Show current campaign status and posting history")
    
    args = parser.parse_args()
    
    if args.status:
        state = load_state()
        print(f"Campaign Status:")
        print(f"  Total Days Posted: {state.get('total_posted', 0)} / 30")
        print(f"  Last Run: {state.get('last_run', 'Never')}")
        for p in state.get("posts", []):
            print(f"    - Day {p['day']} ({p['date']}): {p['theme']} [{p['asset_type']}]")
        return

    if args.preview:
        execute_post(args.preview, test_only=True)
        return

    if args.day:
        execute_post(args.day)
        return

    if args.run_today:
        day_num = get_day_for_today()
        execute_post(day_num)
        return

    # Default action if no args
    parser.print_help()

if __name__ == "__main__":
    main()
