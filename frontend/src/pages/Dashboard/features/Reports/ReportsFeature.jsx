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

function ReportsFeature(props) {
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
          <section className="reports-page" aria-label="Reports">
            <section className="report-panel">
              <div className="universities-table-header">
                <div>
                  <h2>Report filters</h2>
                  <p>Select the records to include, then download the report.</p>
                </div>
              </div>

              <div className="report-form">
                <div className="sentiment-filters">
                  <label>
                    <span>University</span>
                    <select
                      value={reportUniversityFilter}
                      onChange={(event) =>
                        updateReportFilter(setReportUniversityFilter, event.target.value)
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
                      value={reportLabelFilter}
                      onChange={(event) => updateReportFilter(setReportLabelFilter, event.target.value)}
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
                      value={reportTopicFilter}
                      onChange={(event) => updateReportFilter(setReportTopicFilter, event.target.value)}
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
                      value={reportSourceFilter}
                      onChange={(event) => updateReportFilter(setReportSourceFilter, event.target.value)}
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

                <div className="report-date-row">
                  <label>
                    <span>Start date</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(event) => updateReportFilter(setReportStartDate, event.target.value)}
                    />
                  </label>
                  <label>
                    <span>End date</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(event) => updateReportFilter(setReportEndDate, event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Format</span>
                    <select
                      value={reportFormat}
                      onChange={(event) => setReportFormat(event.target.value)}
                    >
                      <option value="csv">CSV / Excel</option>
                      <option value="word">Word</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </label>
                  <button type="button" className="report-download-button" onClick={downloadReport}>
                    Download report
                  </button>
                </div>
              </div>
            </section>

            <section className="report-panel">
              <div className="universities-table-header">
                <div>
                  <h2>Report preview</h2>
                  <p>{filteredReportItems.length} analysed posts match the selected filters.</p>
                </div>
              </div>
              <div className="report-preview-list">
                {filteredReportItems.slice(0, 5).map((item) => (
                  <article key={item.post_id} className="report-preview-item">
                    <div>
                      <strong>{item.university || "Unknown"}</strong>
                      <span>{formatDetailDate(item.post_date || item.classified_at)}</span>
                    </div>
                    <p>{item.summary || item.content || "No summary available"}</p>
                    <div className="recent-meta">
                      <em className={item.label}>{item.label}</em>
                      <em>{formatTopicName(item.topic)}</em>
                      <em>{formatSourceName(item.source || item.source_type)}</em>
                    </div>
                  </article>
                ))}
                {!filteredReportItems.length && (
                  <p className="empty-recent">No records match the selected report filters.</p>
                )}
              </div>
            </section>
          </section>
  );
}

export default ReportsFeature;
