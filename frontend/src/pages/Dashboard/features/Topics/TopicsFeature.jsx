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

function TopicsFeature(props) {
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
          <section className="users-page" aria-label="Topics">
            <>
                <section className="users-toolbar">
                  <label className="university-search">
                    <Search size={16} />
                    <input
                      type="search"
                      value={topicSearch}
                      onChange={(event) => setTopicSearch(event.target.value)}
                      placeholder="Search topics by name or keywords"
                    />
                  </label>
                </section>

                <section className="universities-table-panel">
                  <div className="universities-table-header">
                    <div>
                      <h2>Topic rules</h2>
                      <p>{isLoadingTopics ? "Loading topics..." : `${filteredManagedTopics.length} topics found`}</p>
                    </div>
                  </div>

                  <div className="universities-table-wrap">
                    <table className="users-table topics-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Keywords</th>
                          {isAdmin && <th className="actions-heading">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredManagedTopics.map((topic) => (
                          <tr key={topic.id}>
                            <td>{topic.name}</td>
                            <td>
                              <span className="sentiment-ellipsis" title={topic.keywords || ""}>
                                {topic.keywords || "No keywords"}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="universities-actions-cell">
                                <div className="universities-actions">
                                  <button
                                    type="button"
                                    aria-label={`View ${topic.name}`}
                                    title="View"
                                    onClick={() => openViewTopicModal(topic)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Edit ${topic.name}`}
                                    title="Edit"
                                    onClick={() => openEditTopicModal(topic)}
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="is-danger"
                                    aria-label={`Delete ${topic.name}`}
                                    title="Delete"
                                    onClick={() => handleDeleteTopic(topic)}
                                    disabled={isDeletingTopic}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!filteredManagedTopics.length && !isLoadingTopics && (
                    <p className="empty-recent">No topics match your search.</p>
                  )}
                </section>
              </>
          </section>
  );
}

export default TopicsFeature;
