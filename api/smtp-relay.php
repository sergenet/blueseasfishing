<?php
/**
 * smtp-relay.php — shared SMTP transport for the newsletter crons.
 *
 * Delivers through the Namecheap cPanel mailbox (mail.blueseasfishing.com)
 * with AUTHENTICATION instead of anonymous server mail(): same provider as
 * send-outreach.py, so reputation and the Sent-copy trail stay with the host.
 * Required by newsletter-cron.php and weekly-brief-cron.php, which must
 * define bsfEnv() before calling into this file.
 *
 * .env keys (upserted by set-smtp-relay.py, never committed):
 *   SMTP_HOST=mail.blueseasfishing.com
 *   SMTP_PORT=465            # 465 = implicit TLS, 587 = STARTTLS
 *   SMTP_USER=contact@blueseasfishing.com
 *   SMTP_PASS=...
 *
 * All senders return the same [code, err] shape: 2xx = accepted.
 */

function bsfSmtpConfig(): ?array {
    static $cfg = null;
    if ($cfg === null) {
        $host = trim(bsfEnv('SMTP_HOST'));
        $user = trim(bsfEnv('SMTP_USER'));
        $pass = bsfEnv('SMTP_PASS');
        $cfg = ($host !== '' && $user !== '' && $pass !== '')
            ? [
                'host' => $host,
                'port' => (int)(bsfEnv('SMTP_PORT') ?: 465),
                'user' => $user,
                'pass' => $pass,
            ]
            : false;
    }
    return $cfg ?: null;
}

function bsfSmtpReady(): bool { return bsfSmtpConfig() !== null; }

/** Actual transport used by the last send — reported by test/status modes. */
function bsfTransport(?string $set = null): string {
    static $v = '';
    if ($set !== null) $v = $set;
    return $v;
}

function bsfSmtpRead($fp): string {
    $resp = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $resp .= $line;
        if (strlen($line) < 4 || $line[3] !== '-') break; // "250 " final line
    }
    return $resp;
}

function bsfSmtpCmd($fp, string $cmd): string {
    fwrite($fp, $cmd . "\r\n");
    return bsfSmtpRead($fp);
}

/**
 * Deliver one message through the relay.
 * $rawHeaders: header block WITHOUT the Subject line (added here, since the
 * mail() path passes subject separately) — CRLF or LF, both accepted.
 * $body: the MIME body as built by sendViaMail().
 * Returns [250, ''] on acceptance or [0, 'stage: detail'] on failure.
 */
function bsfSmtpSend(string $toEmail, string $subject, string $rawHeaders, string $body): array {
    $cfg = bsfSmtpConfig();
    if ($cfg === null) return [0, 'SMTP not configured'];

    $ssl = $cfg['port'] === 465 ? 'ssl://' : '';
    // verify_peer=true: the cert must chain to a real CA (Sectigo).
    // verify_peer_name=false: the host's cert is CN=*.web-hosting.com and no
    // cert on this server covers mail.<domain>, so a hostname check can never
    // pass — chain validation (still stricter than Python smtplib's CERT_NONE)
    // is the strongest posture this provider allows.
    $fp = @stream_socket_client(
        $ssl . $cfg['host'] . ':' . $cfg['port'], $errno, $errstr, 15,
        STREAM_CLIENT_CONNECT,
        stream_context_create(['ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => false,
            'allow_self_signed' => false,
            'SNI_enabled' => true,
            'peer_name' => $cfg['host'],
        ]])
    );
    if (!$fp) return [0, "connect: $errstr ($errno)"];
    stream_set_timeout($fp, 20);

    $g = bsfSmtpRead($fp);
    if (strncmp($g, '220', 3) !== 0) { fclose($fp); return [0, 'banner: ' . trim($g)]; }

    $ehlo = 'EHLO ' . (gethostname() ?: 'blueseasfishing.com');
    $r = bsfSmtpCmd($fp, $ehlo);
    if (strncmp($r, '250', 3) !== 0) { fclose($fp); return [0, 'EHLO: ' . trim($r)]; }

    if ($cfg['port'] !== 465) { // 587-style submission: upgrade in transit
        $r = bsfSmtpCmd($fp, 'STARTTLS');
        if (strncmp($r, '220', 3) !== 0) { fclose($fp); return [0, 'STARTTLS: ' . trim($r)]; }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($fp); return [0, 'TLS handshake failed'];
        }
        $r = bsfSmtpCmd($fp, $ehlo);
        if (strncmp($r, '250', 3) !== 0) { fclose($fp); return [0, 'EHLO after TLS: ' . trim($r)]; }
    }

    $r = bsfSmtpCmd($fp, 'AUTH LOGIN');
    if (strncmp($r, '334', 3) !== 0) { fclose($fp); return [0, 'AUTH: ' . trim($r)]; }
    $r = bsfSmtpCmd($fp, base64_encode($cfg['user']));
    if (strncmp($r, '334', 3) !== 0) { fclose($fp); return [0, 'AUTH user rejected: ' . trim($r)]; }
    $r = bsfSmtpCmd($fp, base64_encode($cfg['pass']));
    if (strncmp($r, '235', 3) !== 0) { fclose($fp); return [0, 'AUTH failed: ' . trim($r)]; }

    $from = trim(bsfEnv('NEWSLETTER_FROM') ?: 'contact@blueseasfishing.com');
    $r = bsfSmtpCmd($fp, 'MAIL FROM:<' . $from . '>');
    if (strncmp($r, '250', 3) !== 0) { fclose($fp); return [0, 'MAIL FROM: ' . trim($r)]; }
    $r = bsfSmtpCmd($fp, 'RCPT TO:<' . $toEmail . '>');
    if (!preg_match('/^25[01]/', $r)) { fclose($fp); return [0, 'RCPT TO: ' . trim($r)]; }
    $r = bsfSmtpCmd($fp, 'DATA');
    if (strncmp($r, '354', 3) !== 0) { fclose($fp); return [0, 'DATA: ' . trim($r)]; }

    $msg = 'Subject: ' . '=?UTF-8?B?' . base64_encode($subject) . '?=' . "\r\n"
         . str_replace(["\r\n", "\r"], "\n", $rawHeaders) . "\r\n\r\n"
         . str_replace(["\r\n", "\r"], "\n", $body);
    $stuffed = [];
    foreach (explode("\n", $msg) as $ln) $stuffed[] = (isset($ln[0]) && $ln[0] === '.') ? '.' . $ln : $ln;
    fwrite($fp, implode("\r\n", $stuffed) . "\r\n.\r\n");

    $r = bsfSmtpRead($fp);
    if (strncmp($r, '250', 3) !== 0) { fclose($fp); return [0, 'message rejected: ' . trim($r)]; }
    bsfSmtpCmd($fp, 'QUIT');
    fclose($fp);
    return [250, ''];
}
