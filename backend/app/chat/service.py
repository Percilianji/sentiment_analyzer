from collections import Counter

from app.dashboard.routes import overview


DEFAULT_SUGGESTIONS = [
    "Summarize the dashboard",
    "Which university needs attention?",
    "Show recent negative posts",
    "What are the top weak topics?",
]


def _dashboard_payload():
    response = overview()
    return response.get_json()


def _sentence_list(items):
    if not items:
        return "No matching items are available yet."

    return "\n".join(f"- {item}" for item in items)


def _sort_universities(universities, field, reverse=True):
    return sorted(universities, key=lambda item: item.get(field) or 0, reverse=reverse)


def _format_university(university):
    return (
        f"{university.get('name')} has a sentiment index of "
        f"{round(university.get('sentiment_index') or 0)}, with "
        f"{university.get('positive_percent') or 0}% positive, "
        f"{university.get('negative_percent') or 0}% negative, and "
        f"{university.get('neutral_percent') or 0}% neutral sentiment."
    )


def _urgency_label(negative_percent, event_count):
    if negative_percent >= 30 or event_count >= 10:
        return "High"

    if negative_percent >= 15 or event_count >= 3:
        return "Medium"

    return "Low"


def _recommended_action(topic_name, urgency):
    normalized_topic = _normalize_text(topic_name)

    if any(word in normalized_topic for word in ("fee", "tuition", "payment", "cost")):
        action = "review fee communication, payment timelines, and student support channels"
    elif any(word in normalized_topic for word in ("teaching", "academic", "course", "lecturer", "quality")):
        action = "ask the academic quality team to review the affected courses, lecturer feedback, and response time"
    elif any(word in normalized_topic for word in ("registration", "admission", "portal", "system")):
        action = "check the registration workflow, portal reliability, and student communication around deadlines"
    elif any(word in normalized_topic for word in ("accommodation", "hostel", "housing")):
        action = "escalate the issue to student affairs and inspect the accommodation complaints in detail"
    elif any(word in normalized_topic for word in ("event", "security", "strike", "crisis")):
        action = "treat this as an operational alert and verify the event with official campus channels"
    else:
        action = "assign the responsible unit to review recent posts and prepare a response plan"

    if urgency == "High":
        return f"Escalate within 24 hours: {action}."

    if urgency == "Medium":
        return f"Review this week: {action}."

    return f"Monitor for now: {action}."


def _normalize_text(value):
    return " ".join((value or "").strip().lower().split())


def _find_university(data, message):
    universities = data.get("universities", [])
    normalized_message = _normalize_text(message)

    exact_matches = [
        university
        for university in universities
        if _normalize_text(university.get("name")) in normalized_message
    ]

    if exact_matches:
        return sorted(exact_matches, key=lambda university: len(university.get("name") or ""), reverse=True)[0]

    for university in universities:
        significant_words = [
            word
            for word in _normalize_text(university.get("name")).split()
            if len(word) > 3 and word not in {"university", "institute", "catholic"}
        ]

        if significant_words and all(word in normalized_message for word in significant_words[:2]):
            return university

    return None


def _university_report(data, university):
    topics = university.get("topics") or []
    recent_items = [
        item
        for item in data.get("recent_items", [])
        if str(item.get("university_id")) == str(university.get("id"))
    ]
    negative_items = [item for item in recent_items if item.get("label") == "negative"]
    event_items = [item for item in recent_items if item.get("is_event")]
    weak_topics = sorted(
        [topic for topic in topics if topic.get("items")],
        key=lambda topic: (topic.get("negative_percent") or 0, topic.get("items") or 0),
        reverse=True,
    )
    strong_topics = sorted(
        [topic for topic in topics if topic.get("items")],
        key=lambda topic: (topic.get("positive_percent") or 0, topic.get("items") or 0),
        reverse=True,
    )
    main_weak_topic = weak_topics[0] if weak_topics else None
    negative_percent = university.get("negative_percent") or 0
    urgency = _urgency_label(negative_percent, len(event_items))
    main_topic_name = main_weak_topic.get("topic") if main_weak_topic else "student experience"

    report = [
        f"Report for {university.get('name')}",
        "",
        "Decision summary:",
        f"- Urgency: {urgency}",
        f"- Main issue: {main_topic_name}",
        f"- Recommended action: {_recommended_action(main_topic_name, urgency)}",
        "",
        "Evidence:",
        _format_university(university),
        f"It has {university.get('items') or 0} analysed items in the current dashboard data.",
    ]

    if main_weak_topic:
        report.append(
            f"Negative sentiment is mostly linked to {main_weak_topic.get('topic')}, with {main_weak_topic.get('negative_percent') or 0}% negative sentiment across {main_weak_topic.get('items') or 0} items."
        )

    if strong_topics:
        report.append(
            f"The strongest topic is {strong_topics[0].get('topic')}, with {strong_topics[0].get('positive_percent') or 0}% positive sentiment."
        )

    report.append(f"There are {len(event_items)} recent flagged events and {len(negative_items)} recent negative items.")

    if negative_items:
        report.append("")
        report.append("Recent complaints behind the flag:")
        report.extend(
            f"- {item.get('topic')}: {item.get('summary') or item.get('content') or 'No summary available'}"
            for item in negative_items[:3]
        )
    else:
        report.append("")
        report.append("Recent complaints behind the flag:")
        report.append("- No recent negative post is available in the current dashboard sample.")

    if event_items:
        report.append("")
        report.append("Why events were flagged:")
        report.extend(
            f"- {item.get('topic')}: {item.get('event_reason') or 'The item was marked as event-related by the classifier.'}"
            for item in event_items[:3]
        )

    report.append("")
    report.append("How admins should use this:")
    report.append("- Check the recent posts before making a public decision.")
    report.append("- Contact the unit responsible for the main issue.")
    report.append("- Track whether the negative percentage drops after the response.")

    return "\n".join(report)


def _summarize_dashboard(data):
    totals = data.get("totals", {})
    universities = data.get("universities", [])
    recent_items = data.get("recent_items", [])
    weak_topics = sorted(
        [topic for topic in data.get("weak_topics", []) if topic.get("items")],
        key=lambda topic: (topic.get("negative_percent") or 0, topic.get("items") or 0),
        reverse=True,
    )

    if not universities:
        return "There is no dashboard data available yet. Add universities and run the NLP pipeline first."

    strongest = _sort_universities(universities, "sentiment_index")[0]
    weakest = _sort_universities(universities, "sentiment_index", reverse=False)[0]
    most_negative = _sort_universities(universities, "negative_percent")[0]
    event_count = sum(1 for item in recent_items if item.get("is_event"))
    weak_topic = weak_topics[0] if weak_topics else None
    urgency = _urgency_label(most_negative.get("negative_percent") or 0, event_count)

    answer = [
        f"The dashboard currently tracks {totals.get('active_universities', len(universities))} active universities and {totals.get('posts', 0)} collected posts.",
        f"Decision priority: {most_negative.get('name')} needs attention first because it has the highest negative share at {most_negative.get('negative_percent') or 0}%.",
        f"Urgency: {urgency}.",
        f"Context: the strongest university is {strongest.get('name')} with a sentiment index of {round(strongest.get('sentiment_index') or 0)}, while the weakest overall sentiment is {weakest.get('name')} at {round(weakest.get('sentiment_index') or 0)}.",
        f"There are {event_count} recent items flagged as events, so admins should verify whether any require immediate response.",
    ]

    if weak_topic:
        answer.append(
            f"The clearest problem area is {weak_topic.get('topic')} at {weak_topic.get('university')}, with {weak_topic.get('negative_percent') or 0}% negative sentiment. Recommended action: {_recommended_action(weak_topic.get('topic'), urgency)}"
        )

    return " ".join(answer)


def _compare_universities(data):
    universities = data.get("universities", [])

    if len(universities) < 2:
        return "I need at least two universities with sentiment data before I can compare them."

    ranked = _sort_universities(universities, "sentiment_index")
    strongest = ranked[0]
    weakest = ranked[-1]
    gap = round((strongest.get("sentiment_index") or 0) - (weakest.get("sentiment_index") or 0))

    return (
        f"{strongest.get('name')} is currently leading with a sentiment index of {round(strongest.get('sentiment_index') or 0)}, "
        f"while {weakest.get('name')} is lowest at {round(weakest.get('sentiment_index') or 0)}. "
        f"The gap between them is {gap} points. {weakest.get('name')} also has "
        f"{weakest.get('negative_percent') or 0}% negative sentiment, so it is worth checking its weak topics and recent posts."
    )


def _negative_university(data):
    universities = data.get("universities", [])

    if not universities:
        return "There are no universities with sentiment data yet."

    university = _sort_universities(universities, "negative_percent")[0]
    urgency = _urgency_label(university.get("negative_percent") or 0, 0)
    topics = sorted(
        [topic for topic in university.get("topics", []) if topic.get("items")],
        key=lambda topic: (topic.get("negative_percent") or 0, topic.get("items") or 0),
        reverse=True,
    )
    main_topic = topics[0].get("topic") if topics else "student experience"

    return (
        f"{university.get('name')} needs the most attention right now. {_format_university(university)} "
        f"Main issue: {main_topic}. Urgency: {urgency}. "
        f"Recommended action: {_recommended_action(main_topic, urgency)}"
    )


def _positive_university(data):
    universities = data.get("universities", [])

    if not universities:
        return "There are no universities with sentiment data yet."

    university = _sort_universities(universities, "positive_percent")[0]
    return f"{university.get('name')} has the strongest positive share. {_format_university(university)}"


def _weak_topics(data):
    weak_topics = sorted(
        [topic for topic in data.get("weak_topics", []) if topic.get("items")],
        key=lambda topic: (topic.get("negative_percent") or 0, topic.get("items") or 0),
        reverse=True,
    )

    if not weak_topics:
        return "I do not see weak topic data yet. Run topic classification and sentiment analysis first."

    items = [
        f"{topic.get('topic')} at {topic.get('university')}: {topic.get('negative_percent') or 0}% negative across {topic.get('items') or 0} items"
        for topic in weak_topics[:5]
    ]

    return "The weakest topics right now are:\n" + _sentence_list(items)


def _top_topics(data):
    top_topics = data.get("top_topics", [])

    if not top_topics:
        return "I do not see top topic data yet."

    items = [
        f"{topic.get('topic')} at {topic.get('university')}: {topic.get('positive_percent') or 0}% positive across {topic.get('items') or 0} items"
        for topic in top_topics[:5]
    ]

    return "The strongest topics right now are:\n" + _sentence_list(items)


def _recent_negative_posts(data):
    recent_items = data.get("recent_items", [])
    negative_items = [item for item in recent_items if item.get("label") == "negative"]

    if not negative_items:
        return "I do not see recent negative posts in the current dashboard data."

    items = [
        f"{item.get('university')} / {item.get('topic')}: {item.get('summary') or item.get('content') or 'No summary available'}"
        for item in negative_items[:5]
    ]

    return "Recent negative items:\n" + _sentence_list(items)


def _events(data):
    event_items = [item for item in data.get("recent_items", []) if item.get("is_event")]

    if not event_items:
        return "There are no recent items flagged as events in the dashboard data."

    by_university = Counter(item.get("university") or "Unknown" for item in event_items)
    by_topic = Counter(item.get("topic") or "Unclassified" for item in event_items)
    latest = event_items[0]

    event_lines = [
        f"{item.get('university')} / {item.get('topic')}: {item.get('event_reason') or 'The item was marked as event-related by the classifier.'}"
        for item in event_items[:5]
    ]

    return (
        f"I found {len(event_items)} recent flagged events. "
        f"{by_university.most_common(1)[0][0]} appears most often, and the most common event topic is {by_topic.most_common(1)[0][0]}. "
        f"The latest event is about {latest.get('topic')} at {latest.get('university')}: {latest.get('summary') or 'No summary available'}\n\n"
        "Why they were flagged:\n"
        + _sentence_list(event_lines)
    )


def answer_chat(message):
    data = _dashboard_payload()
    normalized = (message or "").strip().lower()
    selected_university = _find_university(data, message)

    if not normalized:
        return {
            "answer": "Ask me about university sentiment, weak topics, recent negative posts, events, or comparisons.",
            "suggestions": DEFAULT_SUGGESTIONS,
        }

    if selected_university and any(word in normalized for word in ("report", "summary", "summarize", "overview")):
        answer = _university_report(data, selected_university)
    elif any(word in normalized for word in ("compare", "versus", "vs", "rank")):
        answer = _compare_universities(data)
    elif "event" in normalized:
        answer = _events(data)
    elif "negative" in normalized and any(word in normalized for word in ("post", "item", "recent", "comment")):
        answer = _recent_negative_posts(data)
    elif any(word in normalized for word in ("weak", "problem", "issue", "complaint", "attention")):
        if "topic" in normalized:
            answer = _weak_topics(data)
        else:
            answer = _negative_university(data)
    elif "negative" in normalized or "worst" in normalized or "lowest" in normalized:
        answer = _negative_university(data)
    elif "positive" in normalized or "best" in normalized or "strongest" in normalized:
        if "topic" in normalized:
            answer = _top_topics(data)
        else:
            answer = _positive_university(data)
    elif "topic" in normalized:
        answer = _weak_topics(data)
    elif any(word in normalized for word in ("summary", "summarize", "overview", "report")):
        answer = _summarize_dashboard(data)
    else:
        answer = (
            "I can help with UniPulse sentiment data. Try asking for a dashboard summary, "
            "the university needing attention, weak topics, recent negative posts, events, or a comparison."
        )

    return {
        "answer": answer,
        "suggestions": DEFAULT_SUGGESTIONS,
    }
