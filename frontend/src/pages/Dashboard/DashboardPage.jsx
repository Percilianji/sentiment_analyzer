import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Eye,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  School,
  Settings,
  Tags,
  TrendingDown,
  Trash2,
  Users,
  X,
} from "lucide-react";
import logo from "../../assets/unipulse-logo.png";
import { dashboardApi, topicApi, universityApi, userApi } from "../../services/api";
import "./DashboardPage.css";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const EMPTY_ARRAY = [];
const SENTIMENT_PAGE_SIZE = 10;
const EVENT_PAGE_SIZE = 5;

const formatTopicName = (topicName) => {
  if (!topicName) {
    return "Academic Life";
  }

  return topicName;
};

const formatSourceName = (sourceName) => {
  if (!sourceName) {
    return "Unknown";
  }

  return sourceName
    .replace(/^apify[_\s-]*/i, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const isPrimaryUniversity = (name = "") => {
  const normalizedName = name.toLowerCase();

  return normalizedName.includes("university of buea") || normalizedName.includes("university of beau");
};

const sortPrimaryUniversityFirst = (items, getName = (item) => item?.name) =>
  [...items].sort((firstItem, secondItem) => {
    const firstIsPrimary = isPrimaryUniversity(getName(firstItem));
    const secondIsPrimary = isPrimaryUniversity(getName(secondItem));

    if (firstIsPrimary !== secondIsPrimary) {
      return firstIsPrimary ? -1 : 1;
    }

    return 0;
  });

const compareValueLabelsPlugin = {
  id: "compareValueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    ctx.save();
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];

        if (value === null || value === undefined) {
          return;
        }

        const barHeight = Math.abs(bar.base - bar.y);
        const isShortBar = barHeight < 22;
        const backgroundColor = String(dataset.backgroundColor || "");
        const useDarkText = backgroundColor.toLowerCase() === "#facc15" || isShortBar;

        ctx.fillStyle = useDarkText ? "#17231c" : "#ffffff";
        ctx.fillText(
          `${value}%`,
          bar.x,
          isShortBar ? bar.y - 8 : bar.y + barHeight / 2,
        );
      });
    });

    ctx.restore();
  },
};

const navGroups = [
  {
    label: "Institutions",
    items: [
      { icon: LayoutDashboard, label: "Overview", page: "overview" },
      { icon: School, label: "Universities", page: "universities" },
      { icon: BarChart3, label: "Sentiment", page: "sentiment" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { icon: Gauge, label: "Compare", page: "compare" },
      { icon: TrendingDown, label: "Events", page: "events" },
      { icon: Tags, label: "Topics", page: "topics" },
      { icon: FileText, label: "Reports", page: "reports" },
    ],
  },
  {
    label: "Admin",
    items: [
      { icon: Users, label: "Users", page: "users" },
      { icon: Settings, label: "Settings" },
    ],
  },
];

function DashboardPage({ user, onLogout, onUserChange }) {
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const overviewTrendChartRef = useRef(null);
  const overviewMixChartRef = useRef(null);
  const compareChartRef = useRef(null);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isUniversityMenuOpen, setIsUniversityMenuOpen] = useState(false);
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("overview");
  const [universitySearch, setUniversitySearch] = useState("");
  const [universitySort, setUniversitySort] = useState("sentiment");
  const [sentimentSearch, setSentimentSearch] = useState("");
  const [sentimentUniversityFilter, setSentimentUniversityFilter] = useState("all");
  const [sentimentLabelFilter, setSentimentLabelFilter] = useState("all");
  const [sentimentTopicFilter, setSentimentTopicFilter] = useState("all");
  const [sentimentSourceFilter, setSentimentSourceFilter] = useState("all");
  const [sentimentPage, setSentimentPage] = useState(1);
  const [reportUniversityFilter, setReportUniversityFilter] = useState("all");
  const [reportLabelFilter, setReportLabelFilter] = useState("all");
  const [reportTopicFilter, setReportTopicFilter] = useState("all");
  const [reportSourceFilter, setReportSourceFilter] = useState("all");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportFormat, setReportFormat] = useState("csv");
  const [eventUniversityFilter, setEventUniversityFilter] = useState("all");
  const [eventTimeframe, setEventTimeframe] = useState("all");
  const [eventPage, setEventPage] = useState(1);
  const [overviewChart, setOverviewChart] = useState("trend");
  const [openChartMenu, setOpenChartMenu] = useState("");
  const [universityModalMode, setUniversityModalMode] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityForm, setUniversityForm] = useState({
    name: "",
    keywords: "",
    active: true,
  });
  const [isLoadingUniversity, setIsLoadingUniversity] = useState(false);
  const [isSavingUniversity, setIsSavingUniversity] = useState(false);
  const [isDeletingUniversity, setIsDeletingUniversity] = useState(false);
  const [topics, setTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState("create");
  const [selectedManagedTopic, setSelectedManagedTopic] = useState(null);
  const [isSavingTopic, setIsSavingTopic] = useState(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);
  const [topicForm, setTopicForm] = useState({
    name: "",
    keywords: "",
  });
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "analyst",
  });
  const visibleNavGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => group.label !== "Admin" || isAdmin),
        }))
        .filter((group) => group.items.length),
    [isAdmin],
  );

  const refreshDashboard = useCallback(async () => {
    const data = await dashboardApi.overview();
    console.log("[UniPulse dashboard payload]", data);
    setDashboard(data);
  }, []);
  const downloadChartPng = (chartRef, fileName) => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    const link = document.createElement("a");
    link.href = chart.toBase64Image("image/png", 1);
    link.download = fileName;
    link.click();
    setOpenChartMenu("");
  };

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

  useEffect(() => {
    if (!error && !notice) {
      return undefined;
    }

    const toastTimer = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 4200);

    return () => window.clearTimeout(toastTimer);
  }, [error, notice]);

  useEffect(() => {
    if (activePage !== "users" || !isAdmin) {
      return;
    }

    let isMounted = true;

    async function loadUsers() {
      setIsLoadingUsers(true);

      try {
        const data = await userApi.list();

        if (isMounted) {
          setUsers(data);
        }
      } catch (userError) {
        if (isMounted) {
          setError(userError.message || "Could not load users.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [activePage, isAdmin]);

  useEffect(() => {
    if (!isAdmin && activePage === "users") {
      setActivePage("overview");
    }
  }, [activePage, isAdmin]);

  useEffect(() => {
    setEventPage(1);
  }, [eventTimeframe, eventUniversityFilter]);

  useEffect(() => {
    if (activePage !== "topics") {
      return;
    }

    let isMounted = true;

    async function loadTopics() {
      setIsLoadingTopics(true);

      try {
        const data = await topicApi.list();

        if (isMounted) {
          setTopics(data);
        }
      } catch (topicError) {
        if (isMounted) {
          setError(topicError.message || "Could not load topics.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingTopics(false);
        }
      }
    }

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, [activePage, isAdmin]);

  const schools = useMemo(
    () => sortPrimaryUniversityFirst(dashboard?.universities ?? EMPTY_ARRAY),
    [dashboard],
  );
  const topicDisplayLimit = Math.max(schools.length, 1);
  const defaultSchool =
    schools.find((school) => isPrimaryUniversity(school.name)) || schools[0];
  const activeUniversityId = selectedUniversityId || (defaultSchool ? String(defaultSchool.id) : "");
  const primarySchool =
    schools.find((school) => String(school.id) === String(activeUniversityId)) || defaultSchool;
  const topTopics = dashboard?.top_topics ?? EMPTY_ARRAY;
  const weakTopics = dashboard?.weak_topics ?? EMPTY_ARRAY;
  const recentItems = dashboard?.recent_items ?? EMPTY_ARRAY;
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
  const defaultTopic =
    topicOptions.find((topic) =>
      ["academic life", "academics", "teaching quality"].includes(topic.topic.toLowerCase()),
    ) || topicOptions[0];
  const activeTopic = topicOptions.some((topic) => topic.topic === selectedTopic)
    ? selectedTopic
    : defaultTopic?.topic || "";
  const selectedTopicData =
    primarySchool?.topics?.find((topic) => topic.topic === activeTopic) ||
    topicOptions.find((topic) => topic.topic === activeTopic) ||
    primarySchool?.topics?.[0];
  const universityStats = useMemo(() => {
    const totalItems = schools.reduce((sum, school) => sum + (school.items || 0), 0);
    const averageSentiment = schools.length
      ? schools.reduce((sum, school) => sum + (school.sentiment_index || 0), 0) / schools.length
      : 0;
    const strongestSchool = [...schools].sort(
      (firstSchool, secondSchool) =>
        (secondSchool.sentiment_index || 0) - (firstSchool.sentiment_index || 0),
    )[0];
    const needsAttention = [...schools].sort(
      (firstSchool, secondSchool) =>
        (secondSchool.negative_percent || 0) - (firstSchool.negative_percent || 0),
    )[0];

    return {
      totalItems,
      averageSentiment,
      strongestSchool,
      needsAttention,
    };
  }, [schools]);
  const sortedUniversities = useMemo(() => {
    const normalizedSearch = universitySearch.trim().toLowerCase();
    const matchingSchools = schools.filter((school) =>
      school.name.toLowerCase().includes(normalizedSearch),
    );

    return sortPrimaryUniversityFirst(matchingSchools).sort((firstSchool, secondSchool) => {
      const firstIsPrimary = isPrimaryUniversity(firstSchool.name);
      const secondIsPrimary = isPrimaryUniversity(secondSchool.name);

      if (firstIsPrimary !== secondIsPrimary) {
        return firstIsPrimary ? -1 : 1;
      }

      if (universitySort === "name") {
        return firstSchool.name.localeCompare(secondSchool.name);
      }

      if (universitySort === "items") {
        return (secondSchool.items || 0) - (firstSchool.items || 0);
      }

      if (universitySort === "negative") {
        return (secondSchool.negative_percent || 0) - (firstSchool.negative_percent || 0);
      }

      return (secondSchool.sentiment_index || 0) - (firstSchool.sentiment_index || 0);
    });
  }, [schools, universitySearch, universitySort]);
  const filteredUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();

    return users.filter((appUser) =>
      [appUser.name, appUser.email, appUser.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [userSearch, users]);
  const filteredManagedTopics = useMemo(() => {
    const normalizedSearch = topicSearch.trim().toLowerCase();

    return topics.filter((topic) =>
      [topic.name, topic.keywords]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [topicSearch, topics]);
  const comparedSchools = useMemo(
    () =>
      sortPrimaryUniversityFirst(schools).sort(
        (firstSchool, secondSchool) =>
          isPrimaryUniversity(firstSchool.name) !== isPrimaryUniversity(secondSchool.name)
            ? isPrimaryUniversity(firstSchool.name)
              ? -1
              : 1
            :
          (secondSchool.sentiment_index || 0) - (firstSchool.sentiment_index || 0),
      ),
    [schools],
  );
  const compareLeaders = useMemo(() => {
    const strongest = [...schools].sort(
      (firstSchool, secondSchool) =>
        (secondSchool.sentiment_index || 0) - (firstSchool.sentiment_index || 0),
    )[0];
    const weakest = [...schools].sort(
      (firstSchool, secondSchool) =>
        (firstSchool.sentiment_index || 0) - (secondSchool.sentiment_index || 0),
    )[0];
    const mostNegative = [...schools].sort(
      (firstSchool, secondSchool) =>
        (secondSchool.negative_percent || 0) - (firstSchool.negative_percent || 0),
    )[0];
    const mostDiscussed = [...schools].sort(
      (firstSchool, secondSchool) => (secondSchool.items || 0) - (firstSchool.items || 0),
    )[0];

    return { strongest, weakest, mostNegative, mostDiscussed };
  }, [schools]);
  const eventItems = useMemo(
    () =>
      recentItems
        .filter((item) => item.is_event)
        .sort((firstItem, secondItem) => {
          const firstDate = new Date(firstItem.post_date || firstItem.classified_at || 0).getTime();
          const secondDate = new Date(secondItem.post_date || secondItem.classified_at || 0).getTime();

          return secondDate - firstDate;
        }),
    [recentItems],
  );
  const filteredEventItems = useMemo(
    () => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const timeframeDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
      }[eventTimeframe];

      return eventItems.filter((item) => {
        const matchesUniversity =
          eventUniversityFilter === "all" ||
          String(item.university_id) === String(eventUniversityFilter);
        const value = item.post_date || item.classified_at;
        const itemTime = value ? new Date(value).getTime() : null;
        const matchesTimeframe =
          !timeframeDays || (itemTime !== null && now - itemTime <= timeframeDays * dayMs);

        return matchesUniversity && matchesTimeframe;
      });
    },
    [eventItems, eventTimeframe, eventUniversityFilter],
  );
  const eventStats = useMemo(() => {
    const byUniversity = new Map();
    const byTopic = new Map();
    const sentimentCounts = new Map();

    filteredEventItems.forEach((item) => {
      const university = item.university || "Unknown";
      const topic = formatTopicName(item.topic);
      const label = item.label || "unknown";

      byUniversity.set(university, (byUniversity.get(university) || 0) + 1);
      byTopic.set(topic, (byTopic.get(topic) || 0) + 1);
      sentimentCounts.set(label, (sentimentCounts.get(label) || 0) + 1);
    });

    const topUniversity = [...byUniversity.entries()].sort((a, b) => b[1] - a[1])[0];
    const topTopic = [...byTopic.entries()].sort((a, b) => b[1] - a[1])[0];
    const dominantSentiment = [...sentimentCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      total: filteredEventItems.length,
      topUniversity,
      topTopic,
      dominantSentiment,
    };
  }, [filteredEventItems]);
  const eventLineData = useMemo(() => {
    const buckets = new Map();

    filteredEventItems.forEach((item) => {
      const value = item.post_date || item.classified_at;
      const date = value ? new Date(value) : new Date(0);
      const key = date.toISOString().slice(0, 10);
      const bucket = buckets.get(key) || {
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      const label = item.label || "neutral";

      if (label === "positive") {
        bucket.positive += 1;
      } else if (label === "negative") {
        bucket.negative += 1;
      } else {
        bucket.neutral += 1;
      }

      buckets.set(key, bucket);
    });

    const sortedBuckets = [...buckets.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([, bucket]) => bucket);

    return {
      labels: sortedBuckets.map((bucket) => bucket.label),
      datasets: [
        {
          label: "Positive",
          data: sortedBuckets.map((bucket) => bucket.positive),
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.14)",
          pointBackgroundColor: "#16a34a",
          fill: true,
        },
        {
          label: "Neutral",
          data: sortedBuckets.map((bucket) => bucket.neutral),
          borderColor: "#facc15",
          backgroundColor: "rgba(250, 204, 21, 0.16)",
          pointBackgroundColor: "#facc15",
        },
        {
          label: "Negative",
          data: sortedBuckets.map((bucket) => bucket.negative),
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.1)",
          pointBackgroundColor: "#dc2626",
        },
      ].map((dataset) => ({
        ...dataset,
        borderWidth: 2,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.35,
      })),
    };
  }, [filteredEventItems]);
  const eventLineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: "#66736a",
            font: {
              size: 11,
              family: "inherit",
            },
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y} events`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#17231c",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#66736a",
            precision: 0,
          },
          grid: {
            color: "#edf1ed",
          },
        },
      },
    }),
    [],
  );
  const eventTotalPages = Math.max(
    1,
    Math.ceil(filteredEventItems.length / EVENT_PAGE_SIZE),
  );
  const activeEventPage = Math.min(eventPage, eventTotalPages);
  const paginatedEventItems = filteredEventItems.slice(
    (activeEventPage - 1) * EVENT_PAGE_SIZE,
    activeEventPage * EVENT_PAGE_SIZE,
  );
  const compareChartData = useMemo(() => {
    const topicTotals = new Map();

    schools.forEach((school) => {
      (school.topics || []).forEach((topic) => {
        topicTotals.set(topic.topic, (topicTotals.get(topic.topic) || 0) + (topic.items || 0));
      });
    });

    const labels = [...topicTotals.entries()]
      .sort((firstTopic, secondTopic) => secondTopic[1] - firstTopic[1])
      .slice(0, 8)
      .map(([topic]) => formatTopicName(topic));
    const rawTopicNames = [...topicTotals.entries()]
      .sort((firstTopic, secondTopic) => secondTopic[1] - firstTopic[1])
      .slice(0, 8)
      .map(([topic]) => topic);
    const colors = ["#054425", "#111111", "#facc15", "#2563eb", "#7c3aed", "#0891b2", "#b47a1f"];

    return {
      labels,
      datasets: comparedSchools.map((school, index) => ({
        label: school.name,
        data: rawTopicNames.map((topicName) => {
          const topic = (school.topics || []).find((item) => item.topic === topicName);
          return topic?.positive_percent || 0;
        }),
        backgroundColor: colors[index % colors.length],
        barPercentage: 1,
        categoryPercentage: 0.72,
        borderWidth: 0,
        borderRadius: 0,
        borderSkipped: false,
        inflateAmount: "auto",
      })),
    };
  }, [comparedSchools, schools]);
  const compareChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: "#66736a",
            font: {
              size: 11,
              family: "inherit",
            },
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}% positive`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Topics",
            color: "#66736a",
          },
          ticks: {
            color: "#17231c",
            maxRotation: 35,
            minRotation: 0,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Positive sentiment (%)",
            color: "#66736a",
          },
          ticks: {
            color: "#66736a",
            callback: (value) => `${value}%`,
          },
          grid: {
            color: "#edf1ed",
          },
        },
      },
    }),
    [],
  );
  const sentimentFilterOptions = useMemo(() => {
    const topics = [...new Set(recentItems.map((item) => item.topic).filter(Boolean))].sort();
    const sources = [...new Set(recentItems.map((item) => item.source || item.source_type).filter(Boolean))].sort(
      (firstSource, secondSource) => formatSourceName(firstSource).localeCompare(formatSourceName(secondSource)),
    );

    return { topics, sources };
  }, [recentItems]);
  const filteredSentimentItems = useMemo(() => {
    const normalizedSearch = sentimentSearch.trim().toLowerCase();

    return recentItems.filter((item) => {
      const itemUniversityId = String(item.university_id);
      const itemLabel = item.label || "";
      const itemTopic = item.topic || "";
      const itemSource = item.source || item.source_type || "";
      const searchableText = [
        item.summary,
        item.content,
        item.author,
        item.university,
        item.topic,
        item.source,
        item.source_type,
        item.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (sentimentUniversityFilter === "all" || itemUniversityId === sentimentUniversityFilter) &&
        (sentimentLabelFilter === "all" || itemLabel === sentimentLabelFilter) &&
        (sentimentTopicFilter === "all" || itemTopic === sentimentTopicFilter) &&
        (sentimentSourceFilter === "all" || itemSource === sentimentSourceFilter) &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [
    recentItems,
    sentimentLabelFilter,
    sentimentSearch,
    sentimentSourceFilter,
    sentimentTopicFilter,
    sentimentUniversityFilter,
  ]);
  const sentimentTotalPages = Math.max(
    1,
    Math.ceil(filteredSentimentItems.length / SENTIMENT_PAGE_SIZE),
  );
  const activeSentimentPage = Math.min(sentimentPage, sentimentTotalPages);
  const paginatedSentimentItems = filteredSentimentItems.slice(
    (activeSentimentPage - 1) * SENTIMENT_PAGE_SIZE,
    activeSentimentPage * SENTIMENT_PAGE_SIZE,
  );
  const sentimentPageStart = filteredSentimentItems.length
    ? (activeSentimentPage - 1) * SENTIMENT_PAGE_SIZE + 1
    : 0;
  const sentimentPageEnd = Math.min(
    activeSentimentPage * SENTIMENT_PAGE_SIZE,
    filteredSentimentItems.length,
  );
  const updateSentimentFilter = (setter, value) => {
    setter(value);
    setSentimentPage(1);
  };
  const filteredReportItems = useMemo(() => {
    const startTime = reportStartDate ? new Date(`${reportStartDate}T00:00:00`).getTime() : null;
    const endTime = reportEndDate ? new Date(`${reportEndDate}T23:59:59`).getTime() : null;

    return recentItems.filter((item) => {
      const itemUniversityId = String(item.university_id);
      const itemLabel = item.label || "";
      const itemTopic = item.topic || "";
      const itemSource = item.source || item.source_type || "";
      const itemDateValue = item.post_date || item.classified_at;
      const itemTime = itemDateValue ? new Date(itemDateValue).getTime() : null;

      return (
        (reportUniversityFilter === "all" || itemUniversityId === reportUniversityFilter) &&
        (reportLabelFilter === "all" || itemLabel === reportLabelFilter) &&
        (reportTopicFilter === "all" || itemTopic === reportTopicFilter) &&
        (reportSourceFilter === "all" || itemSource === reportSourceFilter) &&
        (startTime === null || (itemTime !== null && itemTime >= startTime)) &&
        (endTime === null || (itemTime !== null && itemTime <= endTime))
      );
    });
  }, [
    recentItems,
    reportEndDate,
    reportLabelFilter,
    reportSourceFilter,
    reportStartDate,
    reportTopicFilter,
    reportUniversityFilter,
  ]);
  const updateReportFilter = (setter, value) => {
    setter(value);
  };
  const buildReportRows = () => [
    ["University", "Topic", "Sentiment", "Source", "Date", "Author", "Summary"],
    ...filteredReportItems.map((item) => [
      item.university || "Unknown",
      formatTopicName(item.topic),
      item.label || "Unknown",
      formatSourceName(item.source || item.source_type),
      formatDetailDate(item.post_date || item.classified_at),
      item.author || "Unknown",
      item.summary || item.content || "",
    ]),
  ];
  const escapeCsvValue = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };
  const escapeHtmlValue = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const buildReportHtml = () => {
    const rows = buildReportRows();
    const headerCells = rows[0]
      .map((cell) => `<th>${escapeHtmlValue(cell)}</th>`)
      .join("");
    const bodyRows = rows
      .slice(1)
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtmlValue(cell)}</td>`).join("")}</tr>`,
      )
      .join("");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>UniPulse Report</title>
    <style>
      body { font-family: Arial, sans-serif; color: #17231c; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      p { color: #5f6f66; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d8e0da; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #054425; color: #ffffff; }
    </style>
  </head>
  <body>
    <h1>UniPulse Report</h1>
    <p>Generated ${new Date().toLocaleString()} - ${filteredReportItems.length} records</p>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;
  };
  const downloadBlob = (content, type, fileName) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };
  const downloadReport = () => {
    if (!filteredReportItems.length) {
      setError("No report data matches the selected filters.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (reportFormat === "word") {
      downloadBlob(
        buildReportHtml(),
        "application/msword;charset=utf-8;",
        `unipulse-report-${today}.doc`,
      );
      setNotice("Word report downloaded successfully.");
      return;
    }

    if (reportFormat === "pdf") {
      const pdfHtml = buildReportHtml().replace(
        "</body>",
        "<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });</script></body>",
      );
      const pdfBlob = new Blob([pdfHtml], { type: "text/html;charset=utf-8;" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, "_blank");

      if (!printWindow) {
        URL.revokeObjectURL(pdfUrl);
        setError("Allow pop-ups to generate the PDF report.");
        return;
      }

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      setNotice("PDF report opened. Choose Save as PDF in the print dialog.");
      return;
    }

    const csvContent = buildReportRows().map((row) => row.map(escapeCsvValue).join(",")).join("\n");
    downloadBlob(csvContent, "text/csv;charset=utf-8;", `unipulse-report-${today}.csv`);
    setNotice("CSV report downloaded successfully.");
  };

  const schoolAccents = ["violet", "green", "gold"];
  const formattedTopTopics = useMemo(
    () =>
      topTopics.length
        ? sortPrimaryUniversityFirst(topTopics, (topic) => topic.university).slice(0, topicDisplayLimit)
        : [{ university: "No data", topic: "Run topic classification", positive_percent: 0 }],
    [topTopics, topicDisplayLimit],
  );
  const formattedWeakTopics = useMemo(
    () =>
      weakTopics.length
        ? sortPrimaryUniversityFirst(weakTopics, (topic) => topic.university).slice(0, topicDisplayLimit)
        : [{ university: "No data", topic: "Run topic classification", positive_percent: 0, negative_percent: 0 }],
    [weakTopics, topicDisplayLimit],
  );
  const selectedTopicRecentItems = selectedTopicData?.recent_items ?? EMPTY_ARRAY;
  const filteredRecentItems = useMemo(() => {
    if (selectedTopicRecentItems.length) {
      return selectedTopicRecentItems;
    }

    return recentItems.filter((item) => {
      const sameSchool = String(item.university_id) === String(primarySchool?.id);
      const sameTopic = item.topic === activeTopic;

      return sameSchool && sameTopic;
    });
  }, [activeTopic, primarySchool, recentItems, selectedTopicRecentItems]);
  const visibleRecentItems = showAllRecent ? filteredRecentItems : filteredRecentItems.slice(0, 5);

  useEffect(() => {
    if (!primarySchool || !activeTopic) {
      return;
    }

    console.log("[UniPulse selected topic]", {
      university: primarySchool.name,
      selectedTopic: activeTopic,
      selectedTopicData,
      topicRecentItems: selectedTopicRecentItems,
      dashboardRecentItems: recentItems,
      filteredRecentItems,
    });
  }, [activeTopic, primarySchool, selectedTopicData, selectedTopicRecentItems, recentItems, filteredRecentItems]);
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
  const trendChartData = useMemo(
    () => ({
      labels: trendData.map((point) => point.day),
      datasets: [
        {
          label: "Positive",
          data: trendData.map((point) => point.positive_percent || 0),
          borderColor: "#054425",
          backgroundColor: "rgba(5, 68, 37, 0.14)",
          pointBackgroundColor: "#054425",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: true,
        },
        {
          label: "Negative",
          data: trendData.map((point) => point.negative_percent || 0),
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.1)",
          pointBackgroundColor: "#dc2626",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.35,
        },
        {
          label: "Neutral",
          data: trendData.map((point) => point.neutral_percent || 0),
          borderColor: "#facc15",
          backgroundColor: "rgba(250, 204, 21, 0.16)",
          pointBackgroundColor: "#facc15",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.35,
        },
      ],
    }),
    [trendData],
  );
  const trendChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: "#66736a",
            font: {
              size: 12,
              family: "inherit",
            },
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}%`,
            afterBody: (items) => {
              const point = trendData[items[0]?.dataIndex];
              return point?.items ? `${point.items} analysed items` : "";
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#66736a",
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Share of sentiment (%)",
            color: "#66736a",
          },
          ticks: {
            color: "#66736a",
            callback: (value) => `${value}%`,
          },
          grid: {
            color: "#edf1ed",
          },
        },
      },
    }),
    [trendData],
  );
  const mixChartData = useMemo(
    () => ({
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          data: [
            selectedTopicData?.positive_percent || 0,
            selectedTopicData?.negative_percent || 0,
            selectedTopicData?.neutral_percent || 0,
          ],
          backgroundColor: ["#054425", "#dc2626", "#facc15"],
          borderColor: "#ffffff",
          borderWidth: 4,
          hoverOffset: 6,
        },
      ],
    }),
    [selectedTopicData],
  );
  const mixChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: "#66736a",
            font: {
              size: 12,
              family: "inherit",
            },
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}%`,
          },
        },
      },
    }),
    [],
  );
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
  const removePostFromDashboard = (postId, universityId = selectedDetailItem?.university_id) => {
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
            String(school.id) === String(universityId)
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
      removePostFromDashboard(selectedDetailItem.post_id, selectedDetailItem.university_id);
      setSelectedDetailItem(null);
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete the selected item.");
    } finally {
      setIsDeletingItem(false);
    }
  };
  const handleDeleteEvent = async (item) => {
    const shouldDelete = window.confirm(`Delete this event from ${item.university || "this university"}?`);

    if (!shouldDelete) {
      return;
    }

    setIsDeletingItem(true);
    setError("");
    setNotice("");

    try {
      await dashboardApi.deletePost(item.post_id);
      removePostFromDashboard(item.post_id, item.university_id);
      setNotice("Event deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete the selected event.");
    } finally {
      setIsDeletingItem(false);
    }
  };
  const closeUniversityModal = (forceClose = false) => {
    if (forceClose || (!isSavingUniversity && !isDeletingUniversity)) {
      setUniversityModalMode(null);
      setSelectedUniversity(null);
      setUniversityForm({ name: "", keywords: "", active: true });
    }
  };
  const openAddUniversityModal = () => {
    setError("");
    setNotice("");
    setSelectedUniversity(null);
    setUniversityForm({ name: "", keywords: "", active: true });
    setUniversityModalMode("add");
  };
  const openUniversityModal = async (mode, school) => {
    setError("");
    setNotice("");
    setUniversityModalMode(mode);
    setSelectedUniversity(school);
    setUniversityForm({
      name: school.name || "",
      keywords: school.keywords || "",
      active: school.active ?? true,
    });
    setIsLoadingUniversity(true);

    try {
      const university = await universityApi.get(school.id);
      const mergedUniversity = {
        ...school,
        ...university,
      };

      setSelectedUniversity(mergedUniversity);
      setUniversityForm({
        name: university.name || "",
        keywords: university.keywords || "",
        active: university.active ?? true,
      });
    } catch (universityError) {
      setError(universityError.message || "Could not load university details.");
    } finally {
      setIsLoadingUniversity(false);
    }
  };
  const handleUniversityFormChange = (field, value) => {
    setUniversityForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };
  const handleSaveUniversity = async (event) => {
    event.preventDefault();

    const trimmedName = universityForm.name.trim();

    if (!trimmedName) {
      setError("University name is required.");
      return;
    }

    setError("");
    setNotice("");
    setIsSavingUniversity(true);

    try {
      if (universityModalMode === "add") {
        await universityApi.create({
          name: trimmedName,
          keywords: universityForm.keywords.trim(),
        });
        setNotice(`${trimmedName} was added successfully.`);
      } else if (selectedUniversity) {
        await universityApi.update(selectedUniversity.id, {
          name: trimmedName,
          keywords: universityForm.keywords.trim(),
        });

        if ((selectedUniversity.active ?? true) !== universityForm.active) {
          await universityApi.toggle(selectedUniversity.id);
        }
        setNotice(`${trimmedName} was updated successfully.`);
      }

      await refreshDashboard();
      closeUniversityModal(true);
      setActivePage("universities");
    } catch (universityError) {
      setError(universityError.message || "Could not save university.");
    } finally {
      setIsSavingUniversity(false);
    }
  };
  const handleDeleteUniversity = async (school) => {
    const shouldDelete = window.confirm(`Delete ${school.name}?`);

    if (!shouldDelete) {
      return;
    }

    setIsDeletingUniversity(true);
    setError("");
    setNotice("");

    try {
      await universityApi.delete(school.id);
      await refreshDashboard();
      closeUniversityModal(true);
      setActivePage("universities");
      setNotice(`${school.name} was deleted successfully.`);
    } catch (universityError) {
      setError(universityError.message || "Could not delete university.");
    } finally {
      setIsDeletingUniversity(false);
    }
  };
  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "analyst",
    });
  };
  const openUserModal = () => {
    setError("");
    setNotice("");
    setSelectedUser(null);
    setUserModalMode("create");
    resetUserForm();
    setIsUserModalOpen(true);
  };
  const openViewUserModal = (targetUser) => {
    setError("");
    setNotice("");
    setSelectedUser(targetUser);
    setUserModalMode("view");
    setUserForm({
      name: targetUser.name,
      email: targetUser.email,
      password: "",
      role: targetUser.role,
    });
    setIsUserModalOpen(true);
  };
  const openEditUserModal = (targetUser) => {
    setError("");
    setNotice("");
    setSelectedUser(targetUser);
    setUserModalMode("edit");
    setUserForm({
      name: targetUser.name,
      email: targetUser.email,
      password: "",
      role: targetUser.role,
    });
    setIsUserModalOpen(true);
  };
  const closeUserModal = () => {
    if (!isSavingUser) {
      setIsUserModalOpen(false);
      setSelectedUser(null);
      setUserModalMode("create");
      resetUserForm();
    }
  };
  const handleUserFormChange = (field, value) => {
    setUserForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };
  const handleSubmitUser = async (event) => {
    event.preventDefault();

    const name = userForm.name.trim();
    const email = userForm.email.trim();

    if (!name || !email || !userForm.role) {
      setError("Name, email, and role are required.");
      return;
    }

    setIsSavingUser(true);
    setError("");
    setNotice("");

    try {
      if (userModalMode === "edit" && selectedUser) {
        const updatedUser = await userApi.update(selectedUser.id, {
          name,
          email,
          role: userForm.role,
        });
        setUsers((currentUsers) =>
          currentUsers.map((appUser) =>
            appUser.id === selectedUser.id
              ? {
                  ...appUser,
                  name: updatedUser.name,
                  email: updatedUser.email,
                  role: updatedUser.role,
                }
              : appUser,
          ),
        );
        if (selectedUser.id === user?.id) {
          onUserChange?.({
            ...user,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
          });
        }
        setNotice(`${name} was updated successfully.`);
      } else {
        const createdUser = await userApi.create({
          name,
          email,
          role: userForm.role,
        });
        const data = await userApi.list();
        setUsers(data);
        setNotice(
          createdUser.email_sent
            ? `${name} was invited successfully.`
            : `${name} was created. Email is not configured, so the setup link was printed in the backend terminal.`,
        );
      }
      closeUserModal();
    } catch (userError) {
      setError(userError.message || "Could not save user.");
    } finally {
      setIsSavingUser(false);
    }
  };
  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user?.id) {
      setError("You cannot delete your own account while signed in.");
      return;
    }

    const shouldDelete = window.confirm(`Delete ${targetUser.name}?`);

    if (!shouldDelete) {
      return;
    }

    setIsDeletingUser(true);
    setError("");
    setNotice("");

    try {
      await userApi.delete(targetUser.id);
      setUsers((currentUsers) => currentUsers.filter((appUser) => appUser.id !== targetUser.id));
      setNotice(`${targetUser.name} was deleted successfully.`);
    } catch (userError) {
      setError(userError.message || "Could not delete user.");
    } finally {
      setIsDeletingUser(false);
    }
  };
  const isViewingUser = userModalMode === "view";
  const userModalTitle =
    userModalMode === "edit" ? "Edit User" : userModalMode === "view" ? "User Details" : "Add User";
  const userModalSubmitLabel = isSavingUser ? "Saving..." : userModalMode === "edit" ? "Save" : "Add";
  const resetTopicForm = () => {
    setTopicForm({
      name: "",
      keywords: "",
    });
  };
  const openTopicModal = () => {
    setError("");
    setNotice("");
    setSelectedManagedTopic(null);
    setTopicModalMode("create");
    resetTopicForm();
    setIsTopicModalOpen(true);
  };
  const openViewTopicModal = (targetTopic) => {
    setError("");
    setNotice("");
    setSelectedManagedTopic(targetTopic);
    setTopicModalMode("view");
    setTopicForm({
      name: targetTopic.name,
      keywords: targetTopic.keywords || "",
    });
    setIsTopicModalOpen(true);
  };
  const openEditTopicModal = (targetTopic) => {
    setError("");
    setNotice("");
    setSelectedManagedTopic(targetTopic);
    setTopicModalMode("edit");
    setTopicForm({
      name: targetTopic.name,
      keywords: targetTopic.keywords || "",
    });
    setIsTopicModalOpen(true);
  };
  const closeTopicModal = () => {
    if (!isSavingTopic) {
      setIsTopicModalOpen(false);
      setSelectedManagedTopic(null);
      setTopicModalMode("create");
      resetTopicForm();
    }
  };
  const handleTopicFormChange = (field, value) => {
    setTopicForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };
  const handleSubmitTopic = async (event) => {
    event.preventDefault();

    const name = topicForm.name.trim();
    const keywords = topicForm.keywords.trim();

    if (!name || !keywords) {
      setError("Topic name and keywords are required.");
      return;
    }

    setIsSavingTopic(true);
    setError("");
    setNotice("");

    try {
      if (topicModalMode === "edit" && selectedManagedTopic) {
        await topicApi.update(selectedManagedTopic.id, { name, keywords });
        setTopics((currentTopics) =>
          currentTopics.map((topic) =>
            topic.id === selectedManagedTopic.id ? { ...topic, name, keywords } : topic,
          ),
        );
        setNotice(`${name} was updated successfully.`);
      } else {
        await topicApi.create({ name, keywords });
        const data = await topicApi.list();
        setTopics(data);
        setNotice(`${name} was created successfully.`);
      }
      closeTopicModal();
    } catch (topicError) {
      setError(topicError.message || "Could not save topic.");
    } finally {
      setIsSavingTopic(false);
    }
  };
  const handleDeleteTopic = async (targetTopic) => {
    const shouldDelete = window.confirm(`Delete ${targetTopic.name}?`);

    if (!shouldDelete) {
      return;
    }

    setIsDeletingTopic(true);
    setError("");
    setNotice("");

    try {
      await topicApi.delete(targetTopic.id);
      setTopics((currentTopics) => currentTopics.filter((topic) => topic.id !== targetTopic.id));
      setNotice(`${targetTopic.name} was deleted successfully.`);
    } catch (topicError) {
      setError(topicError.message || "Could not delete topic.");
    } finally {
      setIsDeletingTopic(false);
    }
  };
  const isViewingTopic = topicModalMode === "view";
  const topicModalTitle =
    topicModalMode === "edit" ? "Edit Topic" : topicModalMode === "view" ? "Topic Details" : "Add Topic";
  const topicModalSubmitLabel = isSavingTopic ? "Saving..." : topicModalMode === "edit" ? "Save" : "Add";

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="UniPulse" />
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {visibleNavGroups.map((group) => (
            <section key={group.label} className="nav-group">
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.page === activePage || (!item.page && item.active);
                return (
                  <button
                    className={`nav-item ${isActive ? "is-active" : ""}`}
                    key={item.label}
                    onClick={() => {
                      if (item.page) {
                        setActivePage(item.page);
                      }
                    }}
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
            <p>
              {activePage === "universities"
                ? "Institution directory"
                : activePage === "sentiment"
                  ? "Analysed posts"
                : activePage === "compare"
                  ? "University comparison"
                : activePage === "events"
                  ? "Flagged activities"
                : activePage === "reports"
                  ? "Export reports"
                  : activePage === "topics"
                    ? "Topic administration"
                  : activePage === "users"
                    ? "User administration"
                  : "All institutions"}
            </p>
            <h1>
              {activePage === "universities"
                ? "Universities"
                : activePage === "sentiment"
                  ? "Sentiment"
                : activePage === "compare"
                  ? "Compare"
                : activePage === "events"
                  ? "Events"
                : activePage === "reports"
                  ? "Reports"
                  : activePage === "topics"
                    ? "Topics"
                  : activePage === "users"
                    ? "Users"
                  : "University sentiment overview"}
            </h1>
            <span>
              {activePage === "universities"
                ? `${sortedUniversities.length} universities listed - ${universityStats.totalItems} analysed items`
                : activePage === "sentiment"
                  ? `${filteredSentimentItems.length} analysed posts found`
                : activePage === "compare"
                  ? "Compare sentiment, volume, and topics between universities"
                : activePage === "events"
                  ? `${filteredEventItems.length} event-related records found`
                : activePage === "reports"
                  ? `${filteredReportItems.length} records ready for export`
                  : activePage === "topics"
                    ? `${filteredManagedTopics.length} topics listed`
                  : activePage === "users"
                    ? `${filteredUsers.length} users listed`
                  : `Showing ${dashboard?.totals?.active_universities || 0} active universities - ${
                    dashboard?.totals?.sentiment_results || 0
                  } analysed items`}
            </span>
          </div>

          <div className="header-actions">
            <div className="admin-chip">
              <span>{user?.name || "Admin"}</span>
              <strong>{user?.role || "admin"}</strong>
            </div>
            {activePage === "universities" && isAdmin && (
              <button type="button" className="add-school-button" onClick={openAddUniversityModal}>
                <Plus size={16} />
                <span>Add school</span>
              </button>
            )}
            {activePage === "users" && isAdmin && (
              <button type="button" className="add-school-button" onClick={openUserModal}>
                <Plus size={16} />
                <span>Add user</span>
              </button>
            )}
            {activePage === "topics" && isAdmin && (
              <button type="button" className="add-school-button" onClick={openTopicModal}>
                <Plus size={16} />
                <span>Add topic</span>
              </button>
            )}
          </div>
        </header>

        {(error || notice) && (
          <div
            className={`dashboard-toast ${error ? "is-error" : "is-success"}`}
            key={`${error ? "error" : "success"}-${error || notice}`}
            role="status"
            aria-live="polite"
          >
            <span className="toast-timer-icon">
              {error ? <X size={15} /> : <Check size={15} />}
            </span>
            <p>{error || notice}</p>
          </div>
        )}
        {isLoading && <p className="dashboard-loading">Loading dashboard data...</p>}

        {activePage === "overview" && (
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
        )}

        {activePage === "universities" && (
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
        )}

        {activePage === "sentiment" && (
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
        )}

        {activePage === "compare" && (
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
        )}

        {activePage === "events" && (
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
        )}

        {activePage === "reports" && (
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
        )}

        {activePage === "topics" && (
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
        )}

        {activePage === "users" && (
          <section className="users-page" aria-label="Users">
            {!isAdmin ? (
              <p className="empty-recent">Only administrators can manage users.</p>
            ) : (
              <>
                <section className="users-toolbar">
                  <label className="university-search">
                    <Search size={16} />
                    <input
                      type="search"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search users by name, email, or role"
                    />
                  </label>
                </section>

                <section className="universities-table-panel">
                  <div className="universities-table-header">
                    <div>
                      <h2>User accounts</h2>
                      <p>{isLoadingUsers ? "Loading users..." : `${filteredUsers.length} users found`}</p>
                    </div>
                  </div>

                  <div className="universities-table-wrap">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th className="actions-heading">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((appUser) => (
                          <tr key={appUser.id}>
                            <td>{appUser.name}</td>
                            <td>{appUser.email}</td>
                            <td className="user-role-cell">{appUser.role}</td>
                            <td className="universities-actions-cell">
                              <div className="universities-actions">
                                <button
                                  type="button"
                                  aria-label={`View ${appUser.name}`}
                                  title="View"
                                  onClick={() => openViewUserModal(appUser)}
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Edit ${appUser.name}`}
                                  title="Edit"
                                  onClick={() => openEditUserModal(appUser)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="is-danger"
                                  aria-label={`Delete ${appUser.name}`}
                                  title="Delete"
                                  onClick={() => handleDeleteUser(appUser)}
                                  disabled={isDeletingUser || appUser.id === user?.id}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!filteredUsers.length && !isLoadingUsers && (
                    <p className="empty-recent">No users match your search.</p>
                  )}
                </section>
              </>
            )}
          </section>
        )}

        {isTopicModalOpen && (
          <div className="detail-modal-backdrop" role="presentation" onMouseDown={closeTopicModal}>
            <section
              className="detail-modal university-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="topic-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="detail-modal-header">
                <h2 id="topic-modal-title">{topicModalTitle}</h2>
                <button type="button" onClick={closeTopicModal} aria-label="Close details">
                  <X size={20} />
                </button>
              </header>

              <form onSubmit={handleSubmitTopic}>
                <div className="detail-modal-body">
                  <label className="university-form-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={topicForm.name}
                      onChange={(event) => handleTopicFormChange("name", event.target.value)}
                      disabled={isSavingTopic || isViewingTopic}
                    />
                  </label>
                  <label className="university-form-field">
                    <span>Keywords</span>
                    <textarea
                      value={topicForm.keywords}
                      onChange={(event) => handleTopicFormChange("keywords", event.target.value)}
                      disabled={isSavingTopic || isViewingTopic}
                      placeholder="tuition, school fees, cost"
                    />
                  </label>
                </div>

                <footer className="detail-modal-actions">
                  <button
                    type="button"
                    className="cancel-detail-button"
                    onClick={closeTopicModal}
                    disabled={isSavingTopic}
                  >
                    {isViewingTopic ? "Close" : "Cancel"}
                  </button>
                  {!isViewingTopic && (
                    <button type="submit" className="edit-university-button" disabled={isSavingTopic}>
                      {topicModalSubmitLabel}
                    </button>
                  )}
                </footer>
              </form>
            </section>
          </div>
        )}

        {isUserModalOpen && (
          <div className="detail-modal-backdrop" role="presentation" onMouseDown={closeUserModal}>
            <section
              className="detail-modal university-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="detail-modal-header">
                <h2 id="user-modal-title">{userModalTitle}</h2>
                <button type="button" onClick={closeUserModal} aria-label="Close details">
                  <X size={20} />
                </button>
              </header>

              <form onSubmit={handleSubmitUser}>
                <div className="detail-modal-body">
                  <label className="university-form-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(event) => handleUserFormChange("name", event.target.value)}
                      disabled={isSavingUser || isViewingUser}
                    />
                  </label>
                  <label className="university-form-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(event) => handleUserFormChange("email", event.target.value)}
                      disabled={isSavingUser || isViewingUser}
                    />
                  </label>
                  <label className="university-form-field">
                    <span>Role</span>
                    <select
                      value={userForm.role}
                      onChange={(event) => handleUserFormChange("role", event.target.value)}
                      disabled={isSavingUser || isViewingUser}
                    >
                      <option value="admin">Admin</option>
                      <option value="analyst">Analyst</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </label>
                </div>

                <footer className="detail-modal-actions">
                  <button
                    type="button"
                    className="cancel-detail-button"
                    onClick={closeUserModal}
                    disabled={isSavingUser}
                  >
                    {isViewingUser ? "Close" : "Cancel"}
                  </button>
                  {!isViewingUser && (
                    <button type="submit" className="edit-university-button" disabled={isSavingUser}>
                      {userModalSubmitLabel}
                    </button>
                  )}
                </footer>
              </form>
            </section>
          </div>
        )}

        {universityModalMode && (
          <div
            className="detail-modal-backdrop"
            role="presentation"
            onMouseDown={() => closeUniversityModal()}
          >
            <section
              className="detail-modal university-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="university-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="detail-modal-header">
                <h2 id="university-modal-title">
                  {universityModalMode === "add"
                    ? "Add University"
                    : universityModalMode === "edit"
                      ? "Edit University"
                      : "University Detail"}
                </h2>
                <button type="button" onClick={() => closeUniversityModal()} aria-label="Close details">
                  <X size={20} />
                </button>
              </header>

              {universityModalMode === "view" ? (
                <>
                  <div className="detail-modal-body">
                    {isLoadingUniversity && <p className="dashboard-loading">Loading university...</p>}
                    <div className="detail-row">
                      <span>Name</span>
                      <p>{selectedUniversity?.name || "Not available"}</p>
                    </div>
                    <div className="detail-row">
                      <span>Keywords</span>
                      <p>{selectedUniversity?.keywords || "Not available"}</p>
                    </div>
                    <div className="detail-row">
                      <span>Status</span>
                      <p>{selectedUniversity?.active === false ? "Inactive" : "Active"}</p>
                    </div>
                    <div className="detail-row">
                      <span>Analysed items</span>
                      <p>{selectedUniversity?.items || 0}</p>
                    </div>
                    <div className="detail-row">
                      <span>Sentiment index</span>
                      <p>{Math.round(selectedUniversity?.sentiment_index || 0)}</p>
                    </div>
                    <div className="detail-row">
                      <span>Positive</span>
                      <p>{selectedUniversity?.positive_percent || 0}%</p>
                    </div>
                    <div className="detail-row">
                      <span>Negative</span>
                      <p>{selectedUniversity?.negative_percent || 0}%</p>
                    </div>
                    <div className="detail-row">
                      <span>Neutral</span>
                      <p>{selectedUniversity?.neutral_percent || 0}%</p>
                    </div>
                  </div>

                  <footer className="detail-modal-actions">
                    <button
                      type="button"
                      className="cancel-detail-button"
                      onClick={() => closeUniversityModal()}
                    >
                      Close
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="edit-university-button"
                        onClick={() => setUniversityModalMode("edit")}
                      >
                        Edit
                      </button>
                    )}
                  </footer>
                </>
              ) : (
                <form onSubmit={handleSaveUniversity}>
                  <div className="detail-modal-body">
                    <label className="university-form-field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={universityForm.name}
                        onChange={(event) => handleUniversityFormChange("name", event.target.value)}
                        disabled={isSavingUniversity}
                      />
                    </label>

                    <label className="university-form-field">
                      <span>Keywords</span>
                      <textarea
                        value={universityForm.keywords}
                        onChange={(event) => handleUniversityFormChange("keywords", event.target.value)}
                        disabled={isSavingUniversity}
                      />
                    </label>

                    {universityModalMode === "edit" && (
                      <label className="university-status-toggle">
                        <input
                          type="checkbox"
                          checked={universityForm.active}
                          onChange={(event) =>
                            handleUniversityFormChange("active", event.target.checked)
                          }
                          disabled={isSavingUniversity}
                        />
                        <span>Active</span>
                      </label>
                    )}
                  </div>

                  <footer className="detail-modal-actions">
                    <button
                      type="button"
                      className="cancel-detail-button"
                      onClick={() => closeUniversityModal()}
                      disabled={isSavingUniversity}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="edit-university-button" disabled={isSavingUniversity}>
                      {isSavingUniversity
                        ? "Saving..."
                        : universityModalMode === "add"
                          ? "Add"
                          : "Save"}
                    </button>
                  </footer>
                </form>
              )}
            </section>
          </div>
        )}

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
                  <p>{formatSourceName(selectedDetailItem.source || selectedDetailItem.source_type)}</p>
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
                {isAdmin && (
                  <button
                    type="button"
                    className="delete-detail-button"
                    onClick={handleDeleteDetailItem}
                    disabled={isDeletingItem}
                  >
                    {isDeletingItem ? "Removing..." : "Delete"}
                  </button>
                )}
              </footer>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;
