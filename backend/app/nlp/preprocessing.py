import re
import string
from nltk.corpus import stopwords

STOPWORDS = set(stopwords.words("english"))

JUNK_PATTERNS = [
    "cookie",
    "privacy policy",
    "terms of service",
    "subscribe",
    "login",
    "sign up",
    "all rights reserved",
    "home",
    "request unsuccessful",
    "incapsula incident id",
    "incapsula",
    "%pdf",
    "endobj",
    "startxref",
    "xref",
]

BOILERPLATE_PATTERNS = [
    r"\brequest unsuccessful\b",
    r"\bincapsula incident id\b",
    r"\bviews?\b",
    r"\bread reply\b",
    r"\breply\b",
]

OPINION_WORDS = [
    "good",
    "bad",
    "great",
    "poor",
    "love",
    "hate",
    "excellent",
    "terrible",
    "frustrating",
    "satisfied",
    "disappointed",
    "amazing",
    "awful",
    "best",
    "worst",
    "helpful",
    "friendly",
    "clean",
    "expensive",
    "stressful",
    "beautiful",
    "serene",
    "effective",
    "arrest",
    "arrested",
    "attack",
    "attacked",
    "brutalized",
    "detained",
    "killed",
    "grief",
    "uncertainty",
    "malpractice",
    "forgery",
    "freed",
    "released",
    "criticised",
    "criticized",
    "threatening",
    "hustle",
    "grind",
    "harden",
]

OPINION_PHRASES = [
    "i think",
    "i feel",
    "in my opinion",
    "students complain",
    "students complained",
    "students praise",
    "students praised",
    "my experience",
    "good experience",
    "bad experience",
    "i love",
    "i hate",
    "not happy",
    "very happy",
    "students were brutalized",
    "students complain",
    "students detained",
    "student attacked",
    "student killed",
]

PIDGIN_MAP = {
    "abeg": "please",
    "abi": "right",
    "ahala": "problem",
    "all man": "everyone",
    "am": "it",
    "ashia": "sorry",
    "bad belle": "jealousy",
    "bad": "poor",
    "book work": "academic work",
    "campus wahala": "campus problem",
    "chop": "eat",
    "commot": "leave",
    "dey okay": "is good",
    "dey": "is",
    "di": "the",
    "don": "has",
    "e no good": "it is poor",
    "e": "it",
    "fit": "can",
    "fine": "good",
    "gist": "information",
    "go slow": "traffic delay",
    "go": "will",
    "hostel dem": "hostels",
    "how far": "what is the situation",
    "i no sabi": "i do not know",
    "lecturer dem": "lecturers",
    "make dem": "they should",
    "make una": "you should",
    "make": "let",
    "na so": "that is how it is",
    "na": "is",
    "no get": "does not have",
    "no dey": "not available",
    "no fit": "cannot",
    "no sabi": "does not know",
    "oya": "please proceed",
    "palava": "problem",
    "plenty": "many",
    "sabi": "know",
    "school fees too much": "tuition fees are expensive",
    "school fees": "tuition fees",
    "see me see trouble": "serious problem",
    "small small": "gradually",
    "suffer": "struggle",
    "thing": "issue",
    "tori": "news",
    "too much": "expensive",
    "una": "you",
    "wahala": "problem",
    "waka": "walk",
    "wetin": "what",
    "yawa": "problem",
}

RELEVANCE_KEYWORDS = [
    "student",
    "students",
    "professor",
    "professors",
    "lecturer",
    "lecturers",
    "lecture",
    "lectures",
    "tuition",
    "fee",
    "fees",
    "hostel",
    "hostels",
    "wifi",
    "library",
    "campus",
    "food",
    "course",
    "courses",
    "class",
    "classes",
    "accommodation",
    "laboratory",
    "laboratories",
]

SIGNAL_WORDS = sorted(set(OPINION_WORDS + RELEVANCE_KEYWORDS + [
    "academic",
    "academics",
    "achievement",
    "admission",
    "admissions",
    "administration",
    "appointment",
    "award",
    "awards",
    "career",
    "certificate",
    "certification",
    "ceremony",
    "community",
    "conference",
    "convocation",
    "department",
    "education",
    "employment",
    "entrepreneurship",
    "event",
    "examination",
    "examinations",
    "faculty",
    "graduate",
    "graduates",
    "graduation",
    "innovation",
    "internship",
    "learning",
    "matriculation",
    "partnership",
    "program",
    "programme",
    "research",
    "scholarship",
    "seminar",
    "staff",
    "training",
    "university",
    "workshop",
]))

SIGNAL_PHRASES = sorted(set(OPINION_PHRASES + [
    "academic year",
    "campus life",
    "career development",
    "course registration",
    "higher education",
    "learning environment",
    "student experience",
    "student life",
    "tuition fees",
]))


class TextPreprocessor:

    @staticmethod
    def normalize_text(text: str):
        return text.encode("ascii", "ignore").decode("ascii")

    @staticmethod
    def normalize_pidgin(text: str):

        text = text.lower()

        for pidgin, english in sorted(PIDGIN_MAP.items(), key=lambda item: len(item[0]), reverse=True):
            text = re.sub(rf"\b{re.escape(pidgin)}\b", english, text)

        return text

    @staticmethod
    def clean_text(text: str, require_relevance=True, require_opinion=False, require_signal=False):

        if not text:
            return None

        original_text = TextPreprocessor.normalize_text(text).lower()

        if require_opinion and not TextPreprocessor.contains_opinion(original_text):
            return None

        if require_signal and not TextPreprocessor.contains_signal(original_text):
            return None

        # 1. lowercase
        text = original_text

        # 2. remove HTML tags
        text = re.sub(r"<.*?>", " ", text)

        # 3. remove URLs
        text = re.sub(r"http\S+|www\S+", " ", text)

        # 4. remove common scraped page/social metadata
        for pattern in BOILERPLATE_PATTERNS:
            text = re.sub(pattern, " ", text)

        # 5. normalize common Cameroonian pidgin words/phrases
        text = TextPreprocessor.normalize_pidgin(text)

        # 6. remove punctuation
        text = text.translate(str.maketrans("", "", string.punctuation))

        # 7. remove numbers
        text = re.sub(r"\d+", " ", text)

        # 8. tokenize
        words = text.split()

        # 9. remove stopwords
        words = [w for w in words if w not in STOPWORDS]

        cleaned = " ".join(words)

        if len(words) < 3:
            return None

        if TextPreprocessor.has_junk_pattern(cleaned):
            return None

        if TextPreprocessor.looks_like_raw_pdf(cleaned):
            return None

        if require_opinion and not TextPreprocessor.contains_opinion(cleaned):
            return None

        if require_signal and not TextPreprocessor.contains_signal(cleaned):
            return None

        if require_relevance and not TextPreprocessor.is_relevant(cleaned):
            return None

        return cleaned

    # -------------------------
    # JUNK DETECTOR
    # -------------------------
    @staticmethod
    def is_junk(text: str, min_chars=50, min_words=5):

        if not text:
            return True

        text_lower = TextPreprocessor.normalize_text(text).lower()

        if TextPreprocessor.looks_like_raw_pdf(text_lower):
            return True

        # 1. too short
        if len(text_lower) < min_chars:
            return True

        if len(text_lower.split()) < min_words:
            return True

        # 2. pattern check
        if TextPreprocessor.has_junk_pattern(text_lower):
            return True

        # 3. noise ratio check
        if TextPreprocessor.noise_ratio(text_lower) > 0.4:
            return True

        return False

    @staticmethod
    def looks_like_raw_pdf(text: str):

        pdf_markers = ["%pdf", " obj", "endobj", "stream", "xref", "startxref"]
        marker_count = sum(1 for marker in pdf_markers if marker in text)

        return marker_count >= 2

    @staticmethod
    def has_junk_pattern(text: str):

        text_lower = TextPreprocessor.normalize_text(text).lower()

        for pattern in JUNK_PATTERNS:
            if pattern in text_lower:
                return True

        return False

    @staticmethod
    def is_relevant(text: str):

        if not text:
            return False

        text_lower = TextPreprocessor.normalize_text(text).lower()

        for keyword in RELEVANCE_KEYWORDS:
            if re.search(rf"\b{re.escape(keyword)}\b", text_lower):
                return True

        return False

    @staticmethod
    def contains_opinion(text: str):

        if not text:
            return False

        text_lower = TextPreprocessor.normalize_text(text).lower()

        for phrase in OPINION_PHRASES:
            if phrase in text_lower:
                return True

        for word in OPINION_WORDS:
            if re.search(rf"\b{re.escape(word)}\b", text_lower):
                return True

        return False

    @staticmethod
    def contains_signal(text: str):

        if not text:
            return False

        text_lower = TextPreprocessor.normalize_text(text).lower()

        for phrase in SIGNAL_PHRASES:
            if phrase in text_lower:
                return True

        for word in SIGNAL_WORDS:
            if re.search(rf"\b{re.escape(word)}\b", text_lower):
                return True

        return False

    # -------------------------
    # NOISE RATIO (FIXED)
    # -------------------------
    @staticmethod
    def noise_ratio(text: str):

        words = text.split()

        if len(words) == 0:
            return 1

        noise_words = [w for w in words if len(w) < 2]

        return len(noise_words) / len(words)
