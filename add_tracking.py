#!/usr/bin/env python3
"""
ABC Maths Walkthrough — Supabase Completion Tracker Injector
Run from your maths-walkthroughs folder:
  python3 add_tracking.py

This script adds progress tracking to every walkthrough HTML file so that
when a student reaches the last step, it marks the topic as 'completed'
in the Supabase database.
"""

import os
import re

# ── Your Supabase credentials ──
SUPABASE_URL  = 'https://lnwinoghbefmjpvmixzo.supabase.co'
SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo'

# ── Topic code map — file path → topic code ──
TOPIC_CODES = {
    # Year 7
    'year07/algebra-y7.html':        'Y7-ALG-01',
    'year07/geometry-y7.html':       'Y7-GEO-01',
    'year07/number-y7.html':         'Y7-NUM-01',
    'year07/stats-y7.html':          'Y7-STA-01',
    'year07/sequences-y7.html':      'Y7-SEQ-01',
    'year07/misconceptions-y7.html': 'Y7-MIS-01',
    # Year 8
    'year08/place-value-rounding-y8.html':        'Y8-NUM-01',
    'year08/addition-subtraction-y8.html':         'Y8-NUM-02',
    'year08/multiplication-y8.html':               'Y8-NUM-03',
    'year08/division-y8.html':                     'Y8-NUM-04',
    'year08/integers-powers-roots-y8.html':        'Y8-NUM-05',
    'year08/fractions-percentages-ratio-y8.html':  'Y8-NUM-06',
    'year08/mixed-operations-y8.html':             'Y8-NUM-07',
    'year08/algebra-y8.html':                      'Y8-ALG-01',
    'year08/manipulation-y8.html':                 'Y8-ALG-02',
    'year08/equations-sequences-graphs-y8.html':   'Y8-ALG-03',
    'year08/angles-y8.html':                       'Y8-GEO-01',
    'year08/shapes-construction-y8.html':          'Y8-GEO-02',
    'year08/perimeter-area-volume-y8.html':        'Y8-GEO-03',
    'year08/transformations-y8.html':              'Y8-GEO-04',
    'year08/data-handling-y8.html':                'Y8-STA-01',
    'year08/probability-y8.html':                  'Y8-STA-02',
    'year08/units-measurement-y8.html':            'Y8-MEA-01',
    'year08/misconceptions-y8.html':               'Y8-MIS-01',
    # Year 9
    'year09/number-y9.html':           'Y9-NUM-01',
    'year09/algebra-y9.html':          'Y9-ALG-01',
    'year09/sequences-y9.html':        'Y9-ALG-02',
    'year09/graphs-y9.html':           'Y9-ALG-03',
    'year09/geometry-y9.html':         'Y9-GEO-01',
    'year09/mensuration-y9.html':      'Y9-GEO-02',
    'year09/pythagoras-trig-y9.html':  'Y9-GEO-03',
    'year09/transformations-y9.html':  'Y9-GEO-04',
    'year09/statistics-y9.html':       'Y9-STA-01',
    'year09/probability-y9.html':      'Y9-STA-02',
    'year09/misconceptions-y9.html':   'Y9-MIS-01',
    # Year 10
    'year10/number-y10.html':          'Y10-NUM-01',
    'year10/algebra-y10.html':         'Y10-ALG-01',
    'year10/graphs-y10.html':          'Y10-ALG-02',
    'year10/geometry-y10.html':        'Y10-GEO-01',
    'year10/mensuration-y10.html':     'Y10-GEO-02',
    'year10/constructions-y10.html':   'Y10-GEO-03',
    'year10/trig-y10.html':            'Y10-GEO-04',
    'year10/calculus-diff-y10.html':   'Y10-CAL-01',
    'year10/stats-y10.html':           'Y10-STA-01',
    'year10/misconceptions-y10.html':  'Y10-MIS-01',
    # Year 11
    'year11/algebra-y11.html':         'Y11-ALG-01',
    'year11/geometry-y11.html':        'Y11-GEO-01',
    'year11/mensuration-y11.html':     'Y11-GEO-02',
    'year11/transformations-y11.html': 'Y11-GEO-03',
    'year11/percentages-y11.html':     'Y11-NUM-01',
    'year11/sets-y12.html':            'Y11-ALG-02',
    'year11/vectors-y11.html':         'Y11-VEC-01',
    'year11/misconceptions-y11.html':  'Y11-MIS-01',
    # Year 12
    'year12/algebra-y12.html':          'Y12-ALG-01',
    'year12/geometry-y12.html':         'Y12-GEO-01',
    'year12/calculus-y12.html':         'Y12-CAL-01',
    'year12/number-bases-y12.html':     'Y12-NUM-01',
    'year12/modulo-y12.html':           'Y12-NUM-02',
    'year12/binary-operations-y12.html':'Y12-ALG-02',
    'year12/matrices-y12.html':         'Y12-ALG-03',
    'year12/sets-y12.html':             'Y12-ALG-04',
    # Add Maths
    'addmaths/algebra-addmaths.html':                    'AM-ALG-01',
    'addmaths/equations-inequalities-addmaths.html':     'AM-ALG-02',
    'addmaths/quadratics-advanced-addmaths.html':        'AM-ALG-03',
    'addmaths/polynomials-addmaths.html':                'AM-ALG-04',
    'addmaths/partial-fractions-addmaths.html':          'AM-ALG-05',
    'addmaths/simultaneous-advanced-addmaths.html':      'AM-ALG-06',
    'addmaths/surds-addmaths.html':                      'AM-ALG-07',
    'addmaths/series-addmaths.html':                     'AM-ALG-08',
    'addmaths/functions-addmaths.html':                  'AM-FUN-01',
    'addmaths/log-exp-addmaths.html':                    'AM-LOG-01',
    'addmaths/straight-lines-addmaths.html':             'AM-GEO-01',
    'addmaths/circle-equation-addmaths.html':            'AM-GEO-02',
    'addmaths/differentiation-addmaths.html':            'AM-CAL-01',
    'addmaths/integration-addmaths.html':                'AM-CAL-02',
    'addmaths/trigonometry-addmaths.html':               'AM-TRI-01',
    'addmaths/trig-identities-addmaths.html':            'AM-TRI-02',
    'addmaths/circular-measure-addmaths.html':           'AM-TRI-03',
    'addmaths/permutation-combination-addmaths.html':    'AM-STA-01',
}

# ── The Supabase tracking script to inject into each file ──
TRACKING_SCRIPT = """
<!-- ABC Supabase Progress Tracking -->
<script type="module">
import {{ createClient }} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const _sb = createClient('{url}', '{anon}');
const _tc = '{topic_code}';

async function markComplete() {{
  const {{ data: {{ session }} }} = await _sb.auth.getSession();
  if (!session) return;
  const {{ data: topic }} = await _sb
    .from('topics').select('id').eq('topic_code', _tc).maybeSingle();
  if (!topic) return;
  await _sb.from('walkthrough_progress').upsert({{
    student_id:   session.user.id,
    topic_id:     topic.id,
    status:       'completed',
    completed_at: new Date().toISOString(),
    last_visited_at: new Date().toISOString(),
  }}, {{ onConflict: 'student_id,topic_id' }});
}}

// Hook into the Next button — fires when student reaches last step
document.addEventListener('DOMContentLoaded', function() {{
  var nb = document.getElementById('nb');
  if (!nb) return;
  nb.addEventListener('click', function() {{
    if (nb.textContent.trim() === 'Restart') {{
      markComplete();
    }}
  }});
}});
</script>
"""

def already_patched(content):
    return 'ABC Supabase Progress Tracking' in content

def patch_file(filepath, topic_code):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if already_patched(content):
        return 'already patched'

    # Insert just before </body>
    tracking = TRACKING_SCRIPT.format(
        url=SUPABASE_URL,
        anon=SUPABASE_ANON,
        topic_code=topic_code
    )

    if '</body>' not in content:
        return 'no </body> tag found'

    new_content = content.replace('</body>', tracking + '</body>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return 'patched'

def main():
    # Find the maths-walkthroughs root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print('ABC Maths — Progress Tracking Injector')
    print('=' * 45)
    print(f'Running from: {script_dir}')
    print()

    ok = 0
    skipped = 0
    missing = 0
    errors = []

    for rel_path, topic_code in TOPIC_CODES.items():
        full_path = os.path.join(script_dir, rel_path)
        
        if not os.path.exists(full_path):
            print(f'  MISSING  {rel_path}')
            missing += 1
            continue

        result = patch_file(full_path, topic_code)
        
        if result == 'patched':
            print(f'  ✓ {rel_path}  [{topic_code}]')
            ok += 1
        elif result == 'already patched':
            print(f'  ↷ {rel_path}  (already done)')
            skipped += 1
        else:
            print(f'  ✗ {rel_path}  ERROR: {result}')
            errors.append(rel_path)

    print()
    print('=' * 45)
    print(f'✓ Patched:        {ok}')
    print(f'↷ Already done:   {skipped}')
    print(f'  Missing files:  {missing}')
    print(f'✗ Errors:         {len(errors)}')
    if errors:
        print('  Error files:', errors)
    print()
    print('Done! Students will now have their progress tracked when')
    print('they complete the final step of each walkthrough.')

if __name__ == '__main__':
    main()
