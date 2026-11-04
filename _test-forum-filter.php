<?php
// Extract forumViolation() from forum.php and test it in isolation.
$src = file_get_contents(__DIR__ . '/api/forum.php');
if (!preg_match('/function forumViolation.*?\n}\n/s', $src, $m)) { fwrite(STDERR, "could not extract forumViolation\n"); exit(1); }
eval($m[0]);

$cases = [
    // [input, expectViolation (true = blocked, false = allowed), label]
    ['You are an idiot, nice fish though', false, 'mild disagreement allowed'],
    ['Great largemouth bass on a green pumpkin jig', false, 'bass (contains "ass") allowed'],
    ['Peacock bass are amazing', false, 'peacock (contains "cock") allowed'],
    ['Fishing near Sussex in June', false, 'Sussex (contains "sex") allowed'],
    ['The analysis of the sonar data shows structure', false, 'analysis (contains "anal"? no - tokens) allowed'],
    ['This reel is the shit for the price', false, 'wait - "shit" IS vulgar', ], // will fix expectation below
    ['What the hell is that catch', false, 'hell (mild, not in list) allowed'],
    ['Crappie fishing was slow today', false, 'crappie allowed'],
    ['I caught a redfish near the rock jetty', false, 'clean post allowed'],
    ['Nice catch! What line were you using?', false, 'clean post 2 allowed'],
    ['Nice c*atch my friend', false, 'censored word allowed (not on list)'],
    ['This jerk bait rocks', false, 'jerk allowed'],
    ['Damn this wind', false, 'damn (not on list) allowed'],
    ['Check your fingers for the knot', false, 'fingers (contains fing) allowed'],
    ['We sat under the ash tree by the swim', false, 'ash tree (compacts sht) allowed'],
    ['The analysis shows the drop-off', false, 'analysis (contains anal-ish) allowed'],
    ['sh*t happens', true, 'censored sh*t blocked'],

    ['You are a f***ing idiot', true, 'censored fuck evasion blocked'],
    ['f.u.c.k you', true, 'dot-separated fuck blocked'],
    ['FUUUCK this wind', true, 'elongated fuck blocked'],
    ['you are a dumbass', true, 'dumbass blocked (compact "dumbass" has "ass"? tier2 token)'],
    ['what a load of shit', true, 'shit blocked'],
    ['sh1t happens', true, 'leet shit blocked'],
    ['post your nudes here', true, 'nudes blocked'],
    ['buy viagra now', true, 'viagra spam blocked'],
    ['watch www.pornhub.example', true, 'porn blocked'],
    ['you suck my dick', true, 'dick blocked'],
    ['stupid bitch', true, 'bitch blocked'],
    ['retard', true, 'retard blocked'],
    ['nigger', true, 'slur blocked'],
    ['faggot', true, 'slur blocked'],
    ['you c*nt', true, 'cunt with star - compact "cent"? hmm'],
    ['anal fishing is great', true, '"anal" as exact token blocked'],
    ['canal fishing is great', false, '"canal" allowed'],
    ['go to http://a.com http://b.com http://c.com http://d.com http://e.com', true, 'link spam blocked'],
    ['see http://example.com and http://blueseasfishing.com', false, 'two links allowed'],
    ['twat', true, 'twat blocked'],
    ['what a cock', true, 'cock as token blocked'],
    ['my favorite lure is the Sexan minnow', false, 'Sexan (token "sexan") allowed'],
];

// Fix the deliberate mislabel: "shit" IS blocked per the list.
$cases[5][1] = true;
$cases[5][2] = 'shit (even mild usage) blocked';

$pass = 0; $fail = 0;
foreach ($cases as [$input, $expect, $label]) {
    $got = forumViolation($input) !== null;
    if ($got === $expect) { $pass++; }
    else { $fail++; printf("FAIL [%s] input=%s expected=%s got=%s\n", $label, var_export($input, true), $expect ? 'blocked' : 'allowed', $got ? 'blocked' : 'allowed'); }
}
printf("%d passed, %d failed\n", $pass, $fail);
exit($fail ? 1 : 0);
