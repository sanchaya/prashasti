#!/usr/bin/env python3
"""
English-to-Kannada name transliteration for Prashasti Sanchaya.

Generates the `name_kn` field on every recipient record. This is a small,
dependency-free, rule-based phonetic engine -- not a proper NLP
transliteration model. It exists because plain English name spellings
(as scraped from Wikipedia/news sources) carry no marks for vowel length
or retroflex-vs-dental consonants, so a byte-for-byte "correct" Kannada
rendering isn't recoverable from the Roman spelling alone.

Two-tier approach:
  1. WORD_DICT: ~90 of the most frequent Karnataka name-parts and surnames
     (Rao, Gowda, Shetty, Reddy, Murthy, Krishna, Narayana, Patil, Swamy,
     etc.), hardcoded to their standard/conventional Kannada spelling.
     Covers a disproportionate share of tokens in this dataset because
     Karnataka surnames follow a fairly small, high-frequency set.
  2. Generic syllable engine: consonant-cluster + vowel-pattern matching,
     greedy longest-match, for everything not in the dictionary. Known
     limitations: vowel length is a guess (e.g. "Ashok" may come out short
     where the real spelling is long), retroflex/dental consonants collapse
     to one default, and bare initials ("S.", "M.") render as a plain
     consonant rather than a spelled-out letter name.

Where a recipient has an actual Kannada Wikipedia article, the site
(js/app.js, detailHtml()) fetches and displays that real title instead --
this script's output is only the fallback for the ~90% of recipients
without one, and the label used in the browse list and map pins in
Kannada mode.

Usage:
    python3 scripts/kn_translit.py                 # runs the built-in self-test
    python3 -c "from scripts.kn_translit import translit_name; print(translit_name('B. Saroja Devi'))"

To regenerate name_kn across all award files:
    python3 - <<'EOF'
    import glob, json
    from scripts.kn_translit import translit_name
    for f in glob.glob('data/awards/*.json'):
        if f.endswith('_district_counts.json'): continue
        recs = json.load(open(f, encoding='utf-8'))
        for r in recs:
            if r.get('name'):
                r['name_kn'] = translit_name(r['name'])
        json.dump(recs, open(f, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    EOF
"""
import re

VOWELS_IND = {
    'a': 'ಅ', 'aa': 'ಆ', 'i': 'ಇ', 'ii': 'ಈ', 'ee': 'ಈ', 'u': 'ಉ', 'oo': 'ಊ', 'uu': 'ಊ',
    'e': 'ಎ', 'ai': 'ಐ', 'ay': 'ಐ', 'o': 'ಒ', 'oa': 'ಓ', 'au': 'ಔ', 'aw': 'ಔ', 'ow': 'ಔ',
}
VOWELS_MATRA = {
    'a': '', 'aa': 'ಾ', 'i': 'ಿ', 'ii': 'ೀ', 'ee': 'ೀ', 'u': 'ು', 'oo': 'ೂ', 'uu': 'ೂ',
    'e': 'ೆ', 'ai': 'ೈ', 'ay': 'ೈ', 'o': 'ೊ', 'oa': 'ೋ', 'au': 'ೌ', 'aw': 'ೌ', 'ow': 'ೌ',
}
VOWEL_PATTERNS = ['aai', 'oai', 'oo', 'uu', 'ee', 'ai', 'ay', 'au', 'aw', 'ow', 'oa',
                   'a', 'e', 'i', 'o', 'u']

CONSONANTS = {
    'chh': 'ಛ', 'sh': 'ಶ', 'ch': 'ಚ', 'th': 'ತ', 'dh': 'ದ', 'ph': 'ಫ', 'bh': 'ಭ',
    'gh': 'ಘ', 'kh': 'ಖ', 'jh': 'ಝ', 'ng': 'ಂಗ', 'ny': 'ಞ', 'ts': 'ಚ್ಸ',
    'b': 'ಬ', 'c': 'ಕ', 'd': 'ದ', 'f': 'ಫ', 'g': 'ಗ', 'h': 'ಹ', 'j': 'ಜ',
    'k': 'ಕ', 'l': 'ಲ', 'm': 'ಮ', 'n': 'ನ', 'p': 'ಪ', 'q': 'ಕ', 'r': 'ರ',
    's': 'ಸ', 't': 'ತ', 'v': 'ವ', 'w': 'ವ', 'x': 'ಕ್ಸ', 'y': 'ಯ', 'z': 'ಜ಼',
}
CONS_PATTERNS = ['chh', 'sh', 'ch', 'th', 'dh', 'ph', 'bh', 'gh', 'kh', 'jh', 'ng', 'ny', 'ts',
                  'b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z']

VIRAMA = '್'

TITLE_MAP = {
    'dr': 'ಡಾ', 'mr': 'ಶ್ರೀ', 'mrs': 'ಶ್ರೀಮತಿ', 'ms': 'ಕುಮಾರಿ', 'smt': 'ಶ್ರೀಮತಿ',
    'sri': 'ಶ್ರೀ', 'shri': 'ಶ್ರೀ', 'lt': 'ಲೆಫ್ಟಿನೆಂಟ್', 'gen': 'ಜನರಲ್', 'col': 'ಕರ್ನಲ್',
    'prof': 'ಪ್ರೊ', 'capt': 'ಕ್ಯಾಪ್ಟನ್', 'maj': 'ಮೇಜರ್',
}

# High-frequency common Karnataka name words/surnames, hardcoded with their
# standard/conventional Kannada spellings (checked whole-word, case-insensitive)
# rather than run through the generic phonetic engine, which gets these wrong
# (missing long vowels, retroflex consonants, and diphthongs that plain
# English spelling doesn't mark).
WORD_DICT = {
    'rao': 'ರಾವ್', 'patil': 'ಪಾಟೀಲ್', 'shetty': 'ಶೆಟ್ಟಿ', 'gowda': 'ಗೌಡ',
    'krishna': 'ಕೃಷ್ಣ', 'murthy': 'ಮೂರ್ತಿ', 'narayana': 'ನಾರಾಯಣ', 'narayan': 'ನಾರಾಯಣ್',
    'nayak': 'ನಾಯಕ್', 'naik': 'ನಾಯಕ್', 'kumar': 'ಕುಮಾರ್', 'nagaraj': 'ನಾಗರಾಜ್',
    'shankar': 'ಶಂಕರ್', 'bhat': 'ಭಟ್', 'joshi': 'ಜೋಶಿ', 'krishnamurthy': 'ಕೃಷ್ಣಮೂರ್ತಿ',
    'reddy': 'ರೆಡ್ಡಿ', 'iyengar': 'ಅಯ್ಯಂಗಾರ್', 'hegde': 'ಹೆಗ್ಡೆ', 'swamy': 'ಸ್ವಾಮಿ',
    'swami': 'ಸ್ವಾಮಿ', 'gopalakrishna': 'ಗೋಪಾಲಕೃಷ್ಣ', 'ramesh': 'ರಮೇಶ್', 'gopal': 'ಗೋಪಾಲ್',
    'prakash': 'ಪ್ರಕಾಶ್', 'basappa': 'ಬಸಪ್ಪ', 'singh': 'ಸಿಂಗ್', 'srinivas': 'ಶ್ರೀನಿವಾಸ್',
    'ramachandra': 'ರಾಮಚಂದ್ರ', 'prasad': 'ಪ್ರಸಾದ್', 'kulkarni': 'ಕುಲಕರ್ಣಿ', 'ashok': 'ಅಶೋಕ್',
    'ahmed': 'ಅಹಮದ್', 'acharya': 'ಆಚಾರ್ಯ', 'pai': 'ಪೈ', 'sharma': 'ಶರ್ಮಾ',
    'venkatesh': 'ವೆಂಕಟೇಶ್', 'manjunath': 'ಮಂಜುನಾಥ್', 'suresh': 'ಸುರೇಶ್', 'lingappa': 'ಲಿಂಗಪ್ಪ',
    'basavaraj': 'ಬಸವರಾಜ್', 'mahadevappa': 'ಮಹಾದೇವಪ್ಪ', 'shastry': 'ಶಾಸ್ತ್ರಿ', 'shastri': 'ಶಾಸ್ತ್ರಿ',
    'hiremath': 'ಹಿರೇಮಠ್', 'mahadeva': 'ಮಹಾದೇವ', 'bhajantri': 'ಭಜಂತ್ರಿ', 'lakshmi': 'ಲಕ್ಷ್ಮಿ',
    'shivaram': 'ಶಿವರಾಮ್', 'ramakrishna': 'ರಾಮಕೃಷ್ಣ', 'chandrasekhar': 'ಚಂದ್ರಶೇಖರ್',
    'veerabhadrappa': 'ವೀರಭದ್ರಪ್ಪ', 'narasimhaiah': 'ನರಸಿಂಹಯ್ಯ', 'raghavendra': 'ರಾಘವೇಂದ್ರ',
    'ramaswamy': 'ರಾಮಸ್ವಾಮಿ', 'mohammed': 'ಮಹಮದ್', 'mohammad': 'ಮಹಮದ್', 'das': 'ದಾಸ್',
    'siddalingaiah': 'ಸಿದ್ದಲಿಂಗಯ್ಯ', 'rajkumar': 'ರಾಜಕುಮಾರ್', 'bai': 'ಬಾಯಿ', 'ramappa': 'ರಾಮಪ್ಪ',
    'devi': 'ದೇವಿ', 'venkata': 'ವೆಂಕಟ', 'puttappa': 'ಪುಟ್ಟಪ್ಪ', 'subramanya': 'ಸುಬ್ರಹ್ಮಣ್ಯ',
    'jois': 'ಜೋಯಿಸ್', 'saroja': 'ಸರೋಜ', 'vittal': 'ವಿಠ್ಠಲ್', 'sunil': 'ಸುನಿಲ್',
    'ganesh': 'ಗಣೇಶ್', 'ganesha': 'ಗಣೇಶ', 'raju': 'ರಾಜು', 'raj': 'ರಾಜ್', 'kamath': 'ಕಾಮತ್',
    'rai': 'ರೈ', 'shetti': 'ಶೆಟ್ಟಿ', 'aiyar': 'ಅಯ್ಯರ್', 'iyer': 'ಅಯ್ಯರ್', 'nair': 'ನಾಯರ್',
    'menon': 'ಮೆನನ್', 'pillai': 'ಪಿಳ್ಳೈ', 'urs': 'ಒಡೆಯರ್',
    'wodeyar': 'ಒಡೆಯರ್', 'mysore': 'ಮೈಸೂರು', 'bangalore': 'ಬೆಂಗಳೂರು', 'bengaluru': 'ಬೆಂಗಳೂರು',
}

def translit_word(word):
    w = word.lower()
    w = re.sub(r'[^a-z]', '', w)
    if not w:
        return ''
    if w in WORD_DICT:
        return WORD_DICT[w]
    # word-final 'y' after a consonant almost always represents a long-i
    # sound in these names (Shetty, Reddy, Murthy), not consonant y
    if len(w) > 2 and w.endswith('y') and w[-2] not in 'aeiou':
        w = w[:-1] + 'i'

    out = []
    i = 0
    n = len(w)
    pending_consonant = None

    def flush_consonant_no_vowel():
        nonlocal pending_consonant
        if pending_consonant is not None:
            out.append(pending_consonant + VIRAMA)
            pending_consonant = None

    while i < n:
        matched = False
        for c in CONS_PATTERNS:
            if w.startswith(c, i):
                flush_consonant_no_vowel()
                pending_consonant = CONSONANTS[c]
                i += len(c)
                matched = True
                break
        if matched:
            continue
        for v in VOWEL_PATTERNS:
            if w.startswith(v, i):
                if pending_consonant is not None:
                    out.append(pending_consonant + VOWELS_MATRA[v])
                    pending_consonant = None
                else:
                    out.append(VOWELS_IND[v])
                i += len(v)
                matched = True
                break
        if matched:
            continue
        i += 1

    flush_consonant_no_vowel()
    return ''.join(out)

def translit_name(name):
    parts = re.split(r'(\s+|-)', name)
    result = []
    for p in parts:
        if p.strip() == '' or p == '-':
            result.append(p)
            continue
        cleaned = p.replace('.', '')
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in TITLE_MAP:
            result.append(TITLE_MAP[key])
            continue
        result.append(translit_word(cleaned))
    return ''.join(result)

if __name__ == '__main__':
    tests = ["Keki B. Tarapore", "C. M. Ramachandra", "Master Vittal Shetty", "S. V. Jayasheela Rao",
              "Javare Gowda", "B. Saroja Devi", "Puneeth Rajkumar", "Shivakumara Swami",
              "L. Narayana Reddy", "Dr. Rajkumar", "Patil Puttappa", "N. R. Narayana Murthy",
              "G. Venkatasubbiah", "Subramanya Jois"]
    for t in tests:
        print(t, "->", translit_name(t))
