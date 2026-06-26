#!/usr/bin/env python3
"""
ABC Maths — Convert Static tryIt Questions to Dynamic
======================================================
Converts static tryIt({...}) questions to dynamic tryIt(function(){...}).
Skips files that use the yt wrapper function pattern.

Usage:
    python3 convert_tryit.py

Requirements:
    pip3 install anthropic
"""

import os
import re
import time
import anthropic

# ── Your Anthropic API key ──
ANTHROPIC_KEY = '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'

BASE = os.path.expanduser('~/maths-walkthroughs')

# ── Files safe to convert (no yt wrapper pattern) ──
FILES = [
    'year07/sequences-y7.html',
    'year07/geometry-y7.html',
    'year07/stats-y7.html',
    'year10/geometry-y10.html',
    'year10/stats-y10.html',
    'year10/calculus-diff-y10.html',
    'year10/mensuration-y10.html',
    'year10/constructions-y10.html',
    'year12/matrices-y12.html',
    'year12/modulo-y12.html',
    'year12/binary-operations-y12.html',
    'year12/calculus-y12.html',
    'year12/number-bases-y12.html',
    'year12/algebra-y12.html',
    'year12/geometry-y12.html',
]

# ── Files that use yt wrapper pattern — already dynamic, skip these ──
SKIP_YT_FILES = [
    'year08/units-measurement-y8.html',
    'year08/addition-subtraction-y8.html',
    'year08/integers-powers-roots-y8.html',
    'year08/algebra-y8.html',
    'year08/probability-y8.html',
    'year08/mixed-operations-y8.html',
    'year08/manipulation-y8.html',
    'year08/multiplication-y8.html',
    'year08/place-value-rounding-y8.html',
    'year08/equations-sequences-graphs-y8.html',
    'year08/perimeter-area-volume-y8.html',
    'year08/fractions-percentages-ratio-y8.html',
    'year08/transformations-y8.html',
    'year08/data-handling-y8.html',
    'year08/angles-y8.html',
    'year08/division-y8.html',
    'year08/shapes-construction-y8.html',
    'addmaths/functions-addmaths.html',
]

SYSTEM_PROMPT = """You are a mathematics education expert converting static JavaScript tryIt questions to dynamic randomised versions.

A static tryIt question looks like:
tryIt({question:'Find 15% of 80.',hints:['Divide by 100 then multiply','10% = 8, 5% = 4'],ans:12,unit:'',working:'15/100 × 80 = 12'})

A dynamic tryIt question looks like:
tryIt(function(){
  var n = pick([40,60,80,100,120,200]);
  var pct = pick([10,15,20,25,30]);
  var ans = n * pct / 100;
  return {
    question: 'Find ' + pct + '% of ' + n + '.',
    hints: ['Divide by 100 then multiply', '1% = ' + (n/100)],
    ans: ans,
    tol: 0,
    unit: '',
    working: pct + '/100 × ' + n + ' = ' + ans
  };
})

Rules:
- Use pick([...]) for selecting from arrays, rnd(min,max) for integers
- Keep the same mathematical concept but randomise the numbers
- Make sure ans is always correctly calculated from the random values
- Keep hints helpful and update them to reflect the random values where appropriate
- Keep working showing the calculation
- tol should be 0 for integer answers, 0.01 for decimal answers
- HTML tags like <b> are allowed in question strings
- Return ONLY the dynamic tryIt(function(){...}) JavaScript — starting with tryIt(function(){
- No markdown, no explanation, no return statement before tryIt
- Just raw JS starting with: tryIt(function(){"""

def extract_static_tryits(content):
    """Find all static tryIt({...}) calls and their positions."""
    results = []
    pattern = r'tryIt\(\{[^}]+\}\)'
    for m in re.finditer(pattern, content):
        results.append((m.start(), m.end(), m.group()))
    return results

def has_yt_pattern(content):
    """Check if file uses yt wrapper functions — skip these."""
    return bool(re.search(r'function yt\d+', content))

def convert_with_claude(client, static_tryit, context=''):
    """Use Claude to convert a static tryIt to dynamic."""
    prompt = f"""Convert this static tryIt question to a dynamic randomised version.

Context (surrounding code for understanding the topic):
{context}

Static question to convert:
{static_tryit}

Return ONLY the dynamic tryIt(function(){{...}}) JavaScript code, starting with tryIt(function(){{"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    
    result = message.content[0].text.strip()
    result = re.sub(r'^```javascript?\n?', '', result)
    result = re.sub(r'\n?```$', '', result)
    result = result.strip()
    
    # Ensure it doesn't start with 'return'
    if result.startswith('return '):
        result = result[7:]
    
    return result

def get_context(content, start, chars=500):
    ctx_start = max(0, start - chars)
    return content[ctx_start:start + chars]

def process_file(client, filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip files with yt wrapper pattern
    if has_yt_pattern(content):
        print(f'  SKIP — uses yt wrapper pattern')
        return 0
    
    static_questions = extract_static_tryits(content)
    
    if not static_questions:
        print(f'  No static questions — already done')
        return 0
    
    print(f'  Found {len(static_questions)} static questions')
    
    converted = 0
    for start, end, static_code in reversed(static_questions):
        print(f'  Converting: {static_code[:60]}...')
        
        try:
            context = get_context(content, start)
            dynamic_code = convert_with_claude(client, static_code, context)
            
            if not dynamic_code.startswith('tryIt(function'):
                print(f'  WARNING: Unexpected format — {dynamic_code[:50]}')
                continue
            
            content = content[:start] + dynamic_code + content[end:]
            converted += 1
            print(f'  ✓ Converted')
            time.sleep(1)
            
        except Exception as e:
            print(f'  ✗ Error: {e}')
    
    if converted > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return converted

def main():
    if ANTHROPIC_KEY == 'PASTE_YOUR_ANTHROPIC_KEY_HERE':
        print('ERROR: Please paste your Anthropic API key.')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    print('ABC Maths — Convert Static tryIt to Dynamic (Safe Version)')
    print('=' * 55)
    print(f'Processing {len(FILES)} files (skipping {len(SKIP_YT_FILES)} yt-pattern files)...')
    print()
    
    total = 0
    for rel_path in FILES:
        full_path = os.path.join(BASE, rel_path)
        if not os.path.exists(full_path):
            print(f'MISSING: {rel_path}')
            continue
        print(f'Processing: {rel_path}')
        n = process_file(client, full_path)
        total += n
        print()
        time.sleep(0.5)
    
    print('=' * 55)
    print(f'Total converted: {total}')
    print()
    print('Test each file on localhost before pushing to GitHub.')

if __name__ == '__main__':
    main()
