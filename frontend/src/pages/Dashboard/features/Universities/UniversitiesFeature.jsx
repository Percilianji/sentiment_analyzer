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

function UniversitiesFeature(props) {
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
          <section className="universities-page" aria-label="Universities page">
            <div className="universities-summary-grid">
              <article className="university-summary-tile">
                <span>Active universities</span>
                <strong>{schools.length}</strong>
                <p>Institutions currently tracked</p>
              </article>
              <article className="university-summary-tile">
                <span>Analysed items</span>
                <strong>{universityStats.totalItems}</strong>
                <p>Total sentiment records</p>
              </article>
              <article className="university-summary-tile">
                <span>Average sentiment</span>
                <strong>{Math.round(universityStats.averageSentiment)}</strong>
                <p>Mean index across universities</p>
              </article>
              <article className="university-summary-tile">
                <span>Needs attention</span>
                <strong>{universityStats.needsAttention?.negative_percent || 0}%</strong>
                <p>{universityStats.needsAttention?.name || "No university data"}</p>
              </article>
            </div>

            <section className="universities-toolbar">
              <label className="university-search">
                <Search size={16} />
                <input
                  type="search"
                  value={universitySearch}
                  onChange={(event) => setUniversitySearch(event.target.value)}
                  placeholder="Search universities"
                />
              </label>
              <label className="university-sort">
                <span>Sort</span>
                <select
                  value={universitySort}
                  onChange={(event) => setUniversitySort(event.target.value)}
                >
                  <option value="sentiment">Sentiment index</option>
                  <option value="items">Analysed items</option>
                  <option value="negative">Negative share</option>
                  <option value="name">Name</option>
                </select>
              </label>
            </section>

            <section className="universities-table-panel">
              <div className="universities-table-header">
                <h2>University performance</h2>
                <p>
                  {universityStats.strongestSchool?.name || "No university"} has the highest sentiment index.
                </p>
              </div>

              <div className="universities-table-wrap">
                <table className="universities-table">
                  <thead>
                    <tr>
                      <th>University</th>
                      <th>Items</th>
                      <th>Sentiment index</th>
                      <th>Positive</th>
                      <th>Negative</th>
                      <th>Neutral</th>
                      <th className="actions-heading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUniversities.map((school) => (
                      <tr key={school.id}>
                        <td>
                          <button
                            type="button"
                            className="university-name-button"
                            onClick={() => {
                              setSelectedUniversityId(String(school.id));
                              setSelectedTopic("");
                              setShowAllRecent(false);
                              setActivePage("overview");
                            }}
                          >
                            <span>{school.name}</span>
                            <em>Open overview</em>
                          </button>
                        </td>
                        <td>{school.items || 0}</td>
                        <td>
                          <strong>{Math.round(school.sentiment_index || 0)}</strong>
                        </td>
                        <td>
                          <span className="metric-pill positive">{school.positive_percent || 0}%</span>
                        </td>
                        <td>
                          <span className="metric-pill negative">{school.negative_percent || 0}%</span>
                        </td>
                        <td>
                          <span className="metric-pill neutral">{school.neutral_percent || 0}%</span>
                        </td>
                        <td className="universities-actions-cell">
                          <div className="universities-actions">
                            <button
                              type="button"
                              aria-label={`View ${school.name}`}
                              title="View"
                              onClick={() => openUniversityModal("view", school)}
                            >
                              <Eye size={16} />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  aria-label={`Edit ${school.name}`}
                                  title="Edit"
                                  onClick={() => openUniversityModal("edit", school)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="is-danger"
                                  aria-label={`Delete ${school.name}`}
                                  title="Delete"
                                  onClick={() => handleDeleteUniversity(school)}
                                  disabled={isDeletingUniversity}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!sortedUniversities.length && (
                <p className="empty-recent">No universities match your search.</p>
              )}
            </section>
          </section>
  );
}

export default UniversitiesFeature;
