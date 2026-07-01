/* eslint-disable no-unused-vars */
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

function OverviewFeature(props) {
  const {
    activeEventPage,
    activeSentimentPage,
    activeTopic,
    compareChartData,
    compareChartOptions,
    compareChartRef,
    compareValueLabelsPlugin,
    compareLeaders,
    comparedSchools,
    downloadChartPng,
    downloadReport,
    eventLineData,
    eventLineOptions,
    eventStats,
    eventTimeframe,
    eventTotalPages,
    eventUniversityFilter,
    filteredEventItems,
    filteredManagedTopics,
    filteredRecentItems,
    filteredReportItems,
    filteredSentimentItems,
    filteredUsers,
    formatDetailDate,
    formatSourceName,
    formatTopicName,
    formattedTopTopics,
    formattedWeakTopics,
    handleDeleteEvent,
    handleDeleteTopic,
    handleDeleteUniversity,
    handleDeleteUser,
    isAdmin,
    isDeletingItem,
    isDeletingTopic,
    isDeletingUniversity,
    isDeletingUser,
    isLoadingTopics,
    isLoadingUsers,
    isTopicMenuOpen,
    isUniversityMenuOpen,
    mixChartData,
    mixChartOptions,
    openChartMenu,
    openEditTopicModal,
    openEditUserModal,
    openUniversityModal,
    openViewTopicModal,
    openViewUserModal,
    overviewChart,
    overviewMixChartRef,
    overviewTrendChartRef,
    paginatedEventItems,
    paginatedSentimentItems,
    primarySchool,
    primaryTopTopic,
    reportEndDate,
    reportFormat,
    reportLabelFilter,
    reportSourceFilter,
    reportStartDate,
    reportTopicFilter,
    reportUniversityFilter,
    schoolAccents,
    schools,
    selectedTopicData,
    selectedUniversityId,
    sentimentFilterOptions,
    sentimentLabelFilter,
    sentimentPageEnd,
    sentimentPageStart,
    sentimentSearch,
    sentimentSourceFilter,
    sentimentSourceOptions,
    sentimentTotalPages,
    sentimentTopicFilter,
    sentimentTopicOptions,
    sentimentUniversityFilter,
    sentimentUniversityOptions,
    setEventPage,
    setEventTimeframe,
    setEventUniversityFilter,
    setActivePage,
    setIsTopicMenuOpen,
    setIsUniversityMenuOpen,
    setOpenChartMenu,
    setOverviewChart,
    setReportEndDate,
    setReportFormat,
    setReportLabelFilter,
    setReportSourceFilter,
    setReportStartDate,
    setReportTopicFilter,
    setReportUniversityFilter,
    setSelectedDetailItem,
    setSelectedTopic,
    setSelectedUniversityId,
    setSentimentLabelFilter,
    setSentimentPage,
    setSentimentSearch,
    setSentimentSourceFilter,
    setSentimentTopicFilter,
    setSentimentUniversityFilter,
    setShowAllRecent,
    setTopicSearch,
    setUniversitySearch,
    setUniversitySort,
    setUserSearch,
    showAllRecent,
    sortedUniversities,
    topicOptions,
    topicSearch,
    trendChartData,
    trendChartOptions,
    universitySearch,
    universitySort,
    universityStats,
    user,
    userSearch,
    updateReportFilter,
    updateSentimentFilter,
    visibleRecentItems,
  } = props;

  return (
          <>
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
                {item.university} - {item.topic} <strong>{item.positive_percent}% positive</strong>
              </p>
            ))}
          </article>
          <article className="insight-card">
            <h3>Weakest topic by school</h3>
            {formattedWeakTopics.map((item) => (
              <p key={`${item.university}-${item.topic}`}>
                {item.university} - {item.topic} <strong>{item.negative_percent || 0}% negative</strong>
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
                            setShowAllRecent(false);
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
                    <span>{formatTopicName(selectedTopicData?.topic || activeTopic)}</span>
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
                      className={topic.topic === activeTopic ? "is-selected" : ""}
                      onClick={() => {
                        setSelectedTopic(topic.topic);
                        setShowAllRecent(false);
                        setIsTopicMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={topic.topic === activeTopic}
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

            <section className="chart-panel chart-panel-wide overview-chart-panel">
                <div className="chart-heading">
                  <div>
                    <h3>{overviewChart === "trend" ? "Sentiment trend" : "Current mix"}</h3>
                    <p>
                      {overviewChart === "trend"
                        ? `${formatTopicName(selectedTopicData?.topic || activeTopic)} over the last 7 days`
                        : `${selectedTopicData?.items || 0} analysed items in this topic`}
                    </p>
                  </div>
                  <label className="chart-select">
                    <span>Chart</span>
                    <select
                      value={overviewChart}
                      onChange={(event) => setOverviewChart(event.target.value)}
                    >
                      <option value="trend">Sentiment trend</option>
                      <option value="mix">Current mix</option>
                    </select>
                  </label>
                  <div className="chart-menu">
                    <button
                      type="button"
                      className="chart-menu-trigger"
                      onClick={() =>
                        setOpenChartMenu((menu) => (menu === "overview" ? "" : "overview"))
                      }
                      aria-label="Chart options"
                      title="Chart options"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openChartMenu === "overview" && (
                      <div className="chart-menu-list">
                        <button
                          type="button"
                          onClick={() =>
                            downloadChartPng(
                              overviewChart === "trend" ? overviewTrendChartRef : overviewMixChartRef,
                              `overview-${overviewChart}.png`,
                            )
                          }
                        >
                          Download PNG
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`chart-canvas ${overviewChart === "trend" ? "trend-chart" : "mix-chart"}`}
                  aria-label={overviewChart === "trend" ? "Positive, negative, and neutral trend" : "Current sentiment mix"}
                >
                  {overviewChart === "trend" ? (
                    <Line ref={overviewTrendChartRef} data={trendChartData} options={trendChartOptions} />
                  ) : (
                    <Doughnut ref={overviewMixChartRef} data={mixChartData} options={mixChartOptions} />
                  )}
                </div>
              </section>
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
                      <span>{formatSourceName(item.source || item.source_type)}</span>
                      <em className={item.label}>{item.label}</em>
                      <em>{item.topic}</em>
                    </div>
                    <p>{item.summary}</p>
                  </button>
                ))
              ) : (
                <p className="empty-recent">
                  No recent items for {formatTopicName(activeTopic)} yet.
                </p>
              )}
            </div>
          </article>
        </section>
          </>
  );
}

export default OverviewFeature;
