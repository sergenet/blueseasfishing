param(
  [string]$SitemapUrl = 'https://www.blueseasfishing.com/sitemap.xml'
)

$ErrorActionPreference = 'Stop'
$siteHost = 'www.blueseasfishing.com'
$indexNowKey = '130172703bd3435fba215cb02f843276'
$keyLocation = "https://$siteHost/$indexNowKey.txt"

$sitemapResponse = Invoke-WebRequest -Uri $SitemapUrl -UseBasicParsing -TimeoutSec 30
[xml]$sitemap = $sitemapResponse.Content
$urls = @($sitemap.urlset.url.loc | ForEach-Object { [string]$_ })

if ($urls.Count -eq 0) {
  throw "No URLs were found in $SitemapUrl"
}

$payload = @{
  host = $siteHost
  key = $indexNowKey
  keyLocation = $keyLocation
  urlList = $urls
} | ConvertTo-Json -Depth 4

$response = Invoke-WebRequest `
  -Uri 'https://api.indexnow.org/indexnow' `
  -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body $payload `
  -UseBasicParsing `
  -TimeoutSec 30

"IndexNow accepted $($urls.Count) URLs with HTTP $($response.StatusCode)."
