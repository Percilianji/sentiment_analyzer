class TopicClassifier:

    @staticmethod
    def classify(text, topics):

        if not text:
            return None

        text = text.lower()

        scores = {}

        for topic in topics:

            keywords = topic.keywords or ""

            keyword_list = [
                k.strip().lower()
                for k in keywords.split(",")
                if k.strip()
            ]

            score = 0

            for kw in keyword_list:

                if kw in text:
                    score += 1

            scores[topic.name] = score

        if not scores:
            return None

        best_topic = max(scores, key=scores.get)

        if scores[best_topic] == 0:
            return "Unknown"

        return best_topic
