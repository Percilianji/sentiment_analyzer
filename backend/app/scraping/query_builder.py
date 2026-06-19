class QueryBuilder:

    @staticmethod
    def build(university):
        """
        Generates multiple search queries for a university
        to capture different types of sentiment signals:
        - official info
        - student opinions
        - reviews
        - news
        """

        base = university.name.strip()
        keywords = university.keywords or ""

        # split keywords safely
        keyword_list = [
            k.strip()
            for k in keywords.split(",")
            if k.strip()
        ]

        # join keywords into readable phrase
        keyword_phrase = " ".join(keyword_list)

        queries = []

        # 1. Basic identity query (official + general info)
        queries.append(base)

        # 2. Keyword-enhanced query (context expansion)
        if keyword_phrase:
            queries.append(f"{base} {keyword_phrase}")

        # 3. Student life / campus discussions
        queries.append(f"{base} students campus life opinions")

        # 4. Reviews and ranking sentiment sources
        queries.append(f"{base} reviews ranking experience")

        # 5. Complaints / negative sentiment targeting (VERY IMPORTANT for sentiment analysis)
        queries.append(f"{base} problems complaints issues")

        # 6. News coverage (optional but useful)
        queries.append(f"{base} news latest updates")

        # remove duplicates just in case
        queries = list(dict.fromkeys(queries))

        return queries