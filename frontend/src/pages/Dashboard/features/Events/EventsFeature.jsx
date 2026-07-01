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

function EventsFeature(props) {
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
          <section className="reports-page" aria-label="Events">
            <section className="event-filter-panel">
              <label>
                <span>University</span>
                <select
                  value={eventUniversityFilter}
                  onChange={(event) => setEventUniversityFilter(event.target.value)}
                >
                  <option value="all">All universities</option>
                  {schools.map((school) => (
                    <option key={school.id} value={String(school.id)}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Time frame</span>
                <select
                  value={eventTimeframe}
                  onChange={(event) => setEventTimeframe(event.target.value)}
                >
                  <option value="all">All time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </label>
            </section>

            <section className="school-grid event-summary-grid">
              <article className="school-card accent-green">
                <div>
                  <h2>Flagged events</h2>
                  <p>Detected from analysed posts</p>
                </div>
                <strong>{eventStats.total}</strong>
                <span>Total events</span>
              </article>
              <article className="school-card accent-violet">
                <div>
                  <h2>Leading university</h2>
                  <p>{eventStats.topUniversity?.[0] || "No event data"}</p>
                </div>
                <strong>{eventStats.topUniversity?.[1] || 0}</strong>
                <span>Event items</span>
              </article>
              <article className="school-card accent-gold">
                <div>
                  <h2>Main topic</h2>
                  <p>{eventStats.topTopic?.[0] || "No event data"}</p>
                </div>
                <strong>{eventStats.topTopic?.[1] || 0}</strong>
                <span>Mentions</span>
              </article>
            </section>

            <section className="compare-chart-panel">
              <div className="universities-table-header">
                <div>
                  <h2>Events over time</h2>
                  <p>Positive, neutral, and negative event volume for the selected time frame.</p>
                </div>
              </div>
              <div className="chart-canvas event-chart" aria-label="Events over time line chart">
                {eventLineData.labels.length ? (
                  <Line data={eventLineData} options={eventLineOptions} />
                ) : (
                  <p className="empty-recent">No event chart data is available for this selection.</p>
                )}
              </div>
            </section>

            <section className="report-panel">
              <div className="universities-table-header">
                <div>
                  <h2>Event timeline</h2>
                  <p>Posts classified as institutional updates, activities, or event-related items.</p>
                </div>
              </div>

              <div className="event-timeline">
                {paginatedEventItems.map((item) => (
                  <article key={item.post_id} className="event-item">
                    <div className="event-date">
                      <strong>{formatDetailDate(item.post_date || item.classified_at)}</strong>
                      <span>{item.label || "unknown"}</span>
                    </div>
                    <div className="event-content">
                      <div className="event-main-row">
                        <div>
                          <h3>{item.university || "Unknown university"}</h3>
                          <p>{item.summary || item.content || "No event summary available"}</p>
                        </div>
                        <div className="event-actions">
                          <button
                            type="button"
                            aria-label="View event details"
                            title="View"
                            onClick={() => setSelectedDetailItem(item)}
                          >
                            <Eye size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="is-danger"
                              aria-label="Delete event"
                              title="Delete"
                              onClick={() => handleDeleteEvent(item)}
                              disabled={isDeletingItem}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="recent-meta">
                        <em>{formatTopicName(item.topic)}</em>
                        <em>{formatSourceName(item.source || item.source_type)}</em>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="event-source-link"
                            aria-label="Open original event source"
                            title="Open original source"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <p className="event-flag-reason">
                        {item.event_reason ||
                          "No specific flag reason was returned. Re-run sentiment analysis to regenerate the event explanation."}
                      </p>
                    </div>
                  </article>
                ))}
                {!filteredEventItems.length && (
                  <p className="empty-recent">No events have been detected yet.</p>
                )}
              </div>
              {filteredEventItems.length > 0 && (
                <div className="sentiment-pagination">
                  <span>
                    Page {activeEventPage} of {eventTotalPages}
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => setEventPage((page) => Math.max(1, page - 1))}
                      disabled={activeEventPage === 1}
                      aria-label="Previous events page"
                      title="Previous page"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventPage((page) => Math.min(eventTotalPages, page + 1))}
                      disabled={activeEventPage === eventTotalPages}
                      aria-label="Next events page"
                      title="Next page"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </section>
  );
}

export default EventsFeature;
