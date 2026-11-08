#!/usr/bin/env python3
"""
generate_campaign.py - Generates the complete 30-Day Blue Seas Fishing Social Media Campaign
with daily rotation of images and MP4 videos from C:\\blueseasfishing\\Assets\\zeely-ads,
platform-tailored copy, and UTM attribution tracking for Facebook, Instagram, X/Twitter,
TikTok, and Pinterest.
"""

import json
import os
from datetime import datetime, timedelta

BASE_ASSET_DIR = r"C:\blueseasfishing\Assets\zeely-ads"
OUTPUT_SCHEDULE_FILE = r"C:\blueseasfishing\tools\campaign-30day-schedule.json"

# Core Landing Pages following the TRAFFIC-PLAN rule (never homepage)
URL_FISH_ID = "https://www.blueseasfishing.com/fish-id.html"
URL_LARGEMOUTH = "https://www.blueseasfishing.com/largemouth-bass-vs-spotted-bass-identification.html"
URL_PIKE = "https://www.blueseasfishing.com/species/northern-pike.html"
URL_TROUT_GUIDES = "https://www.blueseasfishing.com/fish-identification-guides.html"
URL_GEAR = "https://www.blueseasfishing.com/recommended-fishing-gear.html"

# 30-Day Master Campaign Templates rotating Video vs Image daily
ROTATION_TEMPLATES = [
    # Day 1 - Video
    {
        "type": "video",
        "slug": "ai_id_reel_demo",
        "primary_asset": "blueseasfishing-ai-id-reel.mp4",
        "secondary_asset": None,
        "theme": "AI Fish Identification Instant Scan",
        "target_url": URL_FISH_ID,
        "hook": "Snap. Scan. Identified in 3 seconds.",
        "fb_copy": "🎣 Ever hauled a mystery catch over the gunwale and wondered what you just hooked? Don't guess—snap a photo and let Blue Seas AI identify it in seconds. 548 species, 98% accuracy, completely free to test out on your next trip! 🐟📲",
        "ig_copy": "Snap. Identify. Catch. 🌊 Stop guessing at the boat ramp—our AI scans 548 freshwater and saltwater species in under 3 seconds.\n\n👉 Test it free at link in bio!\n\n#FishingLife #FishID #BassFishing #Angler #SaltwaterFishing #FreshwaterFishing #BlueSeasFishing",
        "twitter_copy": "Haul up a mystery fish? Don't guess. Snap a photo and let our AI ID tool identify it in seconds across 548 species. Free to try on your next trip: {link} #FishID #FishingCommunity",
        "tiktok_copy": "Can AI actually identify any fish you catch? Watch this real test on 548 species! Link in bio to try it yourself 🎣⚡ #fishing #fishid #catchandrelease #angler #tech",
        "pinterest_title": "Identify Any Fish in Seconds with AI - Free Tool",
        "pinterest_desc": "Haul up a mystery catch? Use Blue Seas Fishing AI identifier to scan 548 species with instant accuracy. Try it free online!"
    },
    # Day 2 - Image
    {
        "type": "image",
        "slug": "bass_comparison_quiz",
        "primary_asset": "B-largemouth-1080x1080.jpg",
        "secondary_asset": "B-largemouth-1080x1920.jpg",
        "theme": "Largemouth Bass vs Spotted Bass Visual Breakdown",
        "target_url": URL_LARGEMOUTH,
        "hook": "9 out of 10 anglers mix these up.",
        "fb_copy": "🐟 9 out of 10 anglers mix these up! Can you tell a Spotted Bass from a Largemouth Bass before it hits the net? Check the jawline hinge and tooth patch differences in our side-by-side identification guide.",
        "ig_copy": "Can you spot the difference before it hits the livewell? 🎣 Largemouth vs Spotted Bass tricks even tournament veterans.\n\nSwipe to compare the jawline & dorsal fin clues! Full breakdown linked in bio.\n\n#BassFishing #LargemouthBass #SpottedBass #TournamentFishing #BassAngler",
        "twitter_copy": "9 out of 10 anglers confuse Largemouth and Spotted Bass. Do you know the jawline and tongue patch test? Learn how to tell them apart instantly: {link} #BassFishing",
        "tiktok_copy": "The #1 fish ID mistake anglers make: Largemouth vs Spotted Bass. Know the signs before your next tournament weigh-in! #bassfishing #fishingtips #largemouth",
        "pinterest_title": "Largemouth vs Spotted Bass Identification Guide",
        "pinterest_desc": "How to tell the difference between a largemouth bass and spotted bass. Visual ID guide, fin shapes, jaw position, and tooth patch comparisons."
    },
    # Day 3 - Video
    {
        "type": "video",
        "slug": "boat_catch_action",
        "primary_asset": "fishing boat catch.mp4",
        "secondary_asset": None,
        "theme": "Offshore Action & Saltwater Trophy ID",
        "target_url": URL_FISH_ID,
        "hook": "When the drag screams offshore...",
        "fb_copy": "Nothing beats the scream of a clicker offshore! 🌊 Whether you're trolling weed lines for Mahi or bottom-bumping for Grouper, keep Blue Seas AI in your pocket to log your trophy catches and confirm species regulations instantly.",
        "ig_copy": "Screaming drags and offshore waters! 🚤 When that mystery pelagic surfaces, confirm species, limits, and records with Blue Seas AI.\n\n📲 Link in bio to try the AI fish scanner!\n\n#OffshoreFishing #DeepSeaFishing #SaltwaterAngler #BoatFishing #Trolling",
        "twitter_copy": "Screaming reels and deep sea action. Confirm your catch species and state records in seconds with our AI tool: {link} #SaltwaterFishing #Offshore",
        "tiktok_copy": "That sound never gets old! 🔊 Hooked into an offshore monster. What's your dream saltwater catch? #deepseafishing #boatfishing #offshorefishing #saltwater",
        "pinterest_title": "Offshore Saltwater Fish Identification & Trolling Guide",
        "pinterest_desc": "Catching pelagics offshore? Use the Blue Seas AI fish ID tool to verify species and state regulations right from your boat."
    },
    # Day 4 - Image
    {
        "type": "image",
        "slug": "ai_fishid_hero_ad",
        "primary_asset": "A-fishid-1080x1080.jpg",
        "secondary_asset": "A-fishid-1080x1920.jpg",
        "theme": "Hero AI Fish Identification - 548 Species",
        "target_url": URL_FISH_ID,
        "hook": "Snap. Identify. Catch.",
        "fb_copy": "Not sure what you just caught? Snap a photo—our AI identifies the fish in seconds. Over 548 freshwater and saltwater species covered with tips, habits, and regulations. Free to try right in your mobile browser! 📱🐟",
        "ig_copy": "Identify any catch in seconds. 🐟 548 species, zero guessing. Take a photo on your boat, dock, or kayak and get instant ID.\n\nTap link in bio to try it free!\n\n#FishIdentifier #FishingApp #AnglersOfInstagram #FreshwaterFish #SaltwaterFish #FishingTech",
        "twitter_copy": "Snap a photo of your catch and get instant species ID, size records, and tips. 548 species in seconds: {link} #FishingLife #FishID",
        "tiktok_copy": "Never wonder what fish you caught again. 548 species identified in seconds with AI! Try it free at link in bio 🎣 #fishing #fishid #fisherman #outdoors",
        "pinterest_title": "Instant AI Fish Identification - 548 Species Guide",
        "pinterest_desc": "Take a photo of any fish to identify it immediately. Comprehensive AI database covers 548 species with habitat and angling advice."
    },
    # Day 5 - Video
    {
        "type": "video",
        "slug": "catch_log_reel",
        "primary_asset": "blueseasfishing-catch-log-reel.mp4",
        "secondary_asset": None,
        "theme": "Digital Catch Log & Angler Trophy Diary",
        "target_url": URL_FISH_ID,
        "hook": "Track every catch, spot, and lure.",
        "fb_copy": "📖 Tired of forgetting which lure worked on that chilly morning last November? Log your catches, track water temperatures, and build your digital trophy diary with Blue Seas Fishing. See how easy it is to save your personal bests!",
        "ig_copy": "Build your personal fishing logbook! 🎣 Record your catches, baits, weather patterns, and locations with instant AI species tagging.\n\n📲 Start your digital catch log at link in bio!\n\n#CatchLog #FishingDiary #PersonalBest #AnglerLife #FishingJournal #BassLife",
        "twitter_copy": "Keep track of every PB, weather pattern, and lure that worked. Your digital catch log starts here: {link} #FishingTips #CatchLog",
        "tiktok_copy": "Stop forgetting which lure caught your PB! Build your automatic catch logbook with Blue Seas Fishing 📖🎣 #fishinglife #catchlog #fishingdiary #angler",
        "pinterest_title": "Digital Fishing Catch Log & Trophy Tracker",
        "pinterest_desc": "Save and track every fish you catch with photos, species tags, and weather conditions in your online fishing log."
    },
    # Day 6 - Image
    {
        "type": "image",
        "slug": "pike_teeth_species_guide",
        "primary_asset": "C-pike-1080x1080.jpg",
        "secondary_asset": "C-pike-1080x1920.jpg",
        "theme": "Northern Pike Guide & Tooth Safety",
        "target_url": URL_PIKE,
        "hook": "That grin is why you use a steel leader.",
        "fb_copy": "🐊 That toothy grin is why you always tie on a wire leader! Northern Pike are apex ambush predators. Learn where they stage in the fall, top lure presentations, and how to unhook them safely without losing a finger in our complete Pike guide.",
        "ig_copy": "Razor teeth & ambush strikes! 🦈 Northern Pike demand tough tackle and proper handling. Check our full guide for lure picks, seasonal migrations, and record sizes.\n\n🔗 Link in bio to read the Pike dossier!\n\n#NorthernPike #PikeFishing #Essox #PredatorFishing #PikeNation #FishingGear",
        "twitter_copy": "Over 700 razor-sharp teeth—that's why steel leaders exist. Everything you need to know about chasing trophy Northern Pike: {link} #PikeFishing #Esox",
        "tiktok_copy": "Why you NEVER reach inside a Pike's mouth without pliers! 🐊 Razor-sharp teeth and aggressive strikes. Full Pike guide at link in bio! #pikefishing #predatorfish #pike",
        "pinterest_title": "The Ultimate Northern Pike Fishing Guide & Lure Tactics",
        "pinterest_desc": "Northern Pike seasonal patterns, handling tips, tooth protection, steel leaders, and the lures that produce monster strikes."
    },
    # Day 7 - Video
    {
        "type": "video",
        "slug": "ugc_angler_catch",
        "primary_asset": "UGC video 8dcdc6ed-3322-44da-819e-7b738afa3293.mp4",
        "secondary_asset": None,
        "theme": "Authentic Angler Catch Reaction & Release",
        "target_url": URL_FISH_ID,
        "hook": "Pure adrenaline on the water.",
        "fb_copy": "🎣 That feeling when the rod loads up and you realize it's a solid fish! Share your latest catches with the Blue Seas Fishing community and test your catches against our AI scanner.",
        "ig_copy": "Nothing beats the rush of a tight line! 🐟 When you land something special, snap a picture and get the exact species profile.\n\n👉 Test the tool free at link in bio!\n\n#TightLines #FishingVideo #Anglers #CatchAndRelease #FishingReels",
        "twitter_copy": "Rod bent double, drag peeling—the moment every angler lives for. Verify your trophy with our instant fish scanner: {link} #TightLines #Fishing",
        "tiktok_copy": "Listen to that drag scream! What's the best fight you've ever had on light tackle? Drop your PB below 🎣👇 #fishing #tightlines #angler #fishfight",
        "pinterest_title": "Angler Catch Reactions & Species Verification",
        "pinterest_desc": "Exciting fishing catches and how to verify species and state records using Blue Seas Fishing AI tools."
    },
    # Day 8 - Image
    {
        "type": "image",
        "slug": "trout_stocking_seasons",
        "primary_asset": "D-trout-1080x1080.jpg",
        "secondary_asset": "D-trout-1080x1920.jpg",
        "theme": "Fall Trout Stocking & Regional Waters",
        "target_url": URL_TROUT_GUIDES,
        "hook": "Fall stocking season is here. What's biting?",
        "fb_copy": "🍂 Fall trout stocking is underway across the country! Cool water temperatures mean aggressive Rainbows, Browns, and Brookies. Explore what's biting in your state and check local stocking schedules in our destination guides.",
        "ig_copy": "Cooler days, aggressive trout! 🏞️ Fall stocking season brings active rivers and lake margins. Find your state's top waters and species breakdowns in our guides.\n\n🔗 Link in bio to see what's biting near you!\n\n#TroutFishing #FlyFishing #RainbowTrout #BrownTrout #BrookTrout #FallFishing",
        "twitter_copy": "Fall trout stocking is in full swing! Find out what waters are stocked near you and identify wild vs hatchery catches: {link} #TroutFishing #FlyFishing",
        "tiktok_copy": "Fall trout stocking season is officially here! Where are you casting this weekend? 🍂🐟 Link in bio for state bite guides! #troutfishing #fallfishing #flyfishing",
        "pinterest_title": "Fall Trout Stocking Guide & Best Regional Waters",
        "pinterest_desc": "Find fall trout stocking schedules, river maps, and identification differences between Rainbow, Brown, and Brook trout."
    },
    # Day 9 - Video
    {
        "type": "video",
        "slug": "ai_flagship_promo",
        "primary_asset": "Blue Seas AI Fish Identification.mp4",
        "secondary_asset": None,
        "theme": "Flagship AI Fish Identification Showcase",
        "target_url": URL_FISH_ID,
        "hook": "The smartest fishing companion on the water.",
        "fb_copy": "Turn your phone into an expert angler guide! Blue Seas AI recognizes 548 species from a single photo—giving you immediate insights on regulations, gear recommendations, and habitat habits. Works straight in your browser on phone or tablet.",
        "ig_copy": "Your digital deckhand on every trip! 📲 Scan any catch in seconds, read species details, and log your catches.\n\nTry it free right now—link in bio!\n\n#FishingTechnology #FishIdentifier #Anglers #BoatLife #FishingGear",
        "twitter_copy": "Turn your smartphone into an AI fish identifier. 548 species, instant results, free in your browser: {link} #FishingTech #Angler",
        "tiktok_copy": "This AI tool can identify 548 different fish species from one photo! Check it out at the link in bio 🎣📱 #fishingtools #fishid #cooltech #fishinggear",
        "pinterest_title": "AI Fish Identification Web App for Anglers",
        "pinterest_desc": "Discover the Blue Seas AI Fish Identification web app. Fast species recognition, depth charts, lure suggestions, and logbook."
    },
    # Day 10 - Image
    {
        "type": "image",
        "slug": "gear_tackle_picks",
        "primary_asset": "E-gear-1080x1080.jpg",
        "secondary_asset": "E-gear-1080x1920.jpg",
        "theme": "Gear Matched to 548 Species",
        "target_url": URL_GEAR,
        "hook": "The right lure for the right species.",
        "fb_copy": "🎣 No more guessing at the tackle shop. Our gear recommendations are mapped directly to 548 species profiles—so you know the exact rod power, line test, and lure action needed before you hit the water.",
        "ig_copy": "Match the hatch, match the tackle! 🎯 Our gear guides pair rod, reel, and lure setups to specific species habits so you never waste money on the wrong tackle.\n\n🔗 Tackle guides linked in bio!\n\n#FishingTackle #FishingGear #LureFishing #TackleShop #BassLures #FishingHacks",
        "twitter_copy": "Stop guessing at the tackle shop. See gear setups matched specifically to 548 species: {link} #FishingGear #TackleBox",
        "tiktok_copy": "The biggest mistake at the tackle shop: buying gear that doesn't match your target species! Here's how to fix it 🎣👇 Link in bio! #tackleshop #fishinglures #fishingtips",
        "pinterest_title": "Species-Specific Fishing Gear & Tackle Recommendations",
        "pinterest_desc": "Find the best rods, reels, lines, and lures for bass, pike, walleye, trout, and saltwater predators matched to species behavior."
    },
    # Day 11 - Video
    {
        "type": "video",
        "slug": "ai_promo_variation",
        "primary_asset": "Blue Seas AI Fish Identification (1).mp4",
        "secondary_asset": None,
        "theme": "AI Fish ID Field Demonstration",
        "target_url": URL_FISH_ID,
        "hook": "No signal? No problem. Fast AI species identification.",
        "fb_copy": "Got a photo of an unusual catch from last weekend? Upload it to Blue Seas Fishing and see what the AI discovers! Over 548 species indexed with scientific names, culinary ratings, and state records.",
        "ig_copy": "Ever caught a fish and had the whole boat arguing about what it was? 🚤 Put the debate to rest with Blue Seas AI.\n\n📲 Test any photo free via the link in bio!\n\n#FishID #FishingQuiz #BoatTrip #AnglerLife #FishingFun",
        "twitter_copy": "Boat debate over what fish was just caught? Settle it in 3 seconds with AI: {link} #FishID #FishingDebate",
        "tiktok_copy": "Settling boat debates since day one! What fish is this? Scan it and see 🎣✨ #fishinghumor #fishidentification #boatlife",
        "pinterest_title": "Field Tested AI Fish Identification Tool",
        "pinterest_desc": "Upload photos of unknown catches to get instant species names, biological classifications, and culinary notes."
    },
    # Day 12 - Image
    {
        "type": "image",
        "slug": "boat_offshore_destinations",
        "primary_asset": "F-boat-1080x1080.jpg",
        "secondary_asset": "F-boat-1080x1920.jpg",
        "theme": "Boat Rigging & Open Water Destinations",
        "target_url": URL_TROUT_GUIDES,
        "hook": "Heading out past the jetties?",
        "fb_copy": "🚤 Heading past the breakers this weekend? From nearshore reefs to blue water canyons, check out our 124 destination guides packed with seasonal reports, boat ramp coordinates, and local species hotspots.",
        "ig_copy": "Open water adventures await! 🌊 Plan your next coastal run with our comprehensive fishing destination guides.\n\n📍 Destination library linked in bio!\n\n#CenterConsole #BoatingLife #SaltwaterAngler #InshoreFishing #BoatRamp #FishingSpots",
        "twitter_copy": "Planning your next trip past the breakers? Explore 124 destination guides with ramp coords and seasonal bites: {link} #Boating #FishingSpots",
        "tiktok_copy": "Nothing clears the mind like a morning boat run. Where are you fishing this weekend? 🚤🌊 #boatinglife #centerconsole #saltwaterfishing #angler",
        "pinterest_title": "Top Coastal Fishing Destinations & Boat Ramp Guides",
        "pinterest_desc": "Detailed destination guides for inshore and offshore boat anglers: coordinates, ramps, seasons, and target species."
    },
    # Day 13 - Video
    {
        "type": "video",
        "slug": "ai_reel_challenge",
        "primary_asset": "blueseasfishing-ai-id-reel.mp4",
        "secondary_asset": None,
        "theme": "Species Challenge: Can AI Beat the Angler?",
        "target_url": URL_FISH_ID,
        "hook": "Can AI identify juvenile fish?",
        "fb_copy": "Juvenile panfish and fingerling predators can be notoriously tricky to identify. See how Blue Seas AI handles distinct fin patterns and color variations! Try testing a photo from your camera roll today. 📱🎣",
        "ig_copy": "Testing AI on tricky juvenile catches! 🔍 Does it get it right? Try uploading your hardest mystery fish photo.\n\n👉 Test it free at link in bio!\n\n#FishIdentification #AnglerChallenge #FishingMystery #FishQuiz",
        "twitter_copy": "Think you can stump the AI fish identifier? Upload your hardest mystery fish photo: {link} #FishID #FishingChallenge",
        "tiktok_copy": "Stumping the AI with baby panfish?! Watch what happens 🤯 Try your hardest fish photo at link in bio! #fishing #ai #test #fishid",
        "pinterest_title": "Test Your Angler Skills vs AI Fish Identification",
        "pinterest_desc": "Can artificial intelligence correctly identify tricky juvenile fish? Test your angling knowledge against the Blue Seas AI tool."
    },
    # Day 14 - Image
    {
        "type": "image",
        "slug": "social_creative_showcase",
        "primary_asset": "blueseasfishing-social-creative.png",
        "secondary_asset": "AI image ad for Blue Seas AI Fish Identification.jpg",
        "theme": "Blue Seas Modern Fishing Platform",
        "target_url": URL_FISH_ID,
        "hook": "Next-generation angling intelligence.",
        "fb_copy": "Welcome to modern angling intelligence. 🌊 Blue Seas Fishing connects AI identification, 548 species guides, and regional bite alerts in one clean web platform. Built by anglers, for anglers.",
        "ig_copy": "Modern intelligence for every cast. 🎣 548 species, real-time identification, and gear guides in your palm.\n\nExplore Blue Seas Fishing free via link in bio!\n\n#BlueSeasFishing #ModernAngler #FishingApp #AnglingTech #FishSmart",
        "twitter_copy": "Next-gen fishing intelligence: 548 species, instant AI scanning, tackle matching. Free to explore: {link} #Fishing #AnglerTech",
        "tiktok_copy": "The modern angler's secret weapon. 548 species guides + instant AI scanner in your pocket! 🌊📱 #fishingapp #angler #smartfishing",
        "pinterest_title": "Blue Seas Fishing - Smart Angling & AI Fish Identifier",
        "pinterest_desc": "The complete platform for modern anglers: AI fish scanning, 548 species profiles, regional seasonal reports, and gear reviews."
    },
    # Day 15 - Video
    {
        "type": "video",
        "slug": "catch_log_pb_diary",
        "primary_asset": "blueseasfishing-catch-log-reel.mp4",
        "secondary_asset": None,
        "theme": "Log Your PB (Personal Best) Catches",
        "target_url": URL_FISH_ID,
        "hook": "Don't let your trophy catches fade into memory.",
        "fb_copy": "🏆 What was your heaviest bass this season? Keep your personal bests, water conditions, and photos safely cataloged with Blue Seas Catch Log. Start building your legacy logbook today!",
        "ig_copy": "Your trophy catches deserve more than getting lost in your camera roll! 📸 Log length, weight, bait, and location with Blue Seas Fishing.\n\n📲 Link in bio to log your first catch!\n\n#TrophyFish #PersonalBest #FishDiary #BassAnglers #AnglerCommunity",
        "twitter_copy": "Don't lose your trophy catches in a cluttered camera roll. Log your personal bests with conditions and baits: {link} #PersonalBest #FishingLog",
        "tiktok_copy": "Stop losing your best catches in your camera roll! Log length, weight, and bait with Blue Seas 🎣📲 #fishingpb #personalbest #angler #catchandrelease",
        "pinterest_title": "How to Track and Log Your Personal Best Catches",
        "pinterest_desc": "Simple way to record your personal best fishing records, weight, length, lures, and locations in a digital journal."
    },
    # Day 16 - Image
    {
        "type": "image",
        "slug": "bass_mouth_hinge_guide",
        "primary_asset": "B-largemouth-1080x1080.jpg",
        "secondary_asset": "B-largemouth-1080x1920.jpg",
        "theme": "Bass Jaw Hinge vs Eye Line Technique",
        "target_url": URL_LARGEMOUTH,
        "hook": "Look closely at the closed jaw.",
        "fb_copy": "🔍 Quick identification trick: On a Largemouth Bass, the jaw hinge extends well past the rear edge of the eye when closed. On a Spotted Bass, it aligns directly below the eye. Test your bass ID skills in our comprehensive guide!",
        "ig_copy": "The jawline rule every bass angler should memorize! 📏 Largemouth jaws extend past the eye; Spotted bass stop right below it.\n\nRead the full visual guide linked in bio!\n\n#BassFishingTips #BassID #TournamentAngler #Largemouth #SpottedBassTips",
        "twitter_copy": "The jawline trick: Largemouth jaws extend past the eye when closed; Spotted Bass stop right below it. Full guide: {link} #BassTips #FishID",
        "tiktok_copy": "The simple jawline trick tournament anglers use to identify Largemouth vs Spotted Bass! 📏🎣 #fishingtips #bassfishing #angler #outdoors",
        "pinterest_title": "How to Identify Bass by Jawline & Eye Alignment",
        "pinterest_desc": "Visual guide explaining the jawline extension test to differentiate Largemouth Bass from Spotted Bass accurately."
    },
    # Day 17 - Video
    {
        "type": "video",
        "slug": "boat_action_saltwater_id",
        "primary_asset": "fishing boat catch.mp4",
        "secondary_asset": None,
        "theme": "High Speed Action & Catch Identification",
        "target_url": URL_FISH_ID,
        "hook": "Mystery strike 20 miles out.",
        "fb_copy": "20 miles out and the spread gets hit! 🛥️ Is it a Blackfin or a Skipjack? Yellowtail or Amberjack? Take a fast snapshot and let Blue Seas AI verify before you make dinner plans.",
        "ig_copy": "Mystery pelagic in the boat! 🌊 Fast species confirmation saves you from regulation violations and confusion.\n\n📲 Test the AI scanner free via link in bio!\n\n#SaltwaterLife #Pelagic #TunaFishing #DeepSea #FishingDaily",
        "twitter_copy": "20 miles offshore and a mystery fish hits the deck. Verify species instantly with AI: {link} #SaltwaterFishing #Pelagic",
        "tiktok_copy": "When you hook up 20 miles offshore! Can you ID the fish before we get it in the boat? 🐟💨 #offshorefishing #saltwater #oceanlife",
        "pinterest_title": "Saltwater Pelagic Fish Identification Guide",
        "pinterest_desc": "Identify offshore species like tuna, bonito, jacks, and mahi with instant AI scanning and regulation details."
    },
    # Day 18 - Image
    {
        "type": "image",
        "slug": "ai_fishid_species_coverage",
        "primary_asset": "A-fishid-1080x1080.jpg",
        "secondary_asset": "A-fishid-1080x1920.jpg",
        "theme": "548 Species Database Coverage",
        "target_url": URL_FISH_ID,
        "hook": "From Bluegill to Blue Marlin.",
        "fb_copy": "From farm pond Bluegills to deep canyon Blue Marlins—Blue Seas AI covers 548 North American and international species. Completely web-based, fast, and free to try on your smartphone.",
        "ig_copy": "548 species in the palm of your hand. 🐟 Lake, river, surf, or offshore—get reliable identification anywhere.\n\n🔗 Click link in bio to try it out!\n\n#FishingCommunity #SpeciesHunter #MultiSpeciesAngler #FishBiology #FishingWorld",
        "twitter_copy": "548 species covered: Bluegills to Blue Marlin. Try the instant AI fish scanner on your phone: {link} #FishID #Anglers",
        "tiktok_copy": "548 species in one free web tool! From neighborhood ponds to offshore canyons 🌊🎣 Link in bio! #fishing #fishid #specieshunting #fisherman",
        "pinterest_title": "Complete 548 Species Identification Database",
        "pinterest_desc": "Explore 548 freshwater and saltwater fish profiles with instant photo recognition, habitat ranges, and bait selections."
    },
    # Day 19 - Video
    {
        "type": "video",
        "slug": "ugc_angler_excitement",
        "primary_asset": "UGC video 8dcdc6ed-3322-44da-819e-7b738afa3293.mp4",
        "secondary_asset": None,
        "theme": "Weekend Angler Excitement & Share Your Catch",
        "target_url": URL_FISH_ID,
        "hook": "Weekend fishing mode: Activated.",
        "fb_copy": "Who is getting on the water this weekend? 🎣 Pack the tackle box, prep the boat, and make sure you have Blue Seas Fishing bookmarked on your phone for easy fish identification!",
        "ig_copy": "The weekend calls for bent rods! 🎣 Share your catches with us by tagging @BlueSeasFishing.\n\nNeed to ID a mystery catch? Link in bio!\n\n#WeekendFishing #FishingWeekend #AnglersLife #CatchOfTheDay #FishOn",
        "twitter_copy": "Weekend plans: bent rods and fresh air. Have Blue Seas bookmarked on your phone for quick catch identification: {link} #WeekendFishing",
        "tiktok_copy": "Weekend fishing mode is ON! Where are you dropping a line? 🎣👇 #weekendvibes #fishing #anglerlife #outdoorlife",
        "pinterest_title": "Weekend Angler Guide & Catch Identification",
        "pinterest_desc": "Get ready for your weekend fishing trips with quick fish ID, tide charts, and gear tips."
    },
    # Day 20 - Image
    {
        "type": "image",
        "slug": "pike_ambush_habitat",
        "primary_asset": "C-pike-1080x1080.jpg",
        "secondary_asset": "C-pike-1080x1920.jpg",
        "theme": "Northern Pike Ambush Tactics & Weed Lines",
        "target_url": URL_PIKE,
        "hook": "Weed lines, drop-offs, and explosive strikes.",
        "fb_copy": "🐊 Northern Pike love to lurk in thick weed beds waiting for unwary forage. Discover how to work jerkbaits, inline spinners, and swimbaits along deep weed edges in our comprehensive pike masterclass.",
        "ig_copy": "Ambush masters of the freshwater! 🌿 Learn the weedline techniques that trigger vicious Pike strikes in late fall.\n\n📖 Read our Pike guide at link in bio!\n\n#PikeOnTheFly #PikeLures #EssoxLucius #FreshwaterPredators #CastAndRetrieve",
        "twitter_copy": "Targeting monster Pike along deep weed edges? Check out our lure presentations and seasonal tactics: {link} #PikeFishing #EsoxLucius",
        "tiktok_copy": "How Pike ambush prey from thick weed beds! 🐊 Here's the lure to pull them out 🎣 Link in bio! #pikefishing #predatorfish #fishinglures",
        "pinterest_title": "How to Fish Weed Edges for Monster Northern Pike",
        "pinterest_desc": "Master weedline fishing for Northern Pike: lure selection, boat positioning, and avoiding bite-offs."
    },
    # Day 21 - Video
    {
        "type": "video",
        "slug": "ai_speed_test",
        "primary_asset": "blueseasfishing-ai-id-reel.mp4",
        "secondary_asset": None,
        "theme": "Speed Test: AI Fish Identification Under 3 Seconds",
        "target_url": URL_FISH_ID,
        "hook": "How fast can AI identify your catch?",
        "fb_copy": "⚡ Speed test: Upload photo -> AI analysis -> Full species profile in under 3 seconds! Test it out with any fishing picture you took this season.",
        "ig_copy": "Under 3 seconds! ⏱️ No endless flipping through field manuals. Just snap and learn.\n\nTry the free speed test via link in bio!\n\n#SpeedTest #FishingApp #ArtificialIntelligence #TechInFishing #FishID",
        "twitter_copy": "Speed test: upload photo -> full species profile in under 3 seconds. Try it with your recent catches: {link} #FishID #FishingTech",
        "tiktok_copy": "Watch this AI identify a fish in literally 2.5 seconds ⏱️🤯 Link in bio to try your photos! #tech #ai #fishingtech #fishid",
        "pinterest_title": "Fast AI Fish Identification Speed Test",
        "pinterest_desc": "See how quickly AI can analyze fish markings, fins, and body shapes to provide instant species answers."
    },
    # Day 22 - Image
    {
        "type": "image",
        "slug": "state_bite_forecasts",
        "primary_asset": "D-trout-1080x1080.jpg",
        "secondary_asset": "D-trout-1080x1920.jpg",
        "theme": "State-by-State Fishing Destination Reports",
        "target_url": URL_TROUT_GUIDES,
        "hook": "What's biting in your state right now?",
        "fb_copy": "📍 What's biting in your home waters right now? Whether you're in Michigan targeting late Walleye or Florida chasing Redfish, our state-by-state guides give you actionable seasonal reports and regulations.",
        "ig_copy": "Local knowledge for all 50 states! 🗺️ Find out what's hitting the net this month in your state waters.\n\n🔗 Check your state guide in bio!\n\n#StateFishing #Walleye #Redfish #BassNation #LocalAngler #FishingReports",
        "twitter_copy": "Check what is biting in your state right now: 50 states covered with top species and seasonal reports: {link} #FishingReport #WhatIsBiting",
        "tiktok_copy": "What is biting in YOUR state this month? Comment your state and check our regional bite guide in bio! 🗺️🎣 #fishingreport #whatisbiting #anglercommunity",
        "pinterest_title": "50-State Fishing Guides & Seasonal Bite Calendars",
        "pinterest_desc": "Discover the best fish species to target by state, seasonal temperature migrations, and public boat launches."
    },
    # Day 23 - Video
    {
        "type": "video",
        "slug": "ai_flagship_recap",
        "primary_asset": "Blue Seas AI Fish Identification.mp4",
        "secondary_asset": None,
        "theme": "Educational Angler Tool: Anatomy & Habits",
        "target_url": URL_FISH_ID,
        "hook": "Learn more than just the fish's name.",
        "fb_copy": "Blue Seas Fishing doesn't just name the fish—it teaches you about preferred water depths, forage habits, safe release practices, and culinary ratings. Level up your angling IQ for free!",
        "ig_copy": "More than just a name! 🧠 Deep dive into forage preferences, depth charts, and sustainable handling tips for every catch.\n\n📲 Test it free at link in bio!\n\n#AnglerIQ #FishFacts #CatchAndRelease #FishingEducation #SmartFishing",
        "twitter_copy": "More than just a species name: learn forage habits, preferred depths, and handling tips for 548 species: {link} #AnglerIQ #FishFacts",
        "tiktok_copy": "Did you know this tool tells you the preferred water depth and best bait for every fish you scan? 🤯 Try it free in bio! #fishfacts #angleriq #fishingtips",
        "pinterest_title": "Educational Fish Identification & Habitat Profiles",
        "pinterest_desc": "Learn fish anatomy, depth preferences, food sources, and proper catch-and-release handling with Blue Seas Fishing."
    },
    # Day 24 - Image
    {
        "type": "image",
        "slug": "tackle_species_mapping",
        "primary_asset": "E-gear-1080x1080.jpg",
        "secondary_asset": "E-gear-1080x1920.jpg",
        "theme": "Lure Selection: Match the Species Exactly",
        "target_url": URL_GEAR,
        "hook": "Stop buying lures that fish ignore.",
        "fb_copy": "🎯 Stop buying lures that fish ignore. Our species tackle breakdowns match bait profiles to actual predator prey preferences. Find out which lures actually produce in our recommended gear library.",
        "ig_copy": "Lures matched to science! 🔬 Discover the exact crankbaits, jigs, and soft plastics tailored to predator feeding habits.\n\n🔗 Tackle recommendations in bio!\n\n#FishingLures #Crankbaits #SoftPlastics #TackleTest #FishingTipsAndTricks",
        "twitter_copy": "Stop buying lures that fish ignore. Read gear breakdowns matched to species feeding habits: {link} #FishingGear #Lures",
        "tiktok_copy": "The 3 lures that NEVER leave my tackle box, matched to target species! Full list in bio 🎣👇 #fishingtackle #tacklebox #lures #fishinghacks",
        "pinterest_title": "Best Fishing Lures Matched to Target Predator Species",
        "pinterest_desc": "Top-rated crankbaits, swimbaits, jigs, and topwaters matched to specific freshwater and saltwater fish feeding profiles."
    },
    # Day 25 - Video
    {
        "type": "video",
        "slug": "catch_log_journal_feature",
        "primary_asset": "blueseasfishing-catch-log-reel.mp4",
        "secondary_asset": None,
        "theme": "Group Chat Debate Settled with Catch Log",
        "target_url": URL_FISH_ID,
        "hook": "End the group chat fishing debates.",
        "fb_copy": "📱 Friend claimed they caught an 8lb bass? Settle the score with authenticated logs! Save length, weight, photo proof, and exact conditions in your personal Blue Seas catch journal.",
        "ig_copy": "Receipts for the group chat! 🏆 Prove your catches with verified photos, species ID, and weight records.\n\n📲 Start logging free at link in bio!\n\n#FishingGroup #AnglerDebate #FishingBuddy #Livewell #FishingLife",
        "twitter_copy": "No more 'the one that got away' stories—have proof in your digital catch log with photos and species ID: {link} #FishingCommunity",
        "tiktok_copy": "When your buddy claims his bass was 7 lbs but your catch log has the real proof 😂🎣 #fishinghumor #groupchat #bassfishing #receipts",
        "pinterest_title": "Digital Catch Logbook with Photo Verification",
        "pinterest_desc": "Save proof of your biggest catches with authenticated photos, weight stamps, and species identification tags."
    },
    # Day 26 - Image
    {
        "type": "image",
        "slug": "boat_trolling_coastal",
        "primary_asset": "F-boat-1080x1080.jpg",
        "secondary_asset": "F-boat-1080x1920.jpg",
        "theme": "Coastal Trolling & Structure Mapping",
        "target_url": URL_TROUT_GUIDES,
        "hook": "Finding structure that holds fish.",
        "fb_copy": "🚤 Finding structure is half the battle. Our coastal destination guides highlight underwater humps, reefs, and tidal passes that hold predatory fish through changing tide phases.",
        "ig_copy": "Find the structure, find the fish! 🧭 Explore tidal pass maps and nearshore reef coordinates in our destination guides.\n\n🔗 Maps and guides in bio!\n\n#CoastalFishing #SaltwaterBoating #InshoreSlam #TrollingSpreads #Navigation",
        "twitter_copy": "Structure is everything. Discover coordinates and tidal flow guides for top fishing destinations: {link} #Boating #CoastalFishing",
        "tiktok_copy": "How to find productive underwater structure when boating new waters! 🚤🗺️ Full guide at link in bio! #boatlife #saltwater #fishingtips",
        "pinterest_title": "How to Find Underwater Structure & Fishing Hotspots",
        "pinterest_desc": "Identify reefs, ledges, and channels that attract predatory gamefish with Blue Seas destination guides."
    },
    # Day 27 - Video
    {
        "type": "video",
        "slug": "boat_fighting_fish",
        "primary_asset": "fishing boat catch.mp4",
        "secondary_asset": None,
        "theme": "Boat Catch Action: Ocean Giants",
        "target_url": URL_FISH_ID,
        "hook": "Trophy battles on the open ocean.",
        "fb_copy": "Big water, heavy tackle, and unforgettable battles! 🌊 When you're out chasing personal bests, let Blue Seas Fishing keep you dialed in on species limits and regulations.",
        "ig_copy": "Heavy drags and deep blue water! 🐟 When the fight is over, know exactly what species you boated.\n\n👉 Test our free AI tool at link in bio!\n\n#BigGameFishing #OceanFishing #AnglerLifestyle #FishingAddict #OffshoreLife",
        "twitter_copy": "Big game battles and offshore action. Identify and log every pelagic catch with Blue Seas AI: {link} #BigGameFishing #Saltwater",
        "tiktok_copy": "Battling ocean monsters! Sound up for that reel screaming 🔊🎣 What's your biggest catch ever? #ocean #fishingreels #pelagic #deepsea",
        "pinterest_title": "Offshore Big Game Fishing & Species Recognition",
        "pinterest_desc": "Exciting big game offshore angling action and how to verify species regulations and records."
    },
    # Day 28 - Image
    {
        "type": "image",
        "slug": "ai_ad_creative_feature",
        "primary_asset": "AI image ad for Blue Seas AI Fish Identification.jpg",
        "secondary_asset": "blueseasfishing-social-creative.png",
        "theme": "AI Fish ID Showcase: High Accuracy Scan",
        "target_url": URL_FISH_ID,
        "hook": "The smartest tackle in your box isn't tackle.",
        "fb_copy": "The smartest tool in your tackle box fits right in your pocket. 📲 Try Blue Seas AI Fish Identification on your next adventure—fast, accurate, and completely free in your browser.",
        "ig_copy": "Smart tech for every angler. 📱 Scan 548 species, read tips, and log your catches anywhere.\n\n👉 Free link in bio!\n\n#FishingTechnology #FishID #OutdoorTech #ModernFishing #AnglersOfIG",
        "twitter_copy": "The smartest tool in your tackle box is your smartphone. Scan 548 species for free: {link} #FishID #FishingTech",
        "tiktok_copy": "Why every angler needs this free tool saved on their phone! 🎣📱 Scan 548 fish species instantly! Link in bio! #fishinghacks #musthave #angler",
        "pinterest_title": "Must-Have Fishing Apps & AI Fish Identification",
        "pinterest_desc": "The best AI fish identification web app for anglers: fast species scanning, regulations, and fishing tips."
    },
    # Day 29 - Video
    {
        "type": "video",
        "slug": "ugc_angler_final_wrap",
        "primary_asset": "UGC video 8dcdc6ed-3322-44da-819e-7b738afa3293.mp4",
        "secondary_asset": None,
        "theme": "Community Catches & Angler Stories",
        "target_url": URL_FISH_ID,
        "hook": "Every catch tells a story.",
        "fb_copy": "Every catch tells a story—the early morning chill, the perfect cast, the thrilling strike. Capture and preserve your fishing memories with Blue Seas Fishing.",
        "ig_copy": "Every cast has a story. 🌊 Share yours with the Blue Seas Fishing community!\n\n📲 Link in bio to try the AI fish scanner!\n\n#AnglerStories #FishingMemories #CatchAndRelease #TightLines #FishDaily",
        "twitter_copy": "Every cast has a story. Identify, catalog, and share your catches with Blue Seas Fishing: {link} #FishingCommunity #Anglers",
        "tiktok_copy": "The moment you realize why you wake up at 4:30 AM every weekend. Who can relate? 🌅🎣 #fishinglife #earlymornings #angler #passion",
        "pinterest_title": "Preserve Your Fishing Memories & Trophy Catches",
        "pinterest_desc": "Tips for photographing, identifying, and cataloging your fishing adventures with Blue Seas Fishing."
    },
    # Day 30 - Image
    {
        "type": "image",
        "slug": "grand_finale_fishid_challenge",
        "primary_asset": "A-fishid-1080x1080.jpg",
        "secondary_asset": "A-fishid-1080x1920.jpg",
        "theme": "30-Day Grand Finale: The 548 Species Challenge",
        "target_url": URL_FISH_ID,
        "hook": "Join thousands of anglers identifying their catches.",
        "fb_copy": "🎉 Join thousands of anglers using Blue Seas Fishing to discover and identify species across North America and beyond! Bookmark the AI identifier today and never guess at the boat ramp again. Tight lines!",
        "ig_copy": "548 species, thousands of identified catches! 🌊 Bookmark Blue Seas Fishing for your next trip on the water.\n\n🔗 Free instant access at link in bio!\n\n#BlueSeasFishing #FishIdentifier #AnglersUnited #TightLines #HappyFishing",
        "twitter_copy": "Join thousands of anglers identifying mystery fish in seconds with AI. Free access across 548 species: {link} #FishID #TightLines",
        "tiktok_copy": "Thousands of anglers are using this free AI tool to ID their catches! Have you tried it yet? Link in bio! 🎣✨ #fishing #ai #catchandrelease #anglers",
        "pinterest_title": "Free AI Fish Identifier for Freshwater and Saltwater",
        "pinterest_desc": "Scan and identify 548 fish species instantly with Blue Seas Fishing. Free to try online with no download required."
    }
]

def build_schedule():
    start_date = datetime(2026, 11, 6) # Today's date
    schedule = []
    
    for i, t in enumerate(ROTATION_TEMPLATES):
        day_num = i + 1
        post_date = start_date + timedelta(days=i)
        date_str = post_date.strftime("%Y-%m-%d")
        day_of_week = post_date.strftime("%A")
        
        slug = t["slug"]
        day_tag = f"d{day_num:02d}_{slug}"
        campaign_name = "social_30d_nov2026"
        target_base = t["target_url"]
        
        # Build platform-specific tracking URLs
        url_fb = f"{target_base}?utm_source=facebook&utm_medium=social_post&utm_campaign={campaign_name}&utm_content={day_tag}"
        url_ig = f"{target_base}?utm_source=instagram&utm_medium=social_post&utm_campaign={campaign_name}&utm_content={day_tag}"
        url_tw = f"{target_base}?utm_source=twitter&utm_medium=social_tweet&utm_campaign={campaign_name}&utm_content={day_tag}"
        url_tt = f"{target_base}?utm_source=tiktok&utm_medium=short_video&utm_campaign={campaign_name}&utm_content={day_tag}"
        url_pin = f"{target_base}?utm_source=pinterest&utm_medium=pin&utm_campaign={campaign_name}&utm_content={day_tag}"
        
        tw_text = t["twitter_copy"].format(link=url_tw)
        
        entry = {
            "day": day_num,
            "date": date_str,
            "day_of_week": day_of_week,
            "asset_type": t["type"],
            "primary_asset": t["primary_asset"],
            "secondary_asset": t.get("secondary_asset"),
            "primary_asset_path": os.path.join(BASE_ASSET_DIR, t["primary_asset"]),
            "secondary_asset_path": os.path.join(BASE_ASSET_DIR, t["secondary_asset"]) if t.get("secondary_asset") else None,
            "theme": t["theme"],
            "hook": t["hook"],
            "target_landing_page": target_base,
            "platforms": {
                "facebook": {
                    "text": t["fb_copy"] + f"\n\n👉 Learn more: {url_fb}",
                    "tracking_url": url_fb,
                    "cta": "Learn More"
                },
                "instagram": {
                    "text": t["ig_copy"],
                    "tracking_url": url_ig,
                    "link_in_bio_url": url_ig,
                    "story_sticker_url": url_ig
                },
                "twitter": {
                    "text": tw_text,
                    "tracking_url": url_tw
                },
                "tiktok": {
                    "text": t["tiktok_copy"],
                    "tracking_url": url_tt
                },
                "pinterest": {
                    "title": t["pinterest_title"],
                    "description": t["pinterest_desc"],
                    "tracking_url": url_pin
                }
            },
            "kpis": {
                "primary_metric": "Outbound Clicks (Sessions with utm_source)",
                "secondary_metric": "Fish-ID Tool Starts (fish_id_start event in GA4)",
                "benchmark_target": "50+ visits/day, >4% tool engagement"
            }
        }
        schedule.append(entry)
        
    os.makedirs(os.path.dirname(OUTPUT_SCHEDULE_FILE), exist_ok=True)
    with open(OUTPUT_SCHEDULE_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "campaign_name": "Blue Seas Fishing 30-Day Social Rotation",
            "start_date": "2026-11-06",
            "end_date": "2026-12-05",
            "total_days": 30,
            "schedule": schedule
        }, f, indent=2)
        
    print(f"Successfully generated 30-day social calendar: {OUTPUT_SCHEDULE_FILE}")
    print(f"Total days scheduled: {len(schedule)}")

if __name__ == "__main__":
    build_schedule()
