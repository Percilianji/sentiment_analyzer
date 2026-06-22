import re


DEFAULT_TOPIC_KEYWORDS = {
    "teaching quality": [
        "academic", "academics", "class", "classes", "course", "courses",
        "education", "educating", "faculty", "graduate", "graduates",
        "engineering", "entrepreneurial", "growth mindset", "growth-mindset",
        "it school", "it schools", "knowledge", "learn", "learners", "learning",
        "lecture", "lecturer", "lecturers", "professional", "professionals", "program", "programme",
        "school", "students", "study", "training",
    ],
    "campus life": [
        "area", "association", "attractive", "celebration", "ceremony",
        "commencement", "community", "convocation", "culture", "cultural",
        "experience", "fun", "spirited", "event", "graduation",
        "matriculation", "parade", "place", "religious", "seminar",
        "student life", "unity walk",
    ],
    "facilities": [
        "auditorium", "building", "buildings", "campus", "clean", "environment",
        "greenhouse", "infrastructure", "laboratory", "lab", "labs", "parking",
        "road", "roads", "secured", "spacious", "tarred", "wifi",
    ],
    "fees": [
        "charge", "charges", "deduction", "deductions", "fee", "fees",
        "money", "payment", "platform charge", "tuition",
    ],
    "administration": [
        "administration", "authorities", "budget", "chancellor", "committee",
        "communication", "dean", "deans", "management", "meeting", "policy",
        "bishop", "criticised", "criticized", "president", "pro-chancellor", "registration", "representative",
        "sanction", "sanctions", "staff representative", "vice-chancellor",
    ],
    "admissions": [
        "admission", "admissions", "apply", "application", "enroll",
        "enrolment", "enrollment", "sign up",
    ],
    "events and announcements": [
        "announcement", "appointment", "award", "conference", "decree",
        "election", "inauguration", "launch", "memorandum", "partnership", "signed",
        "workshop",
    ],
    "safety": [
        "arrest", "arrested", "attack", "attacked", "brutalized", "crisis",
        "knife", "sanctions", "threatening", "violence",
    ],
}


class TopicClassifier:

    @staticmethod
    def keyword_in_text(keyword, text):
        if " " in keyword:
            return keyword in text

        return re.search(rf"\b{re.escape(keyword)}\b", text) is not None

    @staticmethod
    def classify(text, topics):

        if not text:
            return None

        text = text.lower()

        scores = {}

        for topic in topics:

            keywords = topic.keywords or ""

            topic_name = topic.name.strip().lower()
            keyword_list = [
                k.strip().lower()
                for k in keywords.split(",")
                if k.strip()
            ]
            keyword_list.extend(DEFAULT_TOPIC_KEYWORDS.get(topic_name, []))

            score = 0

            for kw in keyword_list:

                if TopicClassifier.keyword_in_text(kw, text):
                    score += 1

            scores[topic.name] = score

        if not scores:
            return None

        best_topic = max(scores, key=scores.get)

        if scores[best_topic] == 0:
            return "Unknown"

        return best_topic
