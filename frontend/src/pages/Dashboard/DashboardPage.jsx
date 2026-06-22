import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Plus,
  School,
  Settings,
  TrendingDown,
  Users,
  X,
} from "lucide-react";
import logo from "../../assets/unipulse-logo.png";
import { dashboardApi } from "../../services/api";
import "./DashboardPage.css";

const navGroups = [
  {
    label: "Institutions",
    items: [
      { icon: LayoutDashboard, label: "Overview", active: true },
      { icon: School, label: "Universities" },
      { icon: BarChart3, label: "Sentiment" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { icon: Gauge, label: "Compare" },
      { icon: TrendingDown, label: "Weak topics" },
      { icon: FileText, label: "Reports" },
    ],
  },
  {
    label: "Admin",
    items: [
      { icon: Building2, label: "School manager" },
      { icon: Users, label: "Users" },
      { icon: Settings, label: "Settings" },
    ],
  },
];

function DashboardPage({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isUniversityMenuOpen, setIsUniversityMenuOpen] = useState(false);
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await dashboardApi.overview();
        if (isMounted) {
          console.log("[UniPulse dashboard payload]", data);
          setDashboard(data);
        }
      } catch (dashboardError) {
        if (isMounted) {
          setError(dashboardError.message || "Could not load dashboard data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const schools = dashboard?.universities || [];
  const topicDisplayLimit = Math.max(schools.length, 1);
  const primarySchool =
    schools.find((school) => String(school.id) === String(selectedUniversityId)) ||
    schools.find((school) => school.name.toLowerCase() === "university of buea") ||
    schools[0];
  const selectedTopicData =
    primarySchool?.topics?.find((topic) => topic.topic === selectedTopic) ||
    primarySchool?.topics?.[0];
  const topTopics = dashboard?.top_topics || [];
  const weakTopics = dashboard?.weak_topics || [];
  const recentItems = dashboard?.recent_items || [];
  const primaryTopTopic =
    topTopics.find((topic) => topic.university === primarySchool?.name) || topTopics[0];
  const topicOptions = useMemo(() => {
    const fallbackTopicOptions = [...topTopics, ...weakTopics].filter(
      (topic) => topic.university === primarySchool?.name,
    );

    return (primarySchool?.topics?.length ? primarySchool.topics : fallbackTopicOptions).filter(
      (topic, index, topics) => topics.findIndex((item) => item.topic === topic.topic) === index,
    );
  }, [primarySchool, topTopics, weakTopics]);
  const formatTopicName = (topicName) => {
    if (!topicName) {
      return "Academic Life";
    }

    return topicName;
  };

  useEffect(() => {
    if (!schools.length || selectedUniversityId) {
      return;
    }

    const defaultSchool =
      schools.find((school) => school.name.toLowerCase() === "university of buea") || schools[0];
    setSelectedUniversityId(String(defaultSchool.id));
  }, [schools, selectedUniversityId]);

  useEffect(() => {
    if (!topicOptions.length) {
      setSelectedTopic("");
      return;
    }

    if (!topicOptions.some((topic) => topic.topic === selectedTopic)) {
      const academicTopic =
        topicOptions.find((topic) =>
          ["academic life", "academics", "teaching quality"].includes(topic.topic.toLowerCase()),
        ) || topicOptions[0];

      setSelectedTopic(academicTopic.topic);
    }
  }, [selectedTopic, topicOptions]);

  useEffect(() => {
    setShowAllRecent(false);
  }, [selectedUniversityId, selectedTopic]);

  const schoolAccents = ["violet", "green", "gold"];
  const formattedTopTopics = useMemo(
    () =>
      topTopics.length
        ? topTopics.slice(0, topicDisplayLimit)
        : [{ university: "No data", topic: "Run topic classification", positive_percent: 0 }],
    [topTopics, topicDisplayLimit],
  );
  const formattedWeakTopics = useMemo(
    () =>
      weakTopics.length
        ? weakTopics.slice(0, topicDisplayLimit)
        : [{ university: "No data", topic: "Run topic classification", positive_percent: 0, negative_percent: 0 }],
    [weakTopics, topicDisplayLimit],
  );
  const selectedTopicRecentItems = selectedTopicData?.recent_items || [];
  const filteredRecentItems = useMemo(() => {
    if (selectedTopicRecentItems.length) {
      return selectedTopicRecentItems;
    }

    return recentItems.filter((item) => {
      const sameSchool = String(item.university_id) === String(primarySchool?.id);
      const sameTopic = item.topic === selectedTopic;

      return sameSchool && sameTopic;
    });
  }, [primarySchool, recentItems, selectedTopic, selectedTopicRecentItems]);
  const visibleRecentItems = showAllRecent ? filteredRecentItems : filteredRecentItems.slice(0, 5);

  useEffect(() => {
    if (!primarySchool || !selectedTopic) {
      return;
    }

    console.log("[UniPulse selected topic]", {
      university: primarySchool.name,
      selectedTopic,
      selectedTopicData,
      topicRecentItems: selectedTopicRecentItems,
      dashboardRecentItems: recentItems,
      filteredRecentItems,
    });
  }, [primarySchool, selectedTopic, selectedTopicData, selectedTopicRecentItems, recentItems, filteredRecentItems]);
  const trendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hasTrendItems = selectedTopicData?.trend?.some((point) => point.items > 0);

    if (hasTrendItems) {
      return selectedTopicData.trend;
    }

    return days.map((day) => ({
      day,
      positive_percent: selectedTopicData?.positive_percent || 0,
      negative_percent: selectedTopicData?.negative_percent || 0,
      neutral_percent: selectedTopicData?.neutral_percent || 0,
      items: selectedTopicData?.items || 0,
    }));
  }, [selectedTopicData]);
  const getTrendPoint = (point, index, field) => {
    const x = trendData.length === 1 ? 50 : 6 + index * (88 / (trendData.length - 1));
    const y = 102 - Math.max(0, Math.min(100, point[field] || 0)) * 0.82;

    return { x, y };
  };
  const getTrendPoints = (field) =>
    trendData
      .map((point, index) => {
        const { x, y } = getTrendPoint(point, index, field);
        return `${x},${y}`;
      })
      .join(" ");
  const formatDetailDate = (value) => {
    if (!value) {
      return "Not available";
    }

    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const closeDetailModal = () => {
    if (!isDeletingItem) {
      setSelectedDetailItem(null);
    }
  };
  const removePostFromDashboard = (postId) => {
    setDashboard((currentDashboard) => {
      if (!currentDashboard) {
        return currentDashboard;
      }

      return {
        ...currentDashboard,
        recent_items: (currentDashboard.recent_items || []).filter(
          (item) => item.post_id !== postId,
        ),
        universities: (currentDashboard.universities || []).map((school) => ({
          ...school,
          items:
            String(school.id) === String(selectedDetailItem?.university_id)
              ? Math.max((school.items || 0) - 1, 0)
              : school.items,
          topics: (school.topics || []).map((topic) => ({
            ...topic,
            recent_items: (topic.recent_items || []).filter((item) => item.post_id !== postId),
          })),
        })),
      };
    });
  };
  const handleDeleteDetailItem = async () => {
    if (!selectedDetailItem) {
      return;
    }

    setIsDeletingItem(true);

    try {
      await dashboardApi.deletePost(selectedDetailItem.post_id);
      removePostFromDashboard(selectedDetailItem.post_id);
      setSelectedDetailItem(null);
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete the selected item.");
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="UniPulse" />
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navGroups.map((group) => (
            <section key={group.label} className="nav-group">
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={`nav-item ${item.active ? "is-active" : ""}`}
                    key={item.label}
                    type="button"
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </section>
          ))}
        </nav>

        <button type="button" className="logout-button" onClick={onLogout}>
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p>All institutions</p>
            <h1>University sentiment overview</h1>
            <span>
              Showing {dashboard?.totals?.active_universities || 0} active universities -{" "}
              {dashboard?.totals?.sentiment_results || 0} analysed items
            </span>
          </div>

          <div className="header-actions">
            <div className="admin-chip">
              <span>{user?.name || "Admin"}</span>
              <strong>{user?.role || "admin"}</strong>
            </div>
            <button type="button" className="add-school-button">
              <Plus size={16} />
              <span>Add school</span>
            </button>
          </div>
        </header>

        {error && <p className="dashboard-error">{error}</p>}
        {isLoading && <p className="dashboard-loading">Loading dashboard data...</p>}

        <section className="school-grid" aria-label="School sentiment cards">
          {schools.map((school, index) => (
            <article
              className={`school-card accent-${schoolAccents[index % schoolAccents.length]}`}
              key={school.id}
            >
              <div>
                <h2>{school.name}</h2>
                <p>
                  {school.items} items - live database
                </p>
              </div>
              <strong>{Math.round(school.sentiment_index)}</strong>
              <span>Sentiment index</span>
              <div className="mini-mix">
                <em>{school.positive_percent}% positive</em>
                <em>{school.negative_percent}% negative</em>
                <em>{school.neutral_percent}% neutral</em>
              </div>
            </article>
          ))}
        </section>

        <section className="insight-grid">
          <article className="insight-card">
            <h3>Top topic by school</h3>
            {formattedTopTopics.map((item) => (
              <p key={`${item.university}-${item.topic}`}>
                {item.university} - {item.topic} <strong>{item.positive_percent}% pos</strong>
              </p>
            ))}
          </article>
          <article className="insight-card">
            <h3>Weakest topic by school</h3>
            {formattedWeakTopics.map((item) => (
              <p key={`${item.university}-${item.topic}`}>
                {item.university} - {item.topic} <strong>{item.positive_percent}% positive</strong>
              </p>
            ))}
          </article>
        </section>

        <section className="school-detail">
          <div className="detail-title-row">
            <div>
              <div className="detail-school-select">
                <h2>{primarySchool?.name || "No university selected"}</h2>
                <div className="university-menu">
                  <button
                    type="button"
                    className="university-menu-trigger"
                    onClick={() => setIsUniversityMenuOpen((open) => !open)}
                    aria-expanded={isUniversityMenuOpen}
                    aria-haspopup="listbox"
                    aria-label="Choose university"
                    title="Choose university"
                  >
                    <ChevronDown size={18} />
                  </button>

                  {isUniversityMenuOpen && (
                    <div className="university-menu-list" role="listbox">
                      {schools.map((school) => (
                        <button
                          type="button"
                          key={school.id}
                          className={
                            String(school.id) === String(selectedUniversityId)
                              ? "is-selected"
                              : ""
                          }
                          onClick={() => {
                            setSelectedUniversityId(String(school.id));
                            setSelectedTopic("");
                            setIsUniversityMenuOpen(false);
                            setIsTopicMenuOpen(false);
                          }}
                          role="option"
                          aria-selected={String(school.id) === String(selectedUniversityId)}
                        >
                          {school.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p>{primarySchool?.items || 0} analysed items</p>
            </div>
            <div className="detail-index">
              <strong>{Math.round(primarySchool?.sentiment_index || 0)}</strong>
              <span>Sentiment index</span>
            </div>
          </div>

          <div className="sentiment-breakdown">
            <div className="breakdown-tile positive">
              <span>Positive</span>
              <strong>{primarySchool?.positive_percent || 0}%</strong>
              <p>Current share</p>
            </div>
            <div className="breakdown-tile negative">
              <span>Negative</span>
              <strong>{primarySchool?.negative_percent || 0}%</strong>
              <p>Current share</p>
            </div>
            <div className="breakdown-tile neutral">
              <span>Neutral</span>
              <strong>{primarySchool?.neutral_percent || 0}%</strong>
              <p>Current share</p>
            </div>
          </div>

          <article className="topic-panel">
            <div className="topic-selector">
                <span>Topic</span>
                <div className="topic-menu">
                  <button
                    type="button"
                    className="topic-menu-trigger"
                    onClick={() => setIsTopicMenuOpen((open) => !open)}
                    aria-expanded={isTopicMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span>{formatTopicName(selectedTopicData?.topic || selectedTopic)}</span>
                    <ChevronDown size={18} />
                  </button>
                </div>
              <p>{selectedTopicData?.positive_percent || primaryTopTopic?.positive_percent || 0}% positive</p>
            </div>

            {isTopicMenuOpen && (
              <div className="topic-menu-list" role="listbox">
                {topicOptions.length ? (
                  topicOptions.map((topic) => (
                    <button
                      type="button"
                      key={topic.topic}
                      className={topic.topic === selectedTopic ? "is-selected" : ""}
                      onClick={() => {
                        setSelectedTopic(topic.topic);
                        setIsTopicMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={topic.topic === selectedTopic}
                    >
                      {formatTopicName(topic.topic)}
                    </button>
                  ))
                ) : (
                  <span>No topics available</span>
                )}
              </div>
            )}

            <div className="topic-bars">
              <div>
                <span>Positive</span>
                <i style={{ "--value": `${selectedTopicData?.positive_percent || 0}%` }} />
                <em>{selectedTopicData?.positive_percent || 0}%</em>
              </div>
              <div>
                <span>Negative</span>
                <i style={{ "--value": `${selectedTopicData?.negative_percent || 0}%` }} />
                <em>{selectedTopicData?.negative_percent || 0}%</em>
              </div>
              <div>
                <span>Neutral</span>
                <i style={{ "--value": `${selectedTopicData?.neutral_percent || 0}%` }} />
                <em>{selectedTopicData?.neutral_percent || 0}%</em>
              </div>
            </div>

            <div className="trend-chart" aria-label="Trend last 7 days">
              <svg viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true">
                <polyline
                  className="positive-trend-line"
                  points={getTrendPoints("positive_percent")}
                />
                <polyline
                  className="negative-trend-line"
                  points={getTrendPoints("negative_percent")}
                />
                {trendData.map((point, index) => {
                  const positivePoint = getTrendPoint(point, index, "positive_percent");
                  const negativePoint = getTrendPoint(point, index, "negative_percent");

                  return (
                    <g key={point.day}>
                      <circle
                        className="positive-trend-dot"
                        cx={positivePoint.x}
                        cy={positivePoint.y}
                        r="1.45"
                      />
                      <circle
                        className="negative-trend-dot"
                        cx={negativePoint.x}
                        cy={negativePoint.y}
                        r="1.45"
                      />
                    </g>
                  );
                })}
              </svg>
              <div className="chart-days">
                {trendData.map((point) => (
                  <span key={point.day}>{point.day}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="recent-panel">
            <div className="recent-heading">
              <h3>Recent items</h3>
              {filteredRecentItems.length > 5 && (
                <button type="button" onClick={() => setShowAllRecent((current) => !current)}>
                  {showAllRecent ? "Show less" : "See more"}
                </button>
              )}
            </div>
            <div className="recent-list">
              {visibleRecentItems.length ? (
                visibleRecentItems.map((item) => (
                  <button
                    type="button"
                    className="recent-item"
                    key={item.post_id}
                    onClick={() => setSelectedDetailItem(item)}
                  >
                    <div className="recent-meta">
                      <strong>{item.author}</strong>
                      <span>{item.source}</span>
                      <em className={item.label}>{item.label}</em>
                      <em>{item.topic}</em>
                    </div>
                    <p>{item.summary}</p>
                  </button>
                ))
              ) : (
                <p className="empty-recent">
                  No recent items for {formatTopicName(selectedTopic)} yet.
                </p>
              )}
            </div>
          </article>
        </section>

        {selectedDetailItem && (
          <div className="detail-modal-backdrop" role="presentation" onMouseDown={closeDetailModal}>
            <section
              className="detail-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="detail-modal-header">
                <h2 id="detail-modal-title">Event Detail</h2>
                <button type="button" onClick={closeDetailModal} aria-label="Close details">
                  <X size={20} />
                </button>
              </header>

              <div className="detail-modal-body">
                <div className="detail-row">
                  <span>Name</span>
                  <p>{selectedDetailItem.topic}</p>
                </div>
                <div className="detail-row">
                  <span>University</span>
                  <p>{selectedDetailItem.university || primarySchool?.name}</p>
                </div>
                <div className="detail-row">
                  <span>Created By</span>
                  <p>{selectedDetailItem.author || "Unknown"}</p>
                </div>
                <div className="detail-row">
                  <span>Source</span>
                  <p>{selectedDetailItem.source || selectedDetailItem.source_type || "Unknown"}</p>
                </div>
                <div className="detail-row">
                  <span>Date of the event</span>
                  <p>{formatDetailDate(selectedDetailItem.post_date || selectedDetailItem.classified_at)}</p>
                </div>
                <div className="detail-row">
                  <span>Rating</span>
                  <em className={`detail-rating ${selectedDetailItem.label}`}>
                    {selectedDetailItem.label}
                  </em>
                </div>
                <div className="detail-row">
                  <span>Event flag</span>
                  <p>{selectedDetailItem.is_event ? "Flagged event" : "Regular item"}</p>
                </div>
                <div className="detail-row">
                  <span>Source link</span>
                  {selectedDetailItem.url ? (
                    <a href={selectedDetailItem.url} target="_blank" rel="noreferrer">
                      File
                    </a>
                  ) : (
                    <p>Not available</p>
                  )}
                </div>
                <label className="detail-description">
                  <span>Description</span>
                  <textarea readOnly value={selectedDetailItem.content || selectedDetailItem.summary || ""} />
                </label>
              </div>

              <footer className="detail-modal-actions">
                <button type="button" className="cancel-detail-button" onClick={closeDetailModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="delete-detail-button"
                  onClick={handleDeleteDetailItem}
                  disabled={isDeletingItem}
                >
                  {isDeletingItem ? "Removing..." : "Delete"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;
