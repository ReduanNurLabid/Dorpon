import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json

urls = [
    'https://www.prothomalo.com/bangladesh/dson6y89jk',
    'https://www.prothomalo.com/bangladesh/district/nq469thd5o',
    'https://www.prothomalo.com/bangladesh/dzfhtu7pes',
    'https://www.prothomalo.com/world/europe/8nb3n8zdwd',
    'https://www.prothomalo.com/business/economics/npqn3j5x8z',
    'https://www.prothomalo.com/opinion/column/kalzgtfo9f',
    'http://prothomalo.com/world/europe/vlbce6rg73'
]

results = []

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=12) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # Title
            t_match = re.search(r'<title>(.*?)</title>', html, re.DOTALL | re.IGNORECASE)
            title = t_match.group(1).replace(' - প্রথম আলো', '').replace(' | Prothom Alo', '').strip() if t_match else ''
            
            # og:description
            d_match = re.search(r'<meta[^>]+property=[\'"]og:description[\'"][^>]+content=[\'"](.*?)[\'"]', html, re.DOTALL | re.IGNORECASE)
            if not d_match:
                d_match = re.search(r'<meta[^>]+name=[\'"]description[\'"][^>]+content=[\'"](.*?)[\'"]', html, re.DOTALL | re.IGNORECASE)
            desc = d_match.group(1).strip() if d_match else ''
            
            # og:image
            img_match = re.search(r'<meta[^>]+property=[\'"]og:image[\'"][^>]+content=[\'"](.*?)[\'"]', html, re.DOTALL | re.IGNORECASE)
            image_url = img_match.group(1).strip() if img_match else ''

            # extract paragraphs
            paras = re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL)
            clean_paras = []
            for p in paras:
                text = re.sub(r'<[^>]+>', '', p).strip()
                if len(text) > 40 and 'বিজ্ঞাপন' not in text and 'প্রথম আলো' not in text:
                    clean_paras.append(text)
            
            body_sample = ' '.join(clean_paras[:5])

            results.append({
                'url': url,
                'title': title,
                'description': desc,
                'image_url': image_url,
                'body_sample': body_sample,
                'paragraphs_count': len(clean_paras)
            })
            print(f"SUCCESS: {title} ({url})")
    except Exception as e:
        print(f"FAIL: {url} -> {e}")

with open('scraped_prothomalo_news.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("Saved to scraped_prothomalo_news.json")
