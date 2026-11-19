# Builds the "Founders on repeat" and "Quick facts" recordings for the Listen tab.
# Same voice and settings as facts.mp3 and quiz.mp3 (Kokoro af_heart, 0.95x, 24 kHz, 64k mono MP3).
#
#   pip install kokoro-onnx==0.6.1 soundfile
#   models: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
#   python3 tools/audio/build_extras.py --models /path/to/models [--cache /path/to/cache]
#
# Writes audio/founders.mp3 and audio/quickfacts.mp3 and merges both into audio/tracks.json.
# Everything here comes from the public guide (index.html). Numbers are written out so they read cleanly.
import argparse, hashlib, json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICE, SPEED, SR = 'af_heart', 0.95, 24000
PHONE_FIX = {'pˈoʊlmɑːɹk': 'pˈɑːləmˌɑːɹk', 'stɹˈæɾɛɡəs': 'stɹətˈiːɡəs'}  # Polemarch, Strategus

FOUNDERS = ['Elder Watson Diggs', 'Ezra Dee Alexander', 'Byron Kenneth Armstrong', 'Henry Tourner Asher',
            'Marcus Peter Blakemore', 'Paul Waymond Caine', 'George Wesley Edmonds', 'Guy Levis Grant',
            'Edward Giles Irvin', 'John Milton Lee']
NUMS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
LAST = ', '.join(n.split()[-1] for n in FOUNDERS) + '.'
GREEK = ('Alpha, Beta, Gamma, Delta, Epsilon, Zeta, Eta, Theta, Iota, Kappa, Lambda, Mu, '
         'Nu, Xi, Omicron, Pi, Rho, Sigma, Tau, Upsilon, Phi, Chi, Psi, Omega.')

# Each chapter: id, title (shown in the app), spoken title, items, gap between items, gap between passes, passes
FOUNDERS_REC = {
    'id': 'founders', 'title': 'Founders on repeat', 'src': 'audio/founders.mp3',
    'chapters': [
        {'id': 'fr-full', 'title': 'Full names, in order', 'say': 'The Ten Founders, in order.',
         'items': [n + '.' for n in FOUNDERS], 'gap': 0.8, 'pass_gap': 2.5, 'passes': 5},
        {'id': 'fr-numbered', 'title': 'Numbered', 'say': 'By number.',
         'items': [f'{NUMS[i]}, {n}.' for i, n in enumerate(FOUNDERS)], 'gap': 0.8, 'pass_gap': 2.5, 'passes': 3},
        {'id': 'fr-last', 'title': 'Last names', 'say': 'Last names.',
         'items': [LAST], 'gap': 1.6, 'pass_gap': 1.6, 'passes': 6},
    ],
}

QUICK_REC = {
    'id': 'quickfacts', 'title': 'Quick facts', 'src': 'audio/quickfacts.mp3',
    'chapters': [
        {'id': 'qf-fraternity', 'title': 'The Fraternity', 'say': 'The Fraternity.', 'items': [
            'Kappa Alpha Psi was founded on January fifth, nineteen eleven.',
            'It was founded on the campus of Indiana University in Bloomington, Indiana.',
            'There are ten Founders.',
            'The colors are crimson and cream.',
            'The motto is Achievement in Every Field of Human Endeavor.',
            'While it was forming, the group was first called Alpha Omega.',
            'The original name was Kappa Alpha Nu.',
            'On May fifteenth, nineteen eleven, Kappa Alpha Nu became the first incorporated Black fraternity in the United States.',
            'The name change to Kappa Alpha Psi was adopted at the Grand Chapter Meeting in December nineteen fourteen.',
            'The new name took effect on April fifteenth, nineteen fifteen.',
            'The Greek letter Psi replaced Nu.',
            'Kappa is the second-oldest existing collegiate historically Black Greek letter fraternity.',
            'It is the only Greek letter organization founded with the concept of achievement.',
            'The Kappa Alpha Nu Journal first appeared in April nineteen fourteen.',
            'Diggs and Armstrong created the ritual, the constitution, the hymn and the motto.',
            'Brothers who have passed have transitioned into the Chapter Invisible.',
            'Kappa has over one hundred fifty thousand members and seven hundred undergraduate and alumni chapters.',
        ]},
        {'id': 'qf-founders', 'title': 'The Founders', 'say': 'The Founders.', 'items': [
            'Elder Watson Diggs is the Father of Kappa.',
            'Diggs is known as the Dreamer.',
            'Diggs was the first Grand Polemarch, from nineteen eleven to nineteen seventeen.',
            'Diggs was named permanent chairman.',
            'Ezra Dee Alexander, nicknamed Dee, was a teacher and principal, then a doctor.',
            'Alexander practiced medicine in Indianapolis for nearly fifty years.',
            'Byron Kenneth Armstrong, nicknamed Boomski, was a professor and a dean.',
            'Armstrong was the sergeant-at-arms.',
            'Henry Tourner Asher was an instructor at Lincoln Institute, and earned a law degree from the Detroit College of Law.',
            'Marcus Peter Blakemore, nicknamed Blakie, organized the Electric Engineering Company.',
            'Blakemore served in the Army as a Private.',
            'Paul Waymond Caine was an entrepreneur, a chef and a caterer.',
            'George Wesley Edmonds was the Corresponding Secretary in the articles of incorporation.',
            'Guy Levis Grant was a dentist in Indianapolis for over fifty years.',
            'Edward Giles Irvin was the youngest Founder, at seventeen.',
            'Irvin was a civic and religious leader, a journalist and an entrepreneur.',
            'Irvin was the interim secretary of Alpha Omega.',
            'John Milton Lee was the secretary.',
            'Lee completed three years of pre-medical work.',
            'The national site lists no occupation for Diggs, Edmonds or Lee.',
            'The first initiates were the three freshmen: Asher, Blakemore and Edmonds.',
        ]},
        {'id': 'qf-objectives', 'title': 'The Five Objectives', 'say': 'The Five Objectives.', 'items': [
            'One: to unite college men of culture, patriotism and honor in a bond of fraternity.',
            'Two: to encourage honorable achievement in every field of human endeavor.',
            'Three: to promote the spiritual, social, intellectual, and moral welfare of its members.',
            'Four: to aid the aims and purposes of colleges and universities.',
            'Five: to inspire service in the public interest.',
        ]},
        {'id': 'qf-grand', 'title': 'The Grand Chapter', 'say': 'The Grand Chapter.', 'items': [
            'The thirty-fifth Grand Polemarch is Jimmy McMikle.',
            'The International Headquarters is at twenty-three twenty-two through twenty-four North Broad Street in Philadelphia.',
            'Kappa has twelve provinces.',
            'In nineteen twenty, the third Grand Polemarch, George F. David the Second, created three districts.',
            'In nineteen twenty-three, the fourth Grand Polemarch, W. Ellis Stewart, renamed them regions.',
            'In nineteen twenty-six, the fifth Grand Polemarch, Earl B. Dickerson, renamed regions provinces.',
            'Regional Directors became Province Polemarchs.',
        ]},
        {'id': 'qf-province', 'title': 'The Western Province', 'say': 'The Western Province.', 'items': [
            'The Western Province Polemarch is Frederic S. Roots the Second, the thirtieth.',
            'The Western Province has members in nine states: Alaska, Arizona, California, Hawaii, Idaho, Nevada, Oregon, Utah and Washington.',
            'It also has two international chapters, in Japan and South Korea.',
            'Its four clusters are the Pacific Northwest, Northern California, Southern California and the Southwest.',
            'The Upsilon chapter at U C L A, chartered April twenty-fifth, nineteen twenty-three, was the first chapter of the current Western Province.',
            'The first Polemarch of the Western Region was Judge Carl R. Johnson.',
            'Grand Polemarchs from the Western Province: Thomas J. Bradley, Randall C. Bacon and Robert L. Harris.',
            'The Western Province Council meets in Oakland the second week of April, twenty twenty-seven.',
        ]},
        {'id': 'qf-chapter', 'title': 'Los Angeles Alumni', 'say': 'Los Angeles Alumni.', 'items': [
            'Los Angeles Alumni was chartered on August eighth, nineteen thirty-eight.',
            'It was the first alumni chapter in the Western Province.',
            'It is known as the Jewel of the West.',
            'The Polemarch is Gregory Black.',
            'The Vice Polemarch is Steve Bayne.',
            'The Keeper of Records is Keith Lewis Junior.',
            'The Keeper of Exchequer is Frederick Braggs.',
            'The Assistant Keeper of Records is Christopher Henderson.',
            'The Strategus is Eric Fitzpatrick.',
            'The Lieutenant Strategus is Robert Joiner.',
            'The Reporter is Marques Gunn.',
            'The Historian is Terrance Lark.',
            'The House Director is Derek S. Hamilton Senior.',
            'The M T A Chairman is Darryll Holmes, and the Co-Chairman is Marcellus Mayberry.',
            'The Kappa Kastle is at eighteen forty-six South Crenshaw Boulevard.',
            'The first Kappa Kastle was dedicated in nineteen fifty-one, on South Harvard Boulevard.',
            'Los Angeles Alumni is the birthplace of Kappa League and the Black and White Ball.',
        ]},
        {'id': 'qf-programs', 'title': 'Programs', 'say': 'Programs.', 'items': [
            'Guide Right is the National Service Initiative.',
            'Guide Right was conceived in nineteen twenty-two by Leon W. Stewart.',
            'Kappa League was founded on February twelfth, nineteen sixty-nine, by Los Angeles Alumni at Locke High School.',
            "Kappa League's founders were Mel L. Davis and Edgar H. Bishop.",
            'Kappa League was adopted by all chapters at the fifty-sixth Grand Chapter Meeting, in Charlotte, in nineteen seventy.',
            'Kappa League serves young men in grades six through twelve.',
            "Kappa League's five study areas are self-identity, training, competition, social, and health education.",
            'The Kappa Alpha Psi Foundation was established in nineteen eighty-one.',
            "Kappa's national philanthropic partner is Saint Jude Children's Research Hospital.",
            'Kappa has supported Saint Jude since two thousand three.',
            'The Saint Jude Walk is held each September.',
        ]},
        {'id': 'qf-greek', 'title': 'The Greek Alphabet', 'say': 'The Greek Alphabet.', 'items': [
            'The Greek alphabet has twenty-four letters.',
            GREEK,
            'Alpha and Omega are the first and last letters.',
        ]},
    ],
}
for c in QUICK_REC['chapters']:
    c.update(gap=0.6, pass_gap=0.0, passes=1)

TITLE_GAP, CHAPTER_GAP = 0.7, 2.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True)
    ap.add_argument('--cache', default=os.path.join(ROOT, '.tts-cache'))
    ap.add_argument('--only', choices=['founders', 'quickfacts'])
    a = ap.parse_args()
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(a.models, 'kokoro-v1.0.onnx'), os.path.join(a.models, 'voices-v1.0.bin'))
    os.makedirs(a.cache, exist_ok=True)

    def say(text):
        ph = k.tokenizer.phonemize(text, 'en-us')
        for bad, good in PHONE_FIX.items():
            ph = ph.replace(bad, good)
        key = hashlib.sha1(f'{VOICE}|{SPEED}|{ph}'.encode()).hexdigest()
        path = os.path.join(a.cache, key + '.npy')
        if os.path.exists(path):
            return np.load(path)
        x, sr = k.create(ph, voice=VOICE, speed=SPEED, is_phonemes=True, sentence_pause=0.35, clause_pause=0.12)
        assert sr == SR
        x = x.astype(np.float32)
        np.save(path, x)
        return x

    sil = lambda s: np.zeros(int(round(s * SR)), dtype=np.float32)
    manifest_path = os.path.join(ROOT, 'audio', 'tracks.json')
    m = json.load(open(manifest_path))
    for rec in (QUICK_REC, FOUNDERS_REC):
        if a.only and rec['id'] != a.only:
            continue
        parts, pos, chapters = [], 0, []
        def add(x):
            nonlocal pos
            parts.append(x); pos += len(x)
        for c in rec['chapters']:
            start = pos / SR
            add(say(c['say'])); add(sil(TITLE_GAP))
            for p in range(c['passes']):
                for i, it in enumerate(c['items']):
                    add(say(it))
                    if i < len(c['items']) - 1:
                        add(sil(c['gap']))
                if p < c['passes'] - 1:
                    add(sil(c['pass_gap']))
            chapters.append({'id': c['id'], 'title': c['title'], 'start': round(start, 2), 'end': round(pos / SR, 2)})
            add(sil(CHAPTER_GAP))
            print(f"  {rec['id']}: {c['title']} {chapters[-1]['end'] - chapters[-1]['start']:.0f}s", flush=True)
        pcm = np.concatenate(parts)
        out = os.path.join(ROOT, rec['src'])
        enc = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                              '-c:a', 'libmp3lame', '-b:a', '64k', '-ar', str(SR), '-ac', '1', out],
                             input=pcm.tobytes())
        if enc.returncode:
            sys.exit('ffmpeg failed')
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out],
                                   capture_output=True, text=True).stdout.strip())
        info = {'id': rec['id'], 'title': rec['title'], 'src': rec['src'], 'duration': round(dur, 2),
                'bytes': os.path.getsize(out), 'chapters': chapters}
        m['files'] = [f for f in m['files'] if f['id'] != rec['id']]
        m['files'].append(info)
        print(f"{rec['id']}: {dur / 60:.1f} min, {info['bytes'] / 1e6:.1f} MB", flush=True)
    order = ['facts', 'quickfacts', 'founders', 'quiz']
    m['files'].sort(key=lambda f: order.index(f['id']) if f['id'] in order else 99)
    json.dump(m, open(manifest_path, "w"), indent=1)


if __name__ == '__main__':
    main()
