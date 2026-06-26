#!/usr/bin/env python3
"""
Add login check to all walkthrough HTML files.
Run from maths-walkthroughs folder:
    python3 add_login_check.py
"""

import os, glob

BASE = os.path.expanduser('~/maths-walkthroughs')

LOGIN_CHECK = """<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  const _lc = createClient(
    'https://lnwinoghbefmjpvmixzo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo'
  );
  const { data: { session } } = await _lc.auth.getSession();
  if (!session) window.location.href = '../login.html';
</script>"""

# Files in subfolders need ../login.html
# index.html and dashboards are in root (already handled)
files = (
    glob.glob(BASE + '/year*/*.html') +
    glob.glob(BASE + '/addmaths/*.html') +
    glob.glob(BASE + '/furthermaths/*.html')
)

count = 0
skipped = 0

for f in files:
    # Skip EOY AOC files
    if 'eoy-aoc' in f or 'misconceptions' in f:
        continue

    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    # Skip if already has login check
    if '_lc.auth.getSession' in content:
        skipped += 1
        continue

    # Insert after <head> tag
    if '<head>' in content:
        new_content = content.replace('<head>', '<head>\n' + LOGIN_CHECK, 1)
    else:
        continue

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_content)

    count += 1
    print('Added: ' + f.replace(BASE + '/', ''))

print(f'\nDone — added to {count} files, skipped {skipped} already done')
