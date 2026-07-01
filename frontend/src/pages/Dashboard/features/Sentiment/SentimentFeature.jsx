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

function SentimentFeature(props) {
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
          <section className="sentiment-page" aria-label="Sentiment analysed posts">
            <section className="sentiment-toolbar">
              <label className="sentiment-search">
                <Search size={16} />
                <input
                  type="search"
                  value={sentimentSearch}
                  onChange={(event) => updateSentimentFilter(setSentimentSearch, event.target.value)}
                  placeholder="Search summary, content, topic, university, source"
                />
              </label>

              <div className="sentiment-filters">
                <label>
                  <span>University</span>
                  <select
                    value={sentimentUniversityFilter}
                    onChange={(event) =>
                      updateSentimentFilter(setSentimentUniversityFilter, event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    {schools.map((school) => (
                      <option key={school.id} value={String(school.id)}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Sentiment</span>
                  <select
                    value={sentimentLabelFilter}
                    onChange={(event) =>
                      updateSentimentFilter(setSentimentLabelFilter, event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </label>

                <label>
                  <span>Topic</span>
                  <select
                    value={sentimentTopicFilter}
                    onChange={(event) =>
                      updateSentimentFilter(setSentimentTopicFilter, event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    {sentimentFilterOptions.topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {formatTopicName(topic)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Source</span>
                  <select
                    value={sentimentSourceFilter}
                    onChange={(event) =>
                      updateSentimentFilter(setSentimentSourceFilter, event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    {sentimentFilterOptions.sources.map((source) => (
                      <option key={source} value={source}>
                        {formatSourceName(source)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="sentiment-table-panel">
              <div className="universities-table-header">
                <h2>Analysed posts</h2>
                <p>
                  Showing {sentimentPageStart}-{sentimentPageEnd} of{" "}
                  {filteredSentimentItems.length}
                </p>
              </div>

              <div className="universities-table-wrap">
                <table className="sentiment-table">
                  <thead>
                    <tr>
                      <th>Summary / content</th>
                      <th>Sentiment</th>
                      <th>Topic</th>
                      <th>University</th>
                      <th>Source</th>
                      <th>Date</th>
                      <th className="actions-heading">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSentimentItems.map((item) => (
                      <tr key={item.post_id}>
                        <td>
                          <p className="sentiment-summary">
                            {item.summary || item.content || "No summary available"}
                          </p>
                        </td>
                        <td>
                          <span className={`metric-pill ${item.label}`}>{item.label}</span>
                        </td>
                        <td>{formatTopicName(item.topic)}</td>
                        <td>
                          <span className="sentiment-ellipsis" title={item.university || "Unknown"}>
                            {item.university || "Unknown"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="sentiment-ellipsis"
                            title={formatSourceName(item.source || item.source_type)}
                          >
                            {formatSourceName(item.source || item.source_type)}
                          </span>
                        </td>
                        <td>{formatDetailDate(item.post_date || item.classified_at)}</td>
                        <td className="universities-actions-cell">
                          <div className="universities-actions">
                            <button
                              type="button"
                              aria-label="View post details"
                              title="View details"
                              onClick={() => setSelectedDetailItem(item)}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!paginatedSentimentItems.length && (
                <p className="empty-recent">No analysed posts match your filters.</p>
              )}

              <div className="sentiment-pagination">
                <span>
                  Page {activeSentimentPage} of {sentimentTotalPages}
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => setSentimentPage((page) => Math.max(1, page - 1))}
                    disabled={activeSentimentPage === 1}
                    aria-label="Previous page"
                    title="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSentimentPage((page) => Math.min(sentimentTotalPages, page + 1))
                    }
                    disabled={activeSentimentPage === sentimentTotalPages}
                    aria-label="Next page"
                    title="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </section>
          </section>
  );
}

export default SentimentFeature;
