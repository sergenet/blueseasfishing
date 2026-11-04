/* meta-seo.js v1 */
(function(){
  const SITE = { name:'BlueSeas Fishing With Serge', url:'https://www.blueseasfishing.com', logo:'/assets/images/favicon.ico' };

  function ensure(tagName, attrs){
    let el = document.head.querySelector(`${tagName}${attrs.name?`[name="${attrs.name}"]`:''}${attrs.property?`[property="${attrs.property}"]`:''}`);
    if(!el){ el=document.createElement(tagName); document.head.appendChild(el); }
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k, v));
    return el;
  }

  function text(el){ return (el && (el.innerText||el.textContent||'').trim()) || ''; }

  function run(){
    const path = location.pathname.replace(/index\.html?$/,'');
    const url  = SITE.url.replace(/\/$/,'') + path;

    const title = document.title && document.title.trim() || SITE.name;
    let desc = '';
    const metaDesc = document.head.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content) desc = metaDesc.content.trim();
    if (!desc) {
      const p = document.querySelector('main p, .wrap p, .container p');
      desc = (text(p) || 'AI-powered fish identification, species database, and fishing tips & gear.');
      if (desc.length > 160) desc = desc.slice(0,157)+'…';
    }

    // Canonical
    ensure('link', { rel:'canonical', href:url });

    // Open Graph
    ensure('meta', { property:'og:type', content:'website' });
    ensure('meta', { property:'og:site_name', content:SITE.name });
    ensure('meta', { property:'og:title', content:title });
    ensure('meta', { property:'og:description', content:desc });
    ensure('meta', { property:'og:url', content:url });

    // Twitter
    ensure('meta', { name:'twitter:card', content:'summary_large_image' });
    ensure('meta', { name:'twitter:title', content:title });
    ensure('meta', { name:'twitter:description', content:desc });

    // JSON-LD (Website + Organization)
    const ld = {
      "@context":"https://schema.org",
      "@graph":[
        { "@type":"WebSite", "name":SITE.name, "url":SITE.url, "potentialAction": { "@type":"SearchAction", "target": SITE.url+"/gallery.html?q={search_term_string}", "query-input":"required name=search_term_string" } },
        { "@type":"Organization","name":SITE.name,"url":SITE.url,"logo": SITE.logo }
      ]
    };
    let script = document.getElementById('ld-seo');
    if(!script){ script=document.createElement('script'); script.type='application/ld+json'; script.id='ld-seo'; document.head.appendChild(script); }
    script.textContent = JSON.stringify(ld);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
