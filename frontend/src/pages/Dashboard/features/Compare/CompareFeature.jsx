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

function CompareFeature(props) {
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
          <section className="compare-page" aria-label="Compare universities">
            <section className="compare-difference-grid">
              <article className="compare-difference-tile">
                <span>Highest index</span>
                <strong>{Math.round(compareLeaders.strongest?.sentiment_index || 0)}</strong>
                <p>{compareLeaders.strongest?.name || "No university data"}</p>
              </article>
              <article className="compare-difference-tile">
                <span>Most discussed</span>
                <strong>{compareLeaders.mostDiscussed?.items || 0}</strong>
                <p>{compareLeaders.mostDiscussed?.name || "No university data"}</p>
              </article>
              <article className="compare-difference-tile">
                <span>Highest negative</span>
                <strong>{compareLeaders.mostNegative?.negative_percent || 0}%</strong>
                <p>{compareLeaders.mostNegative?.name || "No university data"}</p>
              </article>
            </section>

            <section className="compare-topic-panel">
              <div className="universities-table-header">
                <div>
                  <h2>Topic sentiment graph</h2>
                  <p>Positive sentiment by topic across all universities.</p>
                </div>
                <div className="chart-menu">
                  <button
                    type="button"
                    className="chart-menu-trigger"
                    onClick={() =>
                      setOpenChartMenu((menu) => (menu === "compare" ? "" : "compare"))
                    }
                    aria-label="Chart options"
                    title="Chart options"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openChartMenu === "compare" && (
                    <div className="chart-menu-list">
                      <button
                        type="button"
                        onClick={() => downloadChartPng(compareChartRef, "compare-topic-sentiment.png")}
                      >
                        Download PNG
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="chart-canvas compare-topic-chart" aria-label="Topic sentiment comparison graph">
                {compareChartData.labels.length ? (
                  <Bar
                    ref={compareChartRef}
                    data={compareChartData}
                    options={compareChartOptions}
                    plugins={[compareValueLabelsPlugin]}
                  />
                ) : (
                  <p className="empty-recent">No topic data is available for the graph yet.</p>
                )}
              </div>
            </section>

            <section className="compare-topic-panel">
              <div className="universities-table-header">
                <h2>All university comparison</h2>
                <p>Ranked by sentiment index across every active university.</p>
              </div>
              <div className="universities-table-wrap">
                <table className="compare-topic-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>University</th>
                      <th>Items</th>
                      <th>Index</th>
                      <th>Positive</th>
                      <th>Negative</th>
                      <th>Neutral</th>
                      <th>Strongest topic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparedSchools.map((school, index) => {
                      const strongestTopic = [...(school.topics || [])]
                        .filter((topic) => topic.items)
                        .sort(
                          (firstTopic, secondTopic) =>
                            (secondTopic.positive_percent || 0) - (firstTopic.positive_percent || 0),
                        )[0];

                      return (
                      <tr key={school.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="sentiment-ellipsis" title={school.name}>
                            {school.name}
                          </span>
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
                        <td>{formatTopicName(strongestTopic?.topic)}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!comparedSchools.length && (
                <p className="empty-recent">No universities are available to compare yet.</p>
              )}
            </section>
          </section>
  );
}

export default CompareFeature;
