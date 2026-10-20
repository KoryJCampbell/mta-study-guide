// Diamond Run question bank.
// Every fact here comes from the study guide (index.html), which takes its facts from
// kappaalphapsi1911.com, wp1911.com, lakappas1938.com and the LA Alumni MTA emails.
// Wrong answers are either true facts that belong to something else, or plainly wrong options.

export const DECKS = [
  ['all', 'All'], ['history', 'History'], ['founders', 'Founders'], ['national', 'Fraternity'],
  ['province', 'Province'], ['chapter', 'LA Alumni'], ['programs', 'Programs'],
  ['greek', 'Greek'], ['mta', 'Spring 2027']
];

export const FOUNDERS = {
  diggs: 'Elder Watson Diggs', armstrong: 'Byron Kenneth Armstrong', lee: 'John Milton Lee',
  asher: 'Henry Tourner Asher', blakemore: 'Marcus Peter Blakemore', grant: 'Guy Levis Grant',
  caine: 'Paul Waymond Caine', edmonds: 'George Wesley Edmonds', alexander: 'Ezra Dee Alexander',
  irvin: 'Edward Giles Irvin'
};

export const GREEK = [
  ['Α', 'α', 'Alpha'], ['Β', 'β', 'Beta'], ['Γ', 'γ', 'Gamma'], ['Δ', 'δ', 'Delta'],
  ['Ε', 'ε', 'Epsilon'], ['Ζ', 'ζ', 'Zeta'], ['Η', 'η', 'Eta'], ['Θ', 'θ', 'Theta'],
  ['Ι', 'ι', 'Iota'], ['Κ', 'κ', 'Kappa'], ['Λ', 'λ', 'Lambda'], ['Μ', 'μ', 'Mu'],
  ['Ν', 'ν', 'Nu'], ['Ξ', 'ξ', 'Xi'], ['Ο', 'ο', 'Omicron'], ['Π', 'π', 'Pi'],
  ['Ρ', 'ρ', 'Rho'], ['Σ', 'σ', 'Sigma'], ['Τ', 'τ', 'Tau'], ['Υ', 'υ', 'Upsilon'],
  ['Φ', 'φ', 'Phi'], ['Χ', 'χ', 'Chi'], ['Ψ', 'ψ', 'Psi'], ['Ω', 'ω', 'Omega']
];

export const BANK = [];
// Fixed question: one right answer, two wrong ones.
const q = (id, d, text, a, w, n) => BANK.push({ id, d, q: text, a, w, n });
// Founder question: the wrong answers are other Founders, skipping any listed in `not`.
// `who` can be a list, in which case one of them is the answer and the rest are skipped.
const f = (id, text, who, not, n) => BANK.push({ id, d: 'founders', q: text, who, not: not || [], n });
// Pick question: the answer is drawn from `right`, two wrong answers from `wrong`.
const p = (id, d, text, right, wrong, n) => BANK.push({ id, d, q: text, right, wrong, n });

/* ---------------- History ---------------- */
q('h-found', 'history', 'When was Kappa Alpha Psi founded?', 'January 5, 1911', ['May 15, 1911', 'April 15, 1915'],
  'Founded January 5th, 1911 on the campus of Indiana University in Bloomington, Indiana.');
q('h-where', 'history', 'Kappa Alpha Psi was founded on the campus of…', 'Indiana University', ['Howard University', 'Indiana State Normal School'],
  'On the campus of Indiana University in Bloomington, Indiana.');
q('h-city', 'history', 'Indiana University, where Kappa was founded, is in…', 'Bloomington, Indiana', ['Indianapolis, Indiana', 'Franklin, Indiana']);
q('h-count', 'history', 'How many Founders?', '10', ['7', '12']);
q('h-colors', 'history', 'The fraternity colors', 'Crimson & Cream', ['Crimson & Gold', 'Black & Cream']);
q('h-alpha-omega', 'history', 'What was the group first called while its formation continued?', 'Alpha Omega', ['Kappa Alpha Nu', 'Alpha Kappa Nu']);
q('h-kan', 'history', 'On January 5, 1911 the fraternity was originally known as…', 'Kappa Alpha Nu', ['Alpha Kappa Nu', 'Kappa Alpha Phi'],
  'Kappa Alpha Nu. The Greek letter Ψ later replaced N.');
q('h-psi', 'history', 'Which Greek letter replaced N (Nu) in the name?', 'Ψ (Psi)', ['Φ (Phi)', 'Σ (Sigma)']);
q('h-resolution', 'history', 'The name change to Kappa Alpha Psi was adopted at the Grand Chapter Meeting in…', 'December 1914', ['April 1914', 'January 1911']);
q('h-effective', 'history', 'The name Kappa Alpha Psi became effective on…', 'April 15, 1915', ['December 1914', 'May 15, 1911'],
  'Resolution adopted December 1914, effective April 15, 1915.');
q('h-incorp', 'history', 'Kappa Alpha Nu became the first incorporated Black fraternity in the U.S. on…', 'May 15, 1911', ['January 5, 1911', 'April 15, 1915'],
  'Chartered by the Indiana Secretary of State on May 15, 1911.');
q('h-oldest', 'history', 'Among existing collegiate historically Black Greek letter fraternities, Kappa is the…', 'Second-oldest', ['Oldest', 'Third-oldest']);
q('h-national-body', 'history', 'Kappa was the first intercollegiate fraternity incorporated as a…', 'National body', ['Regional council', 'Alumni association']);
q('h-concept', 'history', 'Kappa is the only Greek letter organization founded with the concept of…', 'Achievement', ['Brotherhood', 'Service']);
q('h-alpha-chapter', 'history', 'Kappa was the first Greek letter organization to establish its Alpha Chapter on the campus of…', 'Indiana University', ['Howard University', 'UCLA']);
q('h-journal', 'history', 'The Kappa Alpha Nu Journal first appeared in…', 'April 1914', ['December 1914', 'May 1911']);
q('h-journal-gap', 'history', 'The Journal printed uninterrupted except for 1918 and 1919, due to…', 'World War I', ['The name change', 'The Great Depression']);
q('h-invisible', 'history', 'In The Journal, “Chapter Invisible” is…', 'In memoriam to Brothers who have passed', ['The list of new initiates', 'News from undergraduate chapters']);

/* ---------------- Founders ---------------- */
f('f-father', 'Known as “the Father of Kappa”', 'diggs');
f('f-dreamer', 'Called “the Dreamer”', 'diggs', ['lee'], 'Diggs is “the Dreamer.” Lee is commonly referred to as “a dreamer.”');
f('f-a-dreamer', 'Commonly referred to as “a dreamer”; a scholar and tireless worker for the fraternity', 'lee', ['diggs']);
f('f-gp1', '1st Grand Polemarch, 1911–1917', 'diggs');
f('f-chair', 'Permanent chairman (president of Alpha Omega)', 'diggs');
f('f-boomski', 'Nickname “Boomski”', 'armstrong');
f('f-sgt', 'Sergeant-at-arms', 'armstrong');
f('f-secretary', 'Secretary', 'lee', ['irvin', 'edmonds'], 'Lee – secretary. Irvin – interim secretary of Alpha Omega. Edmonds – Corresponding Secretary.');
f('f-interim', 'Interim secretary of Alpha Omega; Incorporation Committee', 'irvin', ['lee', 'edmonds']);
f('f-corresponding', 'Corresponding Secretary in the articles of incorporation', 'edmonds', ['lee', 'irvin']);
f('f-blakie', 'Nickname “Blakie”', 'blakemore');
f('f-dee', 'Nickname “Dee”', 'alexander');
f('f-youngest', 'The youngest Founder, at only 17', 'irvin');
f('f-initiate', 'One of the three freshman first initiates of the Alpha of Kappa Alpha Nu', ['asher', 'blakemore', 'edmonds'], [],
  'The three freshman first initiates: Asher, Blakemore and Edmonds.');
q('f-initiates', 'founders', 'The three freshman first initiates of the Alpha of Kappa Alpha Nu', 'Asher, Blakemore & Edmonds', ['Diggs, Lee & Armstrong', 'Grant, Caine & Irvin']);
// Occupations (the test covers Founders and their occupations)
f('f-dean', 'Professor at universities in five states; served as Dean in Maryland and Oklahoma', 'armstrong');
f('f-lincoln', 'Instructor at Lincoln Institute, Jefferson City, Missouri', 'asher');
f('f-law', 'LL.B., Detroit College of Law, 1928', 'asher');
f('f-electric', 'Organized the Electric Engineering Company', 'blakemore');
f('f-dentist', 'Practiced dentistry in Indianapolis for over 50 years', 'grant');
f('f-chef', 'The consummate entrepreneur and chef before his time; a fine caterer', 'caine', ['irvin']);
f('f-doctor', 'Teacher and principal, then practiced medicine in Indianapolis for nearly 50 years', 'alexander');
f('f-journalist', 'Civic and religious leader, journalist, and entrepreneur', 'irvin', ['caine']);
// Where they were born
f('f-b-diggs', 'Born in Christian County, Kentucky, December 23, 1883', 'diggs');
f('f-b-armstrong', 'Born in Westfield, Indiana', 'armstrong');
f('f-b-lee', 'Born in Danville, Indiana, September 7, 1890', 'lee');
f('f-b-asher', 'Born in Owensboro, Kentucky; son of a Baptist minister', 'asher');
f('f-b-blakemore', 'Born in Franklin, Indiana, January 3, 1889', 'blakemore');
f('f-b-grant', 'Born in New Albany, Indiana, April 9, 1891', 'grant');
f('f-b-caine', 'Born in Greencastle, Indiana; a business major', 'caine');
f('f-b-edmonds', 'Born in Vanderburgh County, Indiana, August 13, 1890', 'edmonds');
f('f-b-alexander', 'Born in Bloomington, Indiana, July 18, 1891', 'alexander');
f('f-b-irvin', 'Born in Spencer, Indiana; seventh of nine children of an AME minister', 'irvin');
// More details
f('f-schools', 'Indiana State Normal School, 1908; Howard University, 1909', 'diggs');
f('f-phd', 'M.A. Columbia 1914; Ph.D. Michigan 1940', 'armstrong');
f('f-cousin', 'Cousin of 2nd Grand Polemarch Irven Armstrong', 'armstrong');
f('f-premed', 'Three years of pre-medical work', 'lee', ['alexander']);
f('f-dds', 'D.D.S., Indiana Dental School, 1920', 'grant');
f('f-md', 'M.D., Indiana University Medical School, 1919', 'alexander', ['lee']);
f('f-army', 'U.S. Army Private, 30th Company, 154th Depot Brigade', 'blakemore', ['alexander']);
f('f-medcorps', 'Army Medical Corps, WWI', 'alexander', ['blakemore']);
f('f-thirteen', 'Third of thirteen children, five of whom became members of the fraternity', 'grant');
f('f-enigma', 'Witty and an enigma to most in the fraternity', 'edmonds');
f('f-writer', 'A quiet, polished, scholarly, and prolific writer', 'diggs');
p('f-which', 'founders', 'Which of these is one of the Ten Founders?', Object.values(FOUNDERS),
  ['Irven Armstrong', 'Leon W. Stewart', 'Earl B. Dickerson', 'W. Ellis Stewart', 'George F. David, II', 'Jimmy McMikle']);

/* ---------------- The Fraternity ---------------- */
q('n-motto', 'national', 'The fraternity motto', 'Achievement in Every Field of Human Endeavor',
  ['Achievement Through Brotherhood and Service', 'Leadership in Every Field of Human Endeavor']);
q('n-purpose', 'national', 'Reliance would be placed upon high Christian ideals and the purpose of…', 'Achievement', ['Service', 'Brotherhood']);
const ORD = ['1st', '2nd', '3rd', '4th', '5th'];
[
  'To unite college men of culture, patriotism and honor in a bond of fraternity.',
  'To encourage honorable achievement in every field of human endeavor.',
  'To promote the spiritual, social, intellectual, and moral welfare of its members.',
  'To aid the aims and purposes of colleges and universities.',
  'To inspire service in the public interest.'
].forEach((o, i) => p('n-obj' + (i + 1), 'national', 'Which objective is this? “' + o + '”', [ORD[i]], ORD.filter((_, j) => j !== i)));
q('n-honor', 'national', 'To unite college men of culture, patriotism and ___ in a bond of fraternity', 'honor', ['service', 'achievement']);
q('n-endeavor', 'national', 'To encourage honorable achievement in every ___', 'field of human endeavor', ['walk of life', 'community we serve']);
q('n-welfare', 'national', 'To promote the spiritual, social, intellectual, and moral ___ of its members', 'welfare', ['character', 'development']);
q('n-colleges', 'national', 'To aid the aims and purposes of ___', 'colleges and universities', ['the Grand Chapter', 'the community']);
q('n-service', 'national', 'To inspire ___ in the public interest', 'service', ['leadership', 'achievement']);
q('n-pledging', 'national', 'The Fraternity has outlawed ___ and any protracted probationary period before initiation', 'pledging',
  ['interviews', 'letters of recommendation']);
q('n-gp', 'national', 'The 35th Grand Polemarch', 'Jimmy McMikle', ['Thomas J. Bradley', 'Robert L. Harris']);
q('n-gp-init', 'national', 'Jimmy McMikle was initiated…', 'Spring 1991, the Alpha chapter', ['Spring 1991, Upsilon chapter', 'Fall 1985, the Alpha chapter']);
q('n-hq-city', 'national', 'International Headquarters city', 'Philadelphia, PA', ['Bloomington, IN', 'Indianapolis, IN']);
q('n-hq-street', 'national', 'International Headquarters street address', '2322-24 North Broad Street', ['1846 Crenshaw Boulevard', '2322-24 South Broad Street']);
q('n-districts', 'national', 'In 1920, who set up three districts?', 'George F. David, II (3rd GP)', ['W. Ellis Stewart (4th GP)', 'Earl B. Dickerson (5th GP)']);
q('n-regions', 'national', 'In 1923, who set up regions with Regional Directors?', 'W. Ellis Stewart (4th GP)', ['George F. David, II (3rd GP)', 'Earl B. Dickerson (5th GP)']);
q('n-prov-who', 'national', 'In 1926, who set up provinces with Province Polemarchs?', 'Earl B. Dickerson (5th GP)', ['George F. David, II (3rd GP)', 'W. Ellis Stewart (4th GP)']);
q('n-prov-count', 'national', 'How many provinces?', '12', ['10', '9']);
const PROV = ['Northern', 'Eastern', 'Southern', 'Western', 'North Central', 'East Central', 'South Central',
  'Southwestern', 'Southeastern', 'Middle Eastern', 'Northeastern', 'Middle Western'];
const NOT_PROV = ['Northwestern', 'West Central', 'Pacific', 'Midwestern', 'Mid-Atlantic', 'Central'];
p('n-prov-in', 'national', 'Which is one of the 12 provinces?', PROV, NOT_PROV);
p('n-prov-out', 'national', 'Which is NOT one of the 12 provinces?', NOT_PROV, PROV);

/* ---------------- Western Province ---------------- */
q('p-est', 'province', 'The Western Province was established in…', '1923', ['1911', '1938'], 'One of the original provinces, established in 1923.');
q('p-first', 'province', 'The first chapter of the current Western Province', 'Upsilon (UCLA)', ['Los Angeles Alumni', 'Alpha (Indiana University)']);
q('p-upsilon', 'province', 'Upsilon chapter at UCLA was chartered on…', 'April 25, 1923', ['August 8, 1938', 'May 15, 1911']);
q('p-chapters', 'province', 'Active chapters in the Western Province', '57', ['35', '80']);
q('p-states', 'province', 'How many U.S. states are in the Western Province?', '9', ['12', '5']);
q('p-intl', 'province', 'The Western Province’s two international chapters are in…', 'Japan and South Korea', ['Germany and Japan', 'Canada and Mexico']);
p('p-state-in', 'province', 'Which state is in the Western Province?',
  ['Alaska', 'Arizona', 'California', 'Hawaii', 'Idaho', 'Nevada', 'Oregon', 'Utah', 'Washington'],
  ['Colorado', 'New Mexico', 'Montana', 'Texas', 'Wyoming']);
q('p-clusters', 'province', 'Western Province clusters: Pacific Northwest, Northern California, Southern California, and…', 'Southwest', ['Mountain West', 'Hawaii']);
q('p-polemarch', 'province', '30th Western Province Polemarch', 'Frederic S. Roots', ['Timothy Lankford', 'Gregory Black']);
q('p-svp', 'province', 'Western Province Senior Vice-Polemarch', 'Timothy Lankford', ['Jullan Shearin-Sewell', 'Frederic S. Roots']);
q('p-jvp', 'province', 'Western Province Junior Vice-Polemarch', 'Jullan Shearin-Sewell', ['Timothy Lankford', 'Steve Bayne']);
q('p-koe', 'province', 'Western Province Keeper of Exchequer (from LA Alumni)', 'Gregory Black', ['Frederick Braggs', 'Darryll Holmes'],
  'Gregory Black is Province Keeper of Exchequer and LA Alumni Polemarch. Frederick Braggs is the chapter’s Keeper of Exchequer.');
q('p-reporter', 'province', 'Western Province Reporter', 'Darryll Holmes', ['Marques Gunn', 'Timothy Lankford'],
  'Darryll Holmes is Province Reporter and LA Alumni MTA Chairman. Marques Gunn is the chapter Reporter.');
q('p-region', 'province', 'First Polemarch of the Western Region (1925–1931)', 'Judge Carl R. Johnson', ['Thomas J. Bradley', 'Earl B. Dickerson']);
q('p-bradley', 'province', 'Grand Polemarch from the Western Province, 1964–1967', 'Thomas J. Bradley', ['Randall C. Bacon', 'Robert L. Harris']);
q('p-bacon', 'province', 'Grand Polemarch from the Western Province, 1985–1988', 'Randall C. Bacon', ['Thomas J. Bradley', 'Robert L. Harris']);
q('p-harris', 'province', 'Grand Polemarch from the Western Province, 1991–1995', 'Robert L. Harris', ['Thomas J. Bradley', 'Randall C. Bacon']);
q('p-18th', 'province', 'Thomas J. Bradley was the ___ Grand Polemarch', '18th', ['30th', '35th']);
q('p-council-80', 'province', 'The 80th Western Province Council (mandatory for new members) is in…', 'Oakland', ['Las Vegas', 'Los Angeles']);
q('p-council-79', 'province', 'The 79th Western Province Council, April 1–5, 2026, was in…', 'Las Vegas', ['Oakland', 'Seattle']);
q('p-council-when', 'province', 'When is the 80th Western Province Council?', 'Second week of April 2027', ['First week of May 2027', 'November 14, 2026']);

/* ---------------- Los Angeles Alumni ---------------- */
q('c-charter', 'chapter', 'Los Angeles Alumni was chartered on…', 'August 8, 1938', ['April 25, 1923', 'February 12, 1969']);
q('c-jewel', 'chapter', 'Los Angeles Alumni is known as…', '“The Jewel of the West”', ['“The Crown of the West”', '“The Pride of the Pacific”']);
q('c-first-alumni', 'chapter', 'Los Angeles Alumni was the very first ___ in the Western Province', 'Alumni chapter', ['Undergraduate chapter', 'Province office']);
q('c-founded-by', 'chapter', 'Who established Los Angeles Alumni?', 'Brothers who attended UCLA and stayed in LA',
  ['Brothers sent by the Grand Chapter', 'Founders of the Alpha chapter']);
q('c-kastle', 'chapter', 'The Kappa Kastle address', '1846 Crenshaw Boulevard', ['2322-24 North Broad Street', '1938 Crenshaw Boulevard']);
q('c-pgp', 'chapter', 'LA Alumni Past Grand Polemarchs', 'Three', ['Five', 'Eleven']);
q('c-ppp', 'chapter', 'LA Alumni Past Western Province Polemarchs', 'Eleven', ['Three', 'Five']);
q('c-laurel', 'chapter', 'LA Alumni Laurel Wreath Laureates', 'Three', ['Five', 'Eleven']);
q('c-ewd', 'chapter', 'LA Alumni Elder Watson Diggs Awardees', 'Five', ['Three', 'Eleven']);
q('c-polemarch', 'chapter', 'LA Alumni Polemarch', 'Gregory Black', ['Steve Bayne', 'Darryll Holmes']);
q('c-vp', 'chapter', 'LA Alumni Vice Polemarch', 'Steve Bayne', ['Gregory Black', 'Eric Fitzpatrick']);
q('c-kor', 'chapter', 'LA Alumni Keeper of Records', 'Keith Lewis, Jr.', ['Christopher Henderson', 'Frederick Braggs']);
q('c-koe', 'chapter', 'LA Alumni Keeper of Exchequer', 'Frederick Braggs', ['Gregory Black', 'Keith Lewis, Jr.'],
  'Frederick Braggs is the chapter’s Keeper of Exchequer. Gregory Black is the Province’s.');
q('c-akor', 'chapter', 'LA Alumni Assistant Keeper of Records', 'Christopher Henderson', ['Keith Lewis, Jr.', 'Terrance Lark']);
q('c-strategus', 'chapter', 'LA Alumni Strategus', 'Eric Fitzpatrick', ['Robert Joiner', 'Marques Gunn']);
q('c-lt', 'chapter', 'LA Alumni Lt. Strategus', 'Robert Joiner', ['Eric Fitzpatrick', 'Derek S. Hamilton, Sr.']);
q('c-reporter', 'chapter', 'LA Alumni Reporter', 'Marques Gunn', ['Terrance Lark', 'Darryll Holmes'],
  'Marques Gunn is the chapter Reporter. Darryll Holmes is the Province Reporter.');
q('c-historian', 'chapter', 'LA Alumni Historian', 'Terrance Lark', ['Marques Gunn', 'Christopher Henderson']);
q('c-house', 'chapter', 'LA Alumni House Director', 'Derek S. Hamilton, Sr.', ['Robert Joiner', 'Steve Bayne']);
q('c-mta-chair', 'chapter', 'LA Alumni MTA Chairman', 'Darryll Holmes', ['Marcellus Mayberry', 'Gregory Black']);
q('c-mta-co', 'chapter', 'LA Alumni MTA Co-Chairman', 'Marcellus Mayberry', ['Darryll Holmes', 'Steve Bayne']);
q('c-kl', 'chapter', 'Kappa League was founded by which chapter?', 'Los Angeles Alumni', ['Upsilon (UCLA)', 'The Alpha chapter']);
q('c-bwb-birth', 'chapter', 'Los Angeles Alumni is the birthplace of which annual event?', 'The Black & White Ball', ['The Province Council', 'The Grand Chapter Meeting']);
q('c-bwb-date', 'chapter', 'The 87th Annual Black & White Ball', 'Saturday, November 14, 2026', ['Saturday, November 7, 2026', 'Saturday, December 12, 2026']);
q('c-bwb-venue', 'chapter', 'Where is the 87th Black & White Ball?', 'The Ritz-Carlton, Marina del Rey', ['The Kappa Kastle', 'The Beverly Hilton']);
q('c-bwb-host', 'chapter', 'The Black & White Ball is hosted by Los Angeles Alumni and…', 'The Upsilon chapter', ['The Alpha chapter', 'The Western Province']);
q('c-bwb-supports', 'chapter', 'The Black & White Ball supports…', 'The scholarship program', ['Kappa Kamp', 'The Kappa Kastle']);

/* ---------------- Programs ---------------- */
q('g-gr', 'programs', 'Our National Service Initiative, which includes all our youth programs', 'Guide Right', ['Kappa League', 'Diamonds in the Rough']);
q('g-gr-year', 'programs', 'Guide Right was conceived in…', '1922', ['1911', '1969']);
q('g-gr-who', 'programs', 'Guide Right was conceived by…', 'Leon W. Stewart', ['Mel L. Davis', 'Earl B. Dickerson']);
q('g-gr-gc', 'programs', 'Guide Right was suggested at the ___ Grand Chapter', 'Twelfth', ['56th', 'First']);
q('g-gr-what', 'programs', 'Guide Right is a program of…', 'Educational and occupational guidance of youth',
  ['Scholarships for undergraduates', 'Training for alumni chapters']);
q('g-gr-oldest', 'programs', 'The oldest, most successful mentoring program for young people of color', 'Guide Right', ['Kappa League', 'Kappa Kamp']);
q('g-kl-date', 'programs', 'Kappa League was founded on…', 'February 12, 1969', ['August 8, 1938', 'April 25, 1923']);
q('g-kl-school', 'programs', 'Kappa League was founded at…', 'Alain LeRoy Locke High School', ['Crenshaw High School', 'Dorsey High School']);
q('g-kl-founders', 'programs', 'Founders of the Kappa Instructional Leadership League', 'Mel L. Davis & Edgar H. Bishop',
  ['Leon W. Stewart & Mel L. Davis', 'Gregory Black & Steve Bayne']);
q('g-kl-name', 'programs', 'Kappa League is short for the Kappa ___ Leadership League', 'Instructional', ['International', 'Intercollegiate']);
q('g-kl-adopted', 'programs', 'Kappa League was adopted nationally at the ___ Grand Chapter', '56th', ['Twelfth', '80th']);
q('g-kl-charlotte', 'programs', 'The 56th Grand Chapter (August 12–15, 1970) was held in…', 'Charlotte, NC', ['Philadelphia, PA', 'Los Angeles, CA']);
q('g-kl-grades', 'programs', 'Kappa League serves male students in grades…', '6th–12th', ['9th–12th', '3rd–8th']);
q('g-kl-subset', 'programs', 'Kappa League is a subset of…', 'Guide Right', ['The Kappa Alpha Psi Foundation', 'The MTA']);
p('g-kl-area', 'programs', 'Which is one of Kappa League’s five study areas?',
  ['Self-Identity', 'Training', 'Competition', 'Social', 'Health Education'], ['Finance', 'Technology', 'Citizenship', 'Leadership']);
q('g-kl-competition', 'programs', 'Kappa League study area: politics and sports', 'Competition', ['Social', 'Training']);
q('g-kl-self', 'programs', 'Kappa League study area: discipline, assurance, awareness and Fraternity', 'Self-Identity', ['Training', 'Social']);
q('g-kl-training', 'programs', 'Kappa League study area: academic, career choice, preparation and organization', 'Training', ['Self-Identity', 'Competition']);
q('g-kl-social', 'programs', 'Kappa League study area: religion, the arts, entertainment, conversation and etiquette', 'Social', ['Health Education', 'Self-Identity']);
q('g-kl-health', 'programs', 'Kappa League study area: physical fitness, health and safety', 'Health Education', ['Competition', 'Training']);
q('g-found-year', 'programs', 'The Kappa Alpha Psi Foundation was established in…', '1981', ['1969', '1922']);
q('g-found-501', 'programs', 'The Foundation is a non-profit, tax-exempt organization under Section…', '501(c)(3)', ['501(c)(7)', '527']);

/* ---------------- Spring 2027 MTA ---------------- */
q('m-voluntary', 'mta', 'MTA principle: Everything is…', 'Voluntary', ['Mandatory', 'Confidential'], 'Everything is voluntary. The decision is always yours.');
q('m-earned', 'mta', 'MTA principle: Membership is ___, not given', 'Earned', ['Offered', 'Inherited']);
q('m-met', 'mta', 'MTA principle: Brothers will not vouch or vote for someone they have…', 'Never met', ['Not interviewed', 'Not sponsored']);
q('m-degree', 'mta', 'Degree requirement', 'Accredited bachelor’s (four-year) degree', ['Associate’s degree or higher', 'Any college coursework']);
q('m-transcripts', 'mta', 'Official transcripts required', 'Two sealed + one digital', ['One sealed + one digital', 'Three sealed']);
q('m-photo', 'mta', 'Photo requirement', '2x2 passport photo in shirt, tie, and jacket', ['Headshot in business casual', '4x6 photo in a suit']);
q('m-letters', 'mta', 'How many letters of recommendation?', 'Five', ['Three', 'Four']);
q('m-members', 'mta', 'Letters from current financial members', 'Three', ['Two', 'Five']);
q('m-sponsors', 'mta', 'Signed letters from community sponsors', 'Two', ['Three', 'One']);
q('m-letterhead', 'mta', 'Community sponsor letters must be on…', 'Official letterhead or corporate stationery', ['Plain paper', 'Fraternity letterhead']);
q('m-financial', 'mta', 'Member recommenders must be financial on…', 'All three levels', ['The local chapter only', 'Grand Chapter only']);
q('m-number', 'mta', 'Member recommenders need a verifiable…', 'Kappa Alpha Psi membership number', ['Chapter officer title', 'Life membership']);
q('m-levels', 'mta', 'The three levels', 'Grand Chapter, Province, and Chapter', ['Grand Chapter, Region, and District', 'National, State, and City']);
q('m-year', 'mta', 'The fraternal year begins…', 'October 1', ['January 5', 'August 8']);
q('m-voter', 'mta', 'Also required: ___ verification', 'Voter registration', ['Employment', 'Credit']);
q('m-questions', 'mta', 'The MTA test has…', '100 questions', ['50 questions', '75 questions']);
q('m-pass', 'mta', 'Passing score on the test', '70%', ['80%', '75%']);
q('m-covers', 'mta', 'The test covers the Founders and their occupations, the Greek alphabet, and…', 'The organization’s history', ['Chapter bylaws', 'Parliamentary procedure']);
q('m-due', 'mta', 'Application documents are due…', 'Within two weeks of the info meeting', ['Within one week of the info meeting', 'By the start of the fraternal year']);
q('m-sessions', 'mta', 'Missing more than ___ sessions, or being late, means dismissal from the process', 'Two', ['Three', 'Four']);
q('m-cost', 'mta', 'Approximate cost of initial membership (Oct 14 touch base)', 'About $5,200, covering two years', ['About $5,200, covering one year', 'About $2,600, covering one year']);
q('m-includes', 'mta', 'The ~$5,200 includes…', 'Blazer, official pin, and all three levels', ['Local chapter dues only', 'Grand Chapter dues only']);
q('m-council', 'mta', 'Mandatory for new members in April 2027', 'Western Province Council, Oakland', ['Western Province Council, Las Vegas', 'Grand Chapter, Philadelphia']);
q('m-conclave', 'mta', 'The 88th Grand Chapter Meeting (Conclave), 2027, is in…', 'Baltimore', ['Philadelphia', 'Charlotte']);

/* ---------------- Greek ---------------- */
q('k-kap', 'greek', 'Kappa Alpha Psi in Greek letters', 'ΚΑΨ', ['ΚΑΦ', 'ΚΑΝ']);
q('k-kan', 'greek', 'Kappa Alpha Nu in Greek letters', 'ΚΑΝ', ['ΚΑΨ', 'ΚΑΜ']);
q('k-count', 'greek', 'How many letters in the Greek alphabet?', '24', ['26', '22']);

// Alphabet questions are generated. Pass an id like "gk-after-9" to rebuild a specific one.
const G_TYPES = ['pos', 'after', 'before', 'sym', 'name'];
export function greekQuestion(id) {
  let type, i;
  if (id) {
    const m = /^gk-(\w+)-(\d+)$/.exec(id);
    if (!m || !G_TYPES.includes(m[1]) || +m[2] > 23) return null;
    type = m[1]; i = +m[2];
  } else {
    type = G_TYPES[Math.floor(Math.random() * G_TYPES.length)];
    i = Math.floor(Math.random() * 24);
    if (type === 'after' && i === 23) i = 22;
    if (type === 'before' && i === 0) i = 1;
  }
  let text, ans, label = (k) => GREEK[k][2];
  if (type === 'pos') { text = 'Letter #' + (i + 1) + ' of the Greek alphabet'; ans = i; }
  else if (type === 'after') { text = 'Which letter comes right after ' + GREEK[i][2] + '?'; ans = i + 1; }
  else if (type === 'before') { text = 'Which letter comes right before ' + GREEK[i][2] + '?'; ans = i - 1; }
  else if (type === 'sym') { text = 'Which letter is ' + GREEK[i][0] + ' ' + GREEK[i][1] + '?'; ans = i; }
  else { text = 'Which is ' + GREEK[i][2] + '?'; ans = i; label = (k) => GREEK[k][0] + ' ' + GREEK[k][1]; }
  // Wrong answers: letters close to the right one, never the letter named in the question.
  const near = [];
  for (let d = 1; d < 24 && near.length < 4; d++) {
    for (const k of [ans + d, ans - d]) if (k >= 0 && k < 24 && k !== i && k !== ans && near.length < 4) near.push(k);
  }
  for (let a = near.length - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [near[a], near[b]] = [near[b], near[a]]; }
  return { id: 'gk-' + type + '-' + i, d: 'greek', q: text, a: label(ans), w: [label(near[0]), label(near[1])] };
}
