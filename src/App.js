//V17.5 Fix Syntax Error & Social Features
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Shield,
  Activity,
  Users,
  Heart,
  Brain,
  Battery,
  Frown,
  HelpCircle,
  X,
  Check,
  Zap,
  MapPin,
  Bell,
  BarChart2,
  Clock,
  CalendarDays,
  ArrowRight,
  UserPlus,
  MessageCircle,
  Settings,
  Edit2,
  Lock,
  Search,
  Plus,
  ChevronRight,
  Phone,
  Globe,
  Star,
  Download,
  Trash2,
  LayoutGrid,
  ChevronDown,
  Moon,
  Sun,
  Coffee,
  Sparkles,
  List,
  Target,
  LogOut,
  Crown,
  Sliders,
  Timer,
  History,
  Home,
  Wifi,
  Signal,
  Menu,
  Play,
  User,
  Mail,
  ChevronLeft,
  Briefcase,
  Smile,
  Leaf,
  BookOpen,
  Utensils,
  Map,
  Music,
  Tv,
  Book,
  GripHorizontal,
  Laptop,
  Contact,
  EyeOff,
  Send,
  Eye,
  MoreHorizontal,
  UserMinus,
  Star as StarIcon,
  UserCheck,
  CloudRain,
  Flame,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Hourglass,
  Lightbulb,
  TrendingUp,
  Trophy,
  Video,
  Mic,
  Hash,
  Filter,
  LogIn,
  Loader,
  StickyNote,
  Pencil,
  RefreshCw,
  Key,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import { useStickyState } from "./hooks/useStickyState";
import { callGemini, GEMINI_API_KEY } from "./utils/gemini";
import { getIcon } from "./utils/icons";
import {
  emitJoinRequestUpdate,
  emitJoinApprovedUpdate,
  emitJoinDeclinedUpdate,
  emitEventUpdatedUpdate,
  emitEventCancelledUpdate,
  emitParticipantLeftUpdate,
  UPDATE_TYPES,
} from "./utils/eventUpdates";
import {
  getUnresolvedUpdates,
  getUnresolvedCount,
  resolveUpdate,
  resolveUpdatesByEvent,
  resolveUpdatesByEventAndType,
  formatRelativeTime,
} from "./utils/inbox";
import {
  getConversationId,
  loadPrivateConversations,
  savePrivateConversations,
  getOrCreateConversation,
  addMessageToConversation,
  getAllConversationsSorted,
  getConversation,
  getOtherParticipantId,
  migrateOldChatMessages,
  isConversationUnread,
  markConversationAsRead,
  getUnreadConversationCount,
} from "./utils/privateMessages";
import {
  addMinutes,
  formatQuickTaskDuration,
  formatSeconds,
  minsToTime,
  timeToMins,
} from "./utils/time";
import { getDistanceDisplay } from "./utils/location";
import ActivityCard from "./components/ActivityCard";
import ActivityDetailsModal from "./components/ActivityDetailsModal";
import AltSchedulerModal from "./components/AltSchedulerModal";
import PlanActivityModal from "./components/PlanActivityModal";
import {
  MY_UPCOMING_ACTIVITIES,
  FRIEND_SHARED_ACTIVITIES,
  PUBLIC_EVENTS,
  INCOMING_REQUESTS,
} from "./mockActivities";
import {
  CURRENT_USER_ID,
  loadCommunityState,
  persistCommunityState,
  createJoinRequestState,
  acceptJoinRequestState,
  declineJoinRequestState,
  cancelJoinRequestState,
  setCurrentActivityState,
} from "./mockApi";
import {
  VERSION_ID,
  USER_LOCATION,
  QUICK_TASK_WINDOW_MS,
  QUICK_TASK_TEST_DURATION_MINUTES,
  QUICK_TASK_DURATION_OPTIONS,
  QUICK_TASK_ALLOWED_DURATIONS,
  DEFAULT_MONITORED_APPS,
  DEFAULT_SETTINGS,
  DEFAULT_USER_ACCOUNT,
  DEFAULT_QUICK_TASK_DURATION,
  DEFAULT_QUICK_TASK_LIMIT,
} from "./constants/config";

const CAUSES = [
  { id: "boredom", label: "Boredom", icon: <HelpCircle size={20} /> },
  { id: "anxiety", label: "Anxiety", icon: <Activity size={20} /> },
  { id: "fatigue", label: "Fatigue", icon: <Battery size={20} /> },
  { id: "loneliness", label: "Loneliness", icon: <Users size={20} /> },
  { id: "doubt", label: "Self-Doubt", icon: <Frown size={20} /> },
  { id: "goal", label: "No Goal", icon: <TargetIcon size={20} /> },
];

// Hoisted Helper Component
function TargetIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

const VALUE_CARDS = [
  { id: "work", label: "Career", icon: "💼" },
  { id: "sports", label: "Health", icon: "🏃" },
  { id: "partner", label: "Love", icon: "❤️" },
  { id: "kids", label: "Kids", icon: "🧸" },
  { id: "reading", label: "Reading", icon: "📚" },
  { id: "nature", label: "Nature", icon: "🌲" },
  { id: "friends", label: "Social", icon: "🥂" },
];

const INITIAL_APPS = [
  {
    id: "instagram",
    name: "Instagram",
    iconName: "instagram",
    color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500",
    type: "distraction",
    category: "app",
  },
  {
    id: "tiktok",
    name: "TikTok",
    iconName: "smartphone",
    color: "bg-black",
    type: "distraction",
    category: "app",
  },
  {
    id: "twitter",
    name: "X",
    iconName: "twitter",
    color: "bg-black",
    type: "distraction",
    category: "app",
  },
  {
    id: "facebook",
    name: "Facebook",
    iconName: "facebook",
    color: "bg-blue-600",
    type: "distraction",
    category: "app",
  },
  {
    id: "games",
    name: "Games",
    iconName: "gamepad",
    color: "bg-purple-600",
    type: "distraction",
    category: "app",
  },
  {
    id: "youtube",
    name: "YouTube",
    iconName: "monitor",
    color: "bg-red-600",
    type: "distraction",
    category: "web",
  },
  {
    id: "reddit",
    name: "Reddit",
    iconName: "monitor",
    color: "bg-orange-500",
    type: "distraction",
    category: "web",
  },
];

const ADVANCED_STATS = {
  topTrigger: { label: "Anxiety", count: 15, icon: <Activity size={16} /> },
  peakTime: "Tuesday Afternoons",
  correlations: [
    {
      cause: "Boredom",
      causeIcon: <HelpCircle size={14} />,
      appName: "TikTok",
      pct: 65,
      color: "bg-black",
    },
    {
      cause: "Anxiety",
      causeIcon: <Activity size={14} />,
      appName: "News",
      pct: 45,
      color: "bg-blue-500",
    },
    {
      cause: "Fatigue",
      causeIcon: <Battery size={14} />,
      appName: "Instagram",
      pct: 30,
      color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500",
    },
  ],
  causeFail: [
    {
      id: "c3",
      label: "Anxiety",
      rate: 58,
      icon: <Activity size={14} />,
      color: "bg-rose-500",
    },
    {
      id: "c2",
      label: "Boredom",
      rate: 25,
      icon: <HelpCircle size={14} />,
      color: "bg-blue-500",
    },
    {
      id: "c1",
      label: "Loneliness",
      rate: 8,
      icon: <Users size={14} />,
      color: "bg-purple-500",
    },
  ],
  topAlternatives: [
    { id: "t1", title: "Power Nap", count: 14, icon: "😴" },
    { id: "t2", title: "Quick Sketch", count: 9, icon: "🎨" },
    { id: "t3", title: "Call Thomas", count: 6, icon: "📞" },
  ],
};

const ALTERNATIVES_DB = {
  loneliness: [
    {
      id: "l1",
      title: "Hobby Class",
      desc: "Find a regular hobby class.",
      duration: "60m",
      type: "social",
      tags: ["outdoor"],
      likes: 1240,
      actions: ["Search local classes", "Check schedule", "Sign up for one"],
    },
    {
      id: "l2",
      title: "Cook & Invite",
      desc: "Make a special meal and invite a friend.",
      duration: "90m",
      type: "social",
      tags: ["indoor"],
      likes: 85,
      actions: [
        "Choose a recipe",
        "Check ingredients",
        "Call a friend to invite",
        "Start cooking",
      ],
    },
    {
      id: "l3",
      title: "Call Thomas",
      desc: "He is usually free around this time.",
      duration: "10m",
      type: "social",
      isFriend: true,
      tags: ["social_call"],
      friendName: "Thomas",
      avatar: "bg-red-500",
      actions: ["Open contacts", "Find Thomas", "Call"],
    },
    {
      id: "l4",
      title: "Third Place Visit",
      desc: "Go to a library or coffee shop.",
      duration: "45m",
      type: "social",
      tags: ["outdoor"],
      likes: 420,
      actions: ["Pack a book", "Walk to location", "Order a drink/Find seat"],
    },
    {
      id: "l5",
      title: "Volunteering",
      desc: "Find a volunteering project.",
      duration: "30m",
      type: "social",
      tags: ["outdoor"],
      likes: 300,
      actions: [
        "Search local charities",
        "Call to inquire",
        "Schedule first visit",
      ],
    },
    {
      id: "l6",
      title: "Join MeetUp",
      desc: "Find a spontaneous group activity.",
      duration: "60m",
      type: "social",
      tags: ["outdoor"],
      likes: 250,
      actions: ["Open MeetUp.com", "Search interest", "RSVP to one event"],
    },
    {
      id: "l7",
      title: "Nature Walk",
      desc: "Walk in nature, maybe greet a stranger.",
      duration: "30m",
      type: "social",
      tags: ["outdoor"],
      likes: 800,
      actions: ["Put on shoes", "Go to nearest park", "Smile at someone"],
    },
  ],
  boredom: [
    {
      id: "bo1",
      title: "Make Tea Ritual",
      desc: "Ritualize making a hot drink.",
      duration: "10m",
      type: "calm",
      tags: ["indoor"],
      likes: 120,
      actions: [
        "Boil water",
        "Select favorite tea leaf",
        "Steep and enjoy slowly",
      ],
    },
    {
      id: "bo2",
      title: "Tidy Up",
      desc: "Tidy up one small area.",
      duration: "15m",
      type: "productive",
      tags: ["indoor"],
      likes: 12,
      actions: ["Pick one corner", "Set timer for 15m", "Start organizing"],
    },
    {
      id: "bo3",
      title: "Quick Sketch",
      desc: "Grab a pen and paper.",
      duration: "20m",
      type: "creative",
      tags: ["indoor"],
      likes: 340,
      actions: ["Find paper", "Find a pencil", "Draw what is in front of you"],
    },
    {
      id: "bo4",
      title: "Play Instrument",
      desc: "Practice music.",
      duration: "15m",
      type: "creative",
      tags: ["indoor"],
      likes: 50,
      actions: ["Sit at instrument", "Warm up fingers", "Play a song"],
    },
    {
      id: "bo5",
      title: "Plant Care",
      desc: "Tend to your green friends.",
      duration: "10m",
      type: "calm",
      tags: ["indoor"],
      likes: 210,
      actions: ["Check soil moisture", "Water if dry", "Wipe dust off leaves"],
    },
    {
      id: "bo6",
      title: "Boredom Jar",
      desc: "Pick a random activity.",
      duration: "5m",
      type: "creative",
      tags: ["indoor"],
      likes: 95,
      actions: ["Get a jar", "Write ideas on slips", "Pull one out"],
    },
    {
      id: "bo7",
      title: "Savor Boredom",
      desc: "Listen to yourself for clarity.",
      duration: "5m",
      type: "calm",
      tags: ["indoor"],
      likes: 80,
      actions: [
        "Sit still",
        "Close eyes",
        "Wait 5 minutes without doing anything",
      ],
    },
    {
      id: "bo8",
      title: "Console Gaming",
      desc: "Play on Switch/PS (Not Phone!).",
      duration: "30m",
      type: "leisure",
      tags: ["indoor"],
      likes: 600,
      actions: ["Turn on TV", "Grab controller", "Play 1 level"],
    },
  ],
  fatigue: [
    {
      id: "f1",
      title: "Power Nap",
      desc: "Set timer for 15-45 minutes.",
      duration: "30m",
      type: "rest",
      tags: ["indoor"],
      likes: 9000,
      actions: ["Find a quiet spot", "Set alarm", "Close eyes"],
    },
    {
      id: "f2",
      title: "Do Nothing",
      desc: "Learn to do nothing.",
      duration: "30m",
      type: "rest",
      tags: ["indoor"],
      likes: 500,
      actions: ["Sit comfortably", "Put phone away", "Let mind wander"],
    },
    {
      id: "f3",
      title: "Pomodoro Break",
      desc: "Take a regular break.",
      duration: "5m",
      type: "rest",
      tags: ["indoor"],
      likes: 2100,
      actions: ["Set timer 5m", "Stand up", "Stretch", "Drink water"],
    },
    {
      id: "f4",
      title: "Short Walk",
      desc: "Go around your house.",
      duration: "10m",
      type: "physical",
      tags: ["outdoor"],
      likes: 1100,
      actions: ["Put on shoes", "Step outside", "Walk around block"],
    },
    {
      id: "f5",
      title: "Body Activate",
      desc: "Quick stretch to wake up.",
      duration: "5m",
      type: "physical",
      tags: ["indoor"],
      likes: 900,
      actions: ["Stand up", "Stretch arms high", "Rotate neck"],
    },
  ],
  goal: [
    {
      id: "g1",
      title: "Values Check",
      desc: "Reconnect with your intentions.",
      duration: "5m",
      type: "mental",
      tags: ["indoor"],
      likes: 450,
      actions: ["Write down 3 values", "Pick one", "Plan one small act today"],
    },
    {
      id: "g2",
      title: "Ideal Day",
      desc: "Journal your perfect Tuesday.",
      duration: "10m",
      type: "mental",
      tags: ["indoor"],
      likes: 320,
      actions: [
        "Open notebook",
        "Visualize perfect day",
        "Write 5 lines about it",
      ],
    },
    {
      id: "g3",
      title: "Space Prep",
      desc: "Tidy area related to a goal.",
      duration: "15m",
      type: "productive",
      tags: ["indoor"],
      likes: 210,
      actions: ["Pick one desk area", "Remove clutter", "Wipe surface clean"],
    },
    {
      id: "g4",
      title: "Set Intention",
      desc: "One simple, achievable goal.",
      duration: "5m",
      type: "mental",
      tags: ["indoor"],
      likes: 300,
      actions: ["Think of 1 goal", "Visualize doing it", "Start step 1"],
    },
    {
      id: "g5",
      title: "Offline Explore",
      desc: "Browse a library or bookstore.",
      duration: "45m",
      type: "mental",
      tags: ["outdoor"],
      likes: 150,
      actions: ["Go to library", "Find a random section", "Browse books"],
    },
  ],
  doubt: [
    {
      id: "d1",
      title: "Done List",
      desc: "List 3 things you accomplished.",
      duration: "5m",
      type: "mental",
      tags: ["indoor"],
      likes: 600,
      actions: ["Review your day", "Write down 3 wins", "Feel proud"],
    },
    {
      id: "d2",
      title: "Micro-Service",
      desc: "Offer a small kindness.",
      duration: "10m",
      type: "social",
      tags: ["indoor"],
      likes: 410,
      actions: [
        "Think of a friend/colleague",
        "Send helpful text",
        "Offer support",
      ],
    },
    {
      id: "d3",
      title: "Tiny Skill",
      desc: "Master one small skill.",
      duration: "10m",
      type: "mental",
      tags: ["indoor"],
      likes: 330,
      actions: ["Pick a skill (e.g. Excel)", "Watch 5m tutorial", "Try it out"],
    },
    {
      id: "d4",
      title: "Tool Care",
      desc: "Prepare a tool for success.",
      duration: "10m",
      type: "productive",
      tags: ["indoor"],
      likes: 150,
      actions: [
        "Pick a tool/lens",
        "Clean it thoroughly",
        "Put it back neatly",
      ],
    },
    {
      id: "d5",
      title: "Victory Lap",
      desc: "Review past wins.",
      duration: "5m",
      type: "mental",
      tags: ["indoor"],
      likes: 200,
      actions: [
        "Look at old successful project",
        "Remember the feeling",
        "Affirm competence",
      ],
    },
  ],
  anxiety: [
    {
      id: "a1",
      title: "5-4-3-2-1 Grounding",
      desc: "Grounding technique.",
      duration: "3m",
      type: "calm",
      tags: ["indoor"],
      likes: 5000,
      actions: [
        "Name 5 things seen",
        "4 things felt",
        "3 things heard",
        "2 things smelled",
        "1 thing tasted",
      ],
    },
    {
      id: "a2",
      title: "Box Breathing",
      desc: "Military calm technique.",
      duration: "2m",
      type: "calm",
      tags: ["indoor"],
      likes: 4200,
      actions: ["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s"],
    },
    {
      id: "a3",
      title: "Cold Splash",
      desc: "Physical anxiety reset.",
      duration: "2m",
      type: "physical",
      tags: ["indoor"],
      likes: 3100,
      actions: [
        "Go to bathroom",
        "Splash cold water on face",
        "Towel dry",
        "Breathe",
      ],
    },
    {
      id: "a4",
      title: "Micro-Tidy",
      desc: "External order calms chaos.",
      duration: "5m",
      type: "productive",
      tags: ["indoor"],
      likes: 800,
      actions: ["Pick one drawer/pile", "Sort it", "Discard trash"],
    },
    {
      id: "a5",
      title: "Energy Shake",
      desc: "Release anxious energy.",
      duration: "2m",
      type: "physical",
      tags: ["indoor"],
      likes: 600,
      actions: ["Stand up", "Shake hands/feet", "Do 20 jumping jacks"],
    },
    {
      id: "a6",
      title: "Room Switch",
      desc: "Change environment.",
      duration: "2m",
      type: "physical",
      tags: ["indoor"],
      likes: 400,
      actions: ["Stand up", "Walk to another room/outside", "Stay for 60s"],
    },
  ],
};

const ALL_ALTS = Object.values(ALTERNATIVES_DB).flat();

const FRIENDS_LEADERBOARD = [
  {
    id: "f3",
    name: "Sarah",
    successRate: 94,
    avatar: "bg-purple-500",
    rank: 1,
    status: "accepted",
    buddyStatus: "none",
    phone: "+49 123 4567",
    isFavorite: true,
    note: "Loves knitting and cats.",
    location: "Munich",
    recentMood: "anxiety",
    currentActivity: "Knitting",
    activity: "Reading at Cafe",
    alternatives: [
      ALL_ALTS.find((a) => a.id === "bo1") || ALL_ALTS[0],
      ALL_ALTS.find((a) => a.id === "f3") || ALL_ALTS[1],
      {
        id: "s1",
        title: "Knitting",
        desc: "Keeps hands busy.",
        duration: "20m",
        likes: 40,
      },
    ],
  },
  {
    id: "f1",
    name: "Hans",
    successRate: 88,
    avatar: "bg-green-500",
    rank: 2,
    status: "accepted",
    buddyStatus: "none",
    phone: "+49 123 9999",
    isFavorite: false,
    note: "",
    location: "Munich",
    recentMood: "fatigue",
    currentActivity: "Power Nap",
    activity: null,
    alternatives: [
      ALL_ALTS.find((a) => a.id === "g2") || ALL_ALTS[0],
      ALL_ALTS.find((a) => a.id === "bo5") || ALL_ALTS[1],
      {
        id: "h1",
        title: "Cold Shower",
        desc: "Instant wake up.",
        duration: "5m",
        likes: 12,
      },
    ],
  },
  {
    id: "f0",
    name: "Wei (You)",
    successRate: 85,
    avatar: "bg-blue-500",
    rank: 3,
    status: "accepted",
    buddyStatus: "none",
    isFavorite: false,
    note: "",
    alternatives: [],
  },
  {
    id: "f2",
    name: "Thomas",
    successRate: 64,
    avatar: "bg-red-500",
    rank: 4,
    status: "accepted",
    buddyStatus: "accepted",
    phone: "+49 123 0000",
    isFavorite: true,
    note: "My accountability partner. Needs encouragement.",
    location: "Berlin",
    recentMood: "loneliness",
    currentActivity: "Walking",
    activity: "Gaming",
    alternatives: [
      ALL_ALTS.find((a) => a.id === "l3") || ALL_ALTS[0],
      ALL_ALTS.find((a) => a.id === "bo4") || ALL_ALTS[1],
      {
        id: "t1",
        title: "Quick Run",
        desc: "Around the block.",
        duration: "15m",
        likes: 85,
      },
    ],
  },
];

const MOCK_SESSION_USERS = [
  { id: "u1", name: "Anna", status: "focused", avatar: "bg-pink-500" },
  { id: "u2", name: "David", status: "focused", avatar: "bg-teal-500" },
  { id: "u3", name: "Chris", status: "distracted", avatar: "bg-orange-500" },
  { id: "u4", name: "Maria", status: "focused", avatar: "bg-indigo-500" },
];

// Helper function to get color for mood
const getMoodColor = (mood) => {
  switch (mood) {
    case "calm":
    case "focus":
      return "bg-green-100 text-green-600";
    case "boredom":
      return "bg-blue-100 text-blue-600";
    case "anxiety":
      return "bg-rose-100 text-rose-600";
    case "loneliness":
      return "bg-indigo-100 text-indigo-600";
    case "fatigue":
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
};

const INITIAL_PLAN = [
  {
    id: "p1",
    time: "09:00",
    duration: 180,
    title: "Deep Work",
    icon: "💼",
    type: "work",
    supervision: {
      enabled: false,
      checkScreenTime: false,
      distractedLimit: 15,
      screenTimeLimit: 60,
      buddyId: "",
    },
  },
  {
    id: "p2",
    time: "12:30",
    duration: 60,
    title: "Lunch & Reading",
    icon: "📚",
    type: "personal",
    supervision: {
      enabled: false,
      checkScreenTime: false,
      distractedLimit: 15,
      screenTimeLimit: 60,
      buddyId: "",
    },
  },
  {
    id: "p3",
    time: "17:00",
    duration: 90,
    title: "Play with Kids",
    icon: "🧸",
    type: "family",
    supervision: {
      enabled: false,
      checkScreenTime: false,
      distractedLimit: 15,
      screenTimeLimit: 60,
      buddyId: "",
    },
  },
];

// Screen Time Dummy Data
const SCREEN_TIME_DATA = {
  today: {
    totalMinutes: 192, // 3h 12m
    hourlyBreakdown: [
      { hour: 0, minutes: 0 },
      { hour: 1, minutes: 0 },
      { hour: 2, minutes: 0 },
      { hour: 3, minutes: 0 },
      { hour: 4, minutes: 0 },
      { hour: 5, minutes: 0 },
      { hour: 6, minutes: 5 },
      { hour: 7, minutes: 12 },
      { hour: 8, minutes: 8 },
      { hour: 9, minutes: 15 },
      { hour: 10, minutes: 20 },
      { hour: 11, minutes: 18 },
      { hour: 12, minutes: 25 },
      { hour: 13, minutes: 22 },
      { hour: 14, minutes: 15 },
      { hour: 15, minutes: 10 },
      { hour: 16, minutes: 8 },
      { hour: 17, minutes: 5 },
      { hour: 18, minutes: 3 },
      { hour: 19, minutes: 2 },
      { hour: 20, minutes: 0 },
      { hour: 21, minutes: 0 },
      { hour: 22, minutes: 0 },
      { hour: 23, minutes: 0 },
    ],
  },
  week: {
    totalMinutes: 1455, // ~24h 15m
    dailyBreakdown: [
      { label: "M", val: 2.5, minutes: 150 }, // Monday
      { label: "T", val: 3.8, minutes: 228 }, // Tuesday
      { label: "W", val: 1.5, minutes: 90 },  // Wednesday
      { label: "T", val: 4.2, minutes: 252 }, // Thursday
      { label: "F", val: 3.0, minutes: 180 }, // Friday
      { label: "S", val: 5.5, minutes: 330 }, // Saturday
      { label: "S", val: 4.8, minutes: 288 }, // Sunday
    ],
  },
  month: {
    totalMinutes: 5820, // ~97h
    weeklyBreakdown: [
      { label: "W1", val: 22.5, minutes: 1350 }, // Week 1
      { label: "W2", val: 24.2, minutes: 1452 }, // Week 2
      { label: "W3", val: 25.8, minutes: 1548 }, // Week 3
      { label: "W4", val: 23.5, minutes: 1410 }, // Week 4
    ],
  },
};

// Helper function to format minutes to "Xh Ym" format
const formatScreenTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

// Legacy WEEKLY_STATS for backward compatibility
const WEEKLY_STATS = SCREEN_TIME_DATA.week.dailyBreakdown;

const MOCK_CONTACTS = [
  { name: "Mom", type: "phone" },
  { name: "Dad", type: "phone" },
  { name: "Julia", type: "whatsapp" },
  { name: "Gym Group", type: "whatsapp" },
  { name: "Work Besties", type: "whatsapp" },
  { name: "Mark", type: "phone" },
];

const INITIAL_CHATS = {
  f3: [
    {
      id: 1,
      sender: "them",
      text: "Hey! Are you doing the challenge today?",
      time: "09:00",
    },
    { id: 2, sender: "me", text: "Yes, starting in 5 mins!", time: "09:05" },
  ],
};

export default function App() {
  // --- STATE (WITH PERSISTENCE) ---
  // Bumped versions to v17_2 to force clean state
  const [demoMode, setDemoMode] = useStickyState("mindful_demo_mode_v1", false);
  const [hasOnboarded, setHasOnboarded] = useStickyState(
    "mindful_onboarded_v17_2",
    false,
    { disablePersistence: demoMode }
  );
  const [selectedValues, setSelectedValues] = useStickyState(
    "mindful_values_v17_2",
    [],
    { disablePersistence: demoMode }
  );
  const [monitoredApps, setMonitoredApps] = useStickyState(
    "mindful_monitored_v17_2",
    DEFAULT_MONITORED_APPS,
    { disablePersistence: demoMode }
  );
  const [dailyPlan, setDailyPlan] = useStickyState(
    "mindful_plan_v17_2",
    INITIAL_PLAN,
    { disablePersistence: demoMode }
  );
  const [customAlternatives, setCustomAlternatives] = useStickyState(
    "mindful_custom_alts_v17_2",
    [],
    { disablePersistence: demoMode }
  );
  const [savedAlternativeIds, setSavedAlternativeIds] = useStickyState(
    "mindful_saved_alts_v17_2",
    [],
    { disablePersistence: demoMode }
  );
  const [privacyMap, setPrivacyMap] = useStickyState(
    "mindful_privacy_v17_2",
    {},
    { disablePersistence: demoMode }
  );
  // Bumped key version to v17_6 to initialize new settings fields
  const [settings, setSettings] = useStickyState(
    "mindful_settings_v17_6",
    DEFAULT_SETTINGS,
    { disablePersistence: demoMode }
  );
  const [customApps, setCustomApps] = useStickyState(
    "mindful_custom_apps_v17_2",
    INITIAL_APPS,
    { disablePersistence: demoMode }
  );
  const [userAccount, setUserAccount] = useStickyState(
    "mindful_account_v17_2",
    DEFAULT_USER_ACCOUNT,
    { disablePersistence: demoMode }
  );
  const [quickTaskWindowStart, setQuickTaskWindowStart] = useStickyState(
    "mindful_quick_window_v1",
    0,
    { disablePersistence: demoMode }
  );
  const [quickTaskUsesInWindow, setQuickTaskUsesInWindow] = useStickyState(
    "mindful_quick_uses_v1",
    0,
    { disablePersistence: demoMode }
  );
  const [quickTaskActiveUntil, setQuickTaskActiveUntil] = useStickyState(
    "mindful_quick_active_v1",
    0,
    { disablePersistence: demoMode }
  );
  const [quickTaskDurationMinutes, setQuickTaskDurationMinutes] = useStickyState(
    "mindful_quick_duration_v1",
    demoMode
      ? QUICK_TASK_TEST_DURATION_MINUTES
      : DEFAULT_QUICK_TASK_DURATION,
    { disablePersistence: demoMode }
  );
  const [quickTaskUsesPerWindow, setQuickTaskUsesPerWindow] = useStickyState(
    "mindful_quick_limit_v1",
    DEFAULT_QUICK_TASK_LIMIT,
    { disablePersistence: demoMode }
  );
  const [quickTaskLog, setQuickTaskLog] = useStickyState(
    "mindful_quick_log_v1",
    [],
    { disablePersistence: demoMode }
  );
  // Bumped version to v17_6 to force reload of new mock data structure
  const [friendsList, setFriendsList] = useStickyState(
    "mindful_friends_v17_6",
    FRIENDS_LEADERBOARD,
    { disablePersistence: demoMode }
  );
  const [deletedFriends, setDeletedFriends] = useStickyState(
    "mindful_deleted_friends_v17_2",
    [],
    { disablePersistence: demoMode }
  );
  const [sessionHistory, setSessionHistory] = useStickyState(
    "mindful_session_history_v17_2",
    [],
    { disablePersistence: demoMode }
  );
  const [chatMessages, setChatMessages] = useStickyState(
    "mindful_chats_v17_2",
    INITIAL_CHATS,
    { disablePersistence: demoMode }
  );

  // --- STATE (EPHEMERAL) ---
  const [activeContext, setActiveContext] = useState("launcher");
  const [currentTime, setCurrentTime] = useState("09:41");
  const [weather, setWeather] = useState("sunny");
  const [simNotification, setSimNotification] = useState(null);
  const [availableValueCards, setAvailableValueCards] = useState(VALUE_CARDS);
  const [activeSessions, setActiveSessions] = useState({});
  const [showQuickTaskDialog, setShowQuickTaskDialog] = useState(false);
  const [pendingQuickTaskApp, setPendingQuickTaskApp] = useState(null);
  const [quickTaskTick, setQuickTaskTick] = useState(Date.now());
  const [activeQuickTaskApp, setActiveQuickTaskApp] = useState(null);

  const [interventionState, setInterventionState] = useState("idle");
  const [targetApp, setTargetApp] = useState(null);
  const [breathingCount, setBreathingCount] = useState(3);
  const [selectedCauses, setSelectedCauses] = useState([]);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [altPage, setAltPage] = useState(0);
  const [isAddingAlt, setIsAddingAlt] = useState(false);
  const [newAltData, setNewAltData] = useState({
    title: "",
    desc: "",
    duration: "5m",
    visibility: "public",
    isPrivate: false,
  });
  const [newAltActions, setNewAltActions] = useState([""]);
  const [showAltScheduler, setShowAltScheduler] = useState(false);
  const [altPlanDraft, setAltPlanDraft] = useState(null);
  const [proactiveState, setProactiveState] = useState(null);
  const [altTab, setAltTab] = useState("discover");
  const [actionTimer, setActionTimer] = useState(0);

  // AI STATE
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAIInspiredForm, setShowAIInspiredForm] = useState(false);
  const [aiInspiredFormData, setAiInspiredFormData] = useState({
    topic: "",
    location: "",
    participantsDescription: "",
    useCurrentEmotion: true,
  });
  const [aiInspiredSuggestions, setAiInspiredSuggestions] = useState([]);
  const [userCoordinates, setUserCoordinates] = useStickyState(
    "mindful_user_coordinates_v1",
    null
  ); // { lat: number, lng: number } or null
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // COMMUNITY / GROUP SESSION STATE
  const communityDefaults = useRef(
    loadCommunityState(
      {
        upcomingActivities: MY_UPCOMING_ACTIVITIES,
        friendSharedActivities: FRIEND_SHARED_ACTIVITIES,
        publicEvents: PUBLIC_EVENTS,
        incomingRequests: INCOMING_REQUESTS,
        pendingRequests: INCOMING_REQUESTS,
        sharedCurrentActivities: [],
      },
      { disablePersistence: demoMode }
    )
  );
  const [liveSessions, setLiveSessions] = useState([
    {
      id: "s1",
      topic: "Deep Work: Coding",
      host: "David",
      startTime: "09:00",
      endTime: "12:00",
      participants: MOCK_SESSION_USERS,
      joinLimitTime: "09:15",
      category: "work",
    },
    {
      id: "s2",
      topic: "Silent Reading",
      host: "BookClub",
      startTime: "20:00",
      endTime: "21:00",
      participants: [MOCK_SESSION_USERS[0], MOCK_SESSION_USERS[3]],
      joinLimitTime: "20:15",
      category: "hobby",
    },
  ]);
  const [upcomingActivities, setUpcomingActivities] = useState(
    communityDefaults.current.upcomingActivities
  );
  const [friendSharedActivities, setFriendSharedActivities] = useState(
    communityDefaults.current.friendSharedActivities
  );
  const [sharedCurrentActivities, setSharedCurrentActivities] = useState(
    communityDefaults.current.sharedCurrentActivities || []
  );
  const [publicEvents, setPublicEvents] = useState(
    communityDefaults.current.publicEvents
  );
  const [incomingRequests, setIncomingRequests] = useState(
    communityDefaults.current.incomingRequests || []
  );
  const [pendingRequests, setPendingRequests] = useState(
    communityDefaults.current.pendingRequests ||
      communityDefaults.current.incomingRequests ||
      []
  );
  const [currentActivity, setCurrentActivity] = useState(
    communityDefaults.current.currentActivity || null
  );
  const [userSessionState, setUserSessionState] = useState(null);

  // EVENT UPDATES STATE (Phase E-2c)
  // Stores event-related update signals for future Inbox consumption
  const [eventUpdates, setEventUpdates] = useState([]);

  // CHAT STATE
  const [activeChatFriend, setActiveChatFriend] = useState(null);

  const [toast, setToast] = useState(null);
  const [communityData, setCommunityData] = useState(
    communityDefaults.current
  );
  const [createEventDraft, setCreateEventDraft] = useState(null);
  const liveSessionTimeoutRef = useRef(null);
  const seenRequestIdsRef = useRef(new Set());
  const currentUserId = CURRENT_USER_ID;
  const currentUser =
    friendsList?.find((f) => f.id === currentUserId) || {
      id: currentUserId,
      name: "You",
    };

  const resetAllState = useCallback(
    (options = {}) => {
      const isDemoMode = options.demoMode ?? demoMode;

      setHasOnboarded(false);
      setSelectedValues([]);
      setMonitoredApps([...DEFAULT_MONITORED_APPS]);
      setDailyPlan(INITIAL_PLAN);
      setCustomAlternatives([]);
      setSavedAlternativeIds([]);
      setPrivacyMap({});
      setSelectedAlternative(null);
      setShowAltScheduler(false);
      setAltPlanDraft(null);
      setSettings({ ...DEFAULT_SETTINGS });
      setCustomApps([...INITIAL_APPS]);
      setUserAccount({ ...DEFAULT_USER_ACCOUNT });
      setQuickTaskWindowStart(0);
      setQuickTaskUsesInWindow(0);
      setQuickTaskActiveUntil(0);
      setQuickTaskDurationMinutes(
        isDemoMode
          ? QUICK_TASK_TEST_DURATION_MINUTES
          : DEFAULT_QUICK_TASK_DURATION
      );
      setQuickTaskUsesPerWindow(DEFAULT_QUICK_TASK_LIMIT);
      setQuickTaskLog([]);
      setFriendsList([...FRIENDS_LEADERBOARD]);
      setUpcomingActivities([...communityDefaults.current.upcomingActivities]);
      setSharedCurrentActivities([
        ...(communityDefaults.current.sharedCurrentActivities || []),
      ]);
      setFriendSharedActivities([
        ...communityDefaults.current.friendSharedActivities,
      ]);
      setPublicEvents([...communityDefaults.current.publicEvents]);
      setIncomingRequests([
        ...(communityDefaults.current.incomingRequests || []),
      ]);
      setPendingRequests([
        ...(communityDefaults.current.pendingRequests ||
          communityDefaults.current.incomingRequests ||
          []),
      ]);
      setCurrentActivity(communityDefaults.current.currentActivity || null);
      setDeletedFriends([]);
      setSessionHistory([]);
      setChatMessages({ ...INITIAL_CHATS });
      setUserSessionState(null);
      setActiveSessions({});
      setActiveQuickTaskApp(null);
      setActiveChatFriend(null);
      setSimNotification(null);
      setPendingQuickTaskApp(null);
      setAvailableValueCards([...VALUE_CARDS]);
    },
    [
      demoMode,
      setActiveChatFriend,
      setActiveQuickTaskApp,
      setActiveSessions,
      setAvailableValueCards,
      setChatMessages,
      setCustomAlternatives,
      setCustomApps,
      setDailyPlan,
      setDeletedFriends,
      setFriendsList,
      setHasOnboarded,
      setMonitoredApps,
      setPendingQuickTaskApp,
      setPrivacyMap,
      setQuickTaskActiveUntil,
      setQuickTaskDurationMinutes,
      setQuickTaskLog,
      setQuickTaskUsesInWindow,
      setQuickTaskUsesPerWindow,
      setQuickTaskWindowStart,
      setSavedAlternativeIds,
      setSelectedValues,
      setSessionHistory,
      setSettings,
      setSimNotification,
      setFriendSharedActivities,
      setPublicEvents,
      setIncomingRequests,
      setUserAccount,
      setUserSessionState,
    ]
  );

  // --- EFFECTS ---
  useEffect(() => {
    if (demoMode) {
      resetAllState({ demoMode: true });
    }
  }, [demoMode, resetAllState]);

  // Migrate old chatMessages to new privateConversations format (one-time)
  useEffect(() => {
    const migrationKey = 'private_messages_migrated_v1';
    const alreadyMigrated = localStorage.getItem(migrationKey);
    
    if (!alreadyMigrated && chatMessages && Object.keys(chatMessages).length > 0) {
      const migratedConversations = migrateOldChatMessages(chatMessages, currentUserId);
      const existingConversations = loadPrivateConversations();
      const merged = { ...migratedConversations, ...existingConversations };
      savePrivateConversations(merged);
      localStorage.setItem(migrationKey, 'true');
      console.log('Migrated old chat messages to new format');
    }
  }, []); // Run once on mount

  useEffect(() => {
    let timer;
    if (interventionState === "breathing") {
      if (breathingCount > 0) {
        timer = setTimeout(() => setBreathingCount(breathingCount - 1), 1000);
      } else {
        setInterventionState("root-cause");
      }
    }
    return () => clearTimeout(timer);
  }, [interventionState, breathingCount]);

  // ACTION TIMER EFFECT
  useEffect(() => {
    let timer;
    if (interventionState === "action_timer" && actionTimer > 0) {
      timer = setInterval(() => setActionTimer((t) => t - 1), 1000);
    } else if (interventionState === "action_timer" && actionTimer === 0) {
      // Optional: Auto finish or just stay at 00:00
    }
    return () => clearInterval(timer);
  }, [interventionState, actionTimer]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    persistCommunityState(communityData, { disablePersistence: demoMode });
    setUpcomingActivities(communityData.upcomingActivities);
    setFriendSharedActivities(communityData.friendSharedActivities);
    setSharedCurrentActivities(communityData.sharedCurrentActivities || []);
    setPublicEvents(communityData.publicEvents);
    setIncomingRequests(communityData.incomingRequests);
    setPendingRequests(
      communityData.pendingRequests || communityData.incomingRequests || []
    );
    setCurrentActivity(communityData.currentActivity || null);
  }, [communityData, demoMode]);

  useEffect(() => {
    const seen = seenRequestIdsRef.current;
    (incomingRequests || []).forEach((req) => {
      if (
        req.hostId === currentUserId &&
        req.status === "pending" &&
        !seen.has(req.id)
      ) {
        seen.add(req.id);
        setToast(`New join request from ${req.requesterName || "a friend"}`);
      }
    });
  }, [incomingRequests, currentUserId]);

  useEffect(() => {
    return () => {
      if (liveSessionTimeoutRef.current) {
        clearTimeout(liveSessionTimeoutRef.current);
      }
    };
  }, []);

  // QUICK TASK TICKER
  useEffect(() => {
    if (quickTaskActiveUntil > Date.now()) {
      const timer = setInterval(() => setQuickTaskTick(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [quickTaskActiveUntil]);

  // Light heartbeat to refresh window countdown when uses exist
  useEffect(() => {
    if (quickTaskUsesInWindow > 0 && quickTaskWindowStart) {
      const timer = setInterval(() => setQuickTaskTick(Date.now()), 30000);
      return () => clearInterval(timer);
    }
  }, [quickTaskUsesInWindow, quickTaskWindowStart]);

  // Auto-clear expired quick task session
  useEffect(() => {
    if (quickTaskActiveUntil && quickTaskActiveUntil <= Date.now()) {
      const quickTaskApp =
        activeQuickTaskApp ||
        (activeContext.startsWith("app-")
          ? customApps.find((a) => `app-${a.id}` === activeContext)
          : null);

      setQuickTaskActiveUntil(0);
      setActiveQuickTaskApp(null);

      // When quick task expires, immediately start the normal intervention flow
      if (quickTaskApp && interventionState === "idle") {
        beginInterventionForApp(quickTaskApp);
      }
    }
  }, [
    quickTaskActiveUntil,
    quickTaskTick,
    activeQuickTaskApp,
    activeContext,
    customApps,
    interventionState,
  ]);

  // Enforce free-plan defaults
  useEffect(() => {
    if (!userAccount.isPremium && !demoMode) {
      if (quickTaskDurationMinutes !== DEFAULT_QUICK_TASK_DURATION) {
        setQuickTaskDurationMinutes(DEFAULT_QUICK_TASK_DURATION);
      }
      if (quickTaskUsesPerWindow !== 1) setQuickTaskUsesPerWindow(1);
    }
  }, [
    demoMode,
    userAccount.isPremium,
    quickTaskDurationMinutes,
    quickTaskUsesPerWindow,
  ]);

  useEffect(() => {
    if (!QUICK_TASK_ALLOWED_DURATIONS.includes(quickTaskDurationMinutes)) {
      setQuickTaskDurationMinutes(3);
    }
    if (![1, 2].includes(quickTaskUsesPerWindow)) {
      setQuickTaskUsesPerWindow(1);
    }
  }, [quickTaskDurationMinutes, quickTaskUsesPerWindow]);

  // Track the last selectedCauses we generated for to avoid regenerating unnecessarily
  const lastGeneratedCausesRef = useRef(null);
  const hasGeneratedRef = useRef(false);
  
  // Trigger AI generation when tab switches to AI and we have causes
  // Only generate if suggestions are empty (first time) - don't regenerate when returning from activity view
  useEffect(() => {
    if (
      interventionState === "alternatives" &&
      altTab === "ai" &&
      selectedCauses.length > 0
    ) {
      // Only generate if:
      // 1. Haven't generated yet for this session, OR
      // 2. Selected causes changed (user selected different root causes)
      const causesKey = selectedCauses.sort().join(",");
      const shouldGenerate = 
        !hasGeneratedRef.current || 
        lastGeneratedCausesRef.current !== causesKey;
      
      if (shouldGenerate) {
        lastGeneratedCausesRef.current = causesKey;
        hasGeneratedRef.current = true;
        handleGenerateContextualAlternatives();
      }
    }
  }, [interventionState, altTab, selectedCauses]);

  // Reset generation tracking when user goes back to root cause selection
  useEffect(() => {
    if (selectedCauses.length === 0) {
      hasGeneratedRef.current = false;
      lastGeneratedCausesRef.current = null;
    }
  }, [selectedCauses.length]);

  useEffect(() => {
    if (simNotification?.type === "social_planning") setCurrentTime("16:45");
    else if (simNotification?.type === "sleep_hygiene") setCurrentTime("23:30");
    else if (simNotification?.type === "read") setCurrentTime("08:00");
    else if (simNotification?.type === "late_night") setCurrentTime("23:30");
    else setCurrentTime("09:41");
  }, [simNotification]);

  // --- HANDLERS ---

  const isQuickTaskActive =
    quickTaskActiveUntil && quickTaskActiveUntil > Date.now();

  const quickTaskRemainingUses = useMemo(() => {
    const now = Date.now();
    if (!quickTaskWindowStart || now - quickTaskWindowStart > QUICK_TASK_WINDOW_MS) {
      return quickTaskUsesPerWindow;
    }
    return Math.max(0, quickTaskUsesPerWindow - quickTaskUsesInWindow);
  }, [
    quickTaskWindowStart,
    quickTaskUsesInWindow,
    quickTaskUsesPerWindow,
    quickTaskTick,
  ]);

  // Aggregated state/actions used across the component tree
  const state = useMemo(
    () => {
      return {
      hasOnboarded,
      selectedValues,
      monitoredApps,
      dailyPlan,
      settings,
      customApps,
      userAccount,
      availableValueCards,
      simNotification,
      friendsList,
      upcomingActivities,
      friendSharedActivities,
      sharedCurrentActivities,
      publicEvents,
      incomingRequests,
      pendingRequests,
      deletedFriends,
      privacyMap,
      liveSessions,
      userSessionState,
      sessionHistory,
      activeChatFriend,
      chatMessages,
      quickTaskDurationMinutes,
      quickTaskUsesPerWindow,
      quickTaskLog,
      quickTaskActiveUntil,
      quickTaskRemainingUses,
      demoMode,
      currentUserId,
      customAlternatives,
      savedAlternativeIds,
      privacyMapState: privacyMap,
      quickTaskWindowStart,
      quickTaskUsesInWindow,
      dailyPlanState: dailyPlan,
      createEventDraft,
      currentActivity,
      showAltScheduler,
      altPlanDraft,
      selectedAlternative,
      userCoordinates,
      };
    },
    [
      activeChatFriend,
      availableValueCards,
      chatMessages,
      customAlternatives,
      customApps,
      dailyPlan,
      deletedFriends,
      demoMode,
      friendSharedActivities,
      sharedCurrentActivities,
      friendsList,
      hasOnboarded,
      incomingRequests,
      pendingRequests,
      liveSessions,
      monitoredApps,
      privacyMap,
      publicEvents,
      quickTaskActiveUntil,
      quickTaskDurationMinutes,
      quickTaskLog,
      quickTaskRemainingUses,
      quickTaskUsesInWindow,
      quickTaskUsesPerWindow,
      quickTaskWindowStart,
      savedAlternativeIds,
      selectedValues,
      sessionHistory,
      settings,
      simNotification,
      upcomingActivities,
      userAccount,
      userSessionState,
      currentUserId,
      createEventDraft,
      currentActivity,
      showAltScheduler,
      altPlanDraft,
      selectedAlternative,
      userCoordinates,
    ]
  );

  const actions = useMemo(
    () => ({
      setHasOnboarded,
      setSelectedValues,
      setMonitoredApps,
      setDailyPlan,
      setSettings,
      setCurrentTime,
      setCustomApps,
      setUserAccount,
      setAvailableValueCards,
      setFriendsList,
      setUpcomingActivities,
      setFriendSharedActivities,
      setSharedCurrentActivities,
      setPublicEvents,
      setIncomingRequests,
      setPendingRequests,
      setDeletedFriends,
      setPrivacyMap,
      setLiveSessions,
      setUserSessionState,
      setSessionHistory,
      setActiveChatFriend,
      setChatMessages,
      setQuickTaskDurationMinutes,
      setQuickTaskUsesPerWindow,
      setQuickTaskLog,
      setQuickTaskActiveUntil,
      setQuickTaskUsesInWindow,
      setQuickTaskWindowStart,
      setDemoMode,
      resetAllState,
      setCreateEventDraft,
      setCommunityData,
      setCurrentActivity,
      setShowAltScheduler,
      setAltPlanDraft,
    }),
    [resetAllState]
  );

  const ensureQuickTaskWindow = useCallback(
    (now = Date.now()) => {
      if (!quickTaskWindowStart || now - quickTaskWindowStart > QUICK_TASK_WINDOW_MS) {
        setQuickTaskWindowStart(now);
        setQuickTaskUsesInWindow(0);
        return 0;
      }
      return quickTaskUsesInWindow;
    },
    [quickTaskWindowStart, quickTaskUsesInWindow]
  );

  const resetNewAltForm = () => {
    setIsAddingAlt(false);
    setNewAltData({
      title: "",
      desc: "",
      duration: "5m",
      visibility: "public",
      isPrivate: false,
    });
    setNewAltActions([""]);
  };

  const resetAIInspiredForm = () => {
    setShowAIInspiredForm(false);
    setAiInspiredFormData({
      topic: "",
      location: "",
      participantsDescription: "",
      useCurrentEmotion: true,
    });
    setAiInspiredSuggestions([]);
  };

  const beginInterventionForApp = (app) => {
    setTargetApp(app);
    setInterventionState("breathing");
    setBreathingCount(settings.interventionDuration);
    setSelectedCauses([]);
    setSelectedAlternative(null);
    resetNewAltForm();
    resetAIInspiredForm();
    setAltPage(0);
    setAltTab("discover");
  };

  const handleStartQuickTask = (app) => {
    if (!app) return;
    const now = Date.now();
    const uses = ensureQuickTaskWindow(now);
    const newUses = uses + 1;
    setActiveQuickTaskApp(app);
    setQuickTaskUsesInWindow(newUses);
    setQuickTaskActiveUntil(now + quickTaskDurationMinutes * 60 * 1000);
    setQuickTaskLog((prev = []) =>
      [
        {
          id: now,
          appId: app.id,
          appName: app.name || app.id,
          startedAt: now,
        },
        ...prev,
      ].slice(0, 100)
    );
    setShowQuickTaskDialog(false);
    setPendingQuickTaskApp(null);
    setInterventionState("idle");
    setTargetApp(null);
    setActiveContext(`app-${app.id}`);
    setToast(
      `Quick task started for ${formatQuickTaskDuration(quickTaskDurationMinutes)}`
    );
  };

  const handleGoConscious = (app) => {
    if (!app) return;
    setShowQuickTaskDialog(false);
    beginInterventionForApp(app);
  };

  // AI GENERATION HANDLER FOR TAB
  const handleGenerateContextualAlternatives = async () => {
    if (isGeneratingAI) return;

    if (!GEMINI_API_KEY) {
      // Don't toast here to avoid spam on tab switch, just let the UI show the warning
      return;
    }

    setIsGeneratingAI(true);
    setAiSuggestions([]); // Clear old suggestions
    
    // Update refs to track that we're generating for current causes
    // This prevents useEffect from regenerating when returning from activity view
    if (selectedCauses.length > 0) {
      const causesKey = selectedCauses.sort().join(",");
      lastGeneratedCausesRef.current = causesKey;
      hasGeneratedRef.current = true;
    }

    // 1. PRIMARY: Root causes/emotions
    const causeLabels = selectedCauses
      .map((id) => CAUSES.find((c) => c.id === id)?.label)
      .join(", ");

    // 2. CONTEXTUAL: Location
    const locationContext = USER_LOCATION;

    // 3. SOCIAL CONTEXT: Nearby friends (within 50km - currently using same location as proxy)
    const nearbyFriends = friendsList.filter(
      (f) => f.location === USER_LOCATION && f.id !== currentUserId
    );
    let socialContext = "";
    if (nearbyFriends.length > 0) {
      const friendList = nearbyFriends
        .map((f) => {
          let info = `${f.name} in ${f.location}`;
          if (f.currentActivity) {
            info += ` doing ${f.currentActivity}`;
          } else if (f.activity) {
            info += ` (recently: ${f.activity})`;
          }
          return info;
        })
        .join("; ");
      socialContext = `Nearby friends (within 50km): ${friendList}. Consider suggesting activities that could involve joining them if appropriate.`;
    }

    // 4. USER'S SAVED ALTERNATIVES & HISTORY
    let preferencesContext = "";
    const savedAlts = savedAlternativeIds
      .map((id) => {
        const found = ALL_ALTS.find((a) => a.id === id);
        return found ? found.title : null;
      })
      .filter(Boolean);
    const customAlts = customAlternatives.map((alt) => alt.title).filter(Boolean);
    
    // Get recent activities from session history (last 10 sessions)
    const recentActivities = sessionHistory
      .slice(-10)
      .map((session) => {
        if (session.alternative?.title) return session.alternative.title;
        if (session.alternativeId) {
          const found = ALL_ALTS.find((a) => a.id === session.alternativeId);
          if (found) return found.title;
        }
        return null;
      })
      .filter(Boolean);

    const allPreferences = [...new Set([...savedAlts, ...customAlts, ...recentActivities])];
    if (allPreferences.length > 0) {
      preferencesContext = `User's preferred/saved activities: ${allPreferences.slice(0, 5).join(", ")}. Consider suggesting similar activities or variations.`;
    }

    // 6. TIME OF DAY
    const timeContext = currentTime;
    const hour = parseInt(timeContext.split(":")[0]);
    let timeOfDay = "";
    if (hour >= 5 && hour < 12) {
      timeOfDay = "morning";
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = "afternoon";
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = "evening";
    } else {
      timeOfDay = "night";
    }

    // 7. WEATHER
    const weatherContext = weather;

    // 8. TARGET APP
    const targetAppContext = targetApp ? targetApp.name : "";

    // 9. USER VALUES/GOALS (last priority)
    let valuesContext = "";
    if (selectedValues && selectedValues.length > 0) {
      const valueLabels = selectedValues
        .map((id) => VALUE_CARDS.find((v) => v.id === id)?.label)
        .filter(Boolean)
        .join(", ");
      if (valueLabels) {
        valuesContext = `User's core values/goals: ${valueLabels}. Prioritize activities that align with these values.`;
      }
    }

    // Build comprehensive prompt with priority order
    const prompt = `Generate 3 specific, actionable alternative activities for a user that can be started IMMEDIATELY with minimal preparation.

PRIMARY CONTEXT:
- Emotional state: ${causeLabels || "not specified"}
- Location: ${locationContext}
${socialContext ? `- ${socialContext}` : ""}
${preferencesContext ? `- ${preferencesContext}` : ""}
- Time: ${timeContext} (${timeOfDay})
- Weather: ${weatherContext}
${targetAppContext ? `- Triggered by opening: ${targetAppContext}` : ""}
${valuesContext ? `- ${valuesContext}` : ""}

CRITICAL REQUIREMENTS:
- Activities MUST be easy to start RIGHT NOW (within 1-2 minutes)
- Activities MUST be appropriate for the current time of day (${timeOfDay} at ${timeContext})
  * If it's night (21:00-04:59): NO outdoor activities, NO morning sun activities, suggest calm/rest activities
  * If it's morning (05:00-11:59): Morning-appropriate activities are fine
  * If it's afternoon (12:00-16:59): Afternoon-appropriate activities are fine
  * If it's evening (17:00-20:59): Evening-appropriate activities are fine
- NO activities requiring advance planning, scheduling, or coordination
- NO activities requiring travel to specific venues (cafes, theaters, gyms)
- NO activities requiring booking or appointments
- Focus on activities that can be done at home, nearby, or online immediately
- Activities should require minimal setup and preparation

Return a JSON array of objects with keys: 'title' (short string), 'desc' (1 sentence), 'duration' (e.g. '15m'), 'actions' (array of 3 short steps that can be done immediately), 'type' (social/calm/creative/active/productive/rest).
Prioritize activities that address the emotional state first, then ensure they are appropriate for the time of day, then consider location, weather, and user preferences.

Good Examples (immediately actionable):
- [{"title": "5-Minute Stretch", "desc": "Release tension with gentle stretches.", "duration": "5m", "actions": ["Stand up", "Reach for the sky", "Touch your toes"], "type": "active"}]
- [{"title": "Breathing Exercise", "desc": "Calm your mind with deep breathing.", "duration": "3m", "actions": ["Sit comfortably", "Close your eyes", "Breathe deeply 10 times"], "type": "calm"}]
- [{"title": "Quick Doodle", "desc": "Express yourself through simple drawing.", "duration": "10m", "actions": ["Grab paper and pen", "Draw random shapes", "Add colors if available"], "type": "creative"}]

Bad Examples (require planning/travel):
- "Schedule a coffee meeting" (requires scheduling)
- "Visit a cinema" (requires travel and planning)
- "Join a networking event" (requires finding and attending event)`;

    const resultText = await callGemini(prompt);
    setIsGeneratingAI(false);

    if (resultText) {
      try {
        const jsonMatch = resultText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : resultText;
        const data = JSON.parse(jsonString);
        setAiSuggestions(data);
      } catch (e) {
        console.error("AI Parse Error", e);
        setToast("Could not load AI suggestions.");
      }
    } else {
      setToast("AI Request Failed.");
    }
  };

  // GEMINI HANDLERS
  const handleMagicSuggest = async () => {
    if (!newAltData.title && !newAltData.desc) return;

    if (!GEMINI_API_KEY) {
      setToast("API Key missing.");
      return;
    }

    setIsGeneratingAI(true);

    const prompt = `Based on the activity idea "${
      newAltData.title || newAltData.desc
    }", generate a structured JSON object for a mindful alternative activity. 
      The JSON must have these keys: "title" (short catchy name), "desc" (1 sentence motivating description), "duration" (e.g. "15m"), and "actions" (an array of 3 simple steps).
      Make it sound encouraging.
      Example output: { "title": "Quick Sketch", "desc": "Draw what you see in front of you.", "duration": "10m", "actions": ["Find a pen", "Find paper", "Draw"] }`;

    const resultText = await callGemini(prompt);
    setIsGeneratingAI(false);

    if (resultText) {
      try {
        // Try to find JSON in the response if there's extra text
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : resultText;
        const data = JSON.parse(jsonString);

        setNewAltData((prev) => ({
          ...prev,
          title: data.title,
          desc: data.desc,
          duration: data.duration,
        }));
        setNewAltActions(data.actions || []);
        setToast("✨ Magic Suggestion Applied!");
      } catch (e) {
        console.error("Failed to parse AI response", e);
        setToast("AI format error. Try again.");
      }
    } else {
      setToast("Could not generate suggestion.");
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoordinates(coords);
          
          // Perform reverse geocoding to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en-US,en;q=0.9',
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.address;
              
              // Build a readable location string
              let locationString = "";
              
              // Prioritize: road/street, suburb/neighborhood, city
              if (address.road) {
                locationString = address.road;
              } else if (address.pedestrian) {
                locationString = address.pedestrian;
              } else if (address.suburb) {
                locationString = address.suburb;
              } else if (address.neighbourhood) {
                locationString = address.neighbourhood;
              }
              
              // Add suburb or neighborhood if we started with a road
              if (address.road && (address.suburb || address.neighbourhood)) {
                locationString += `, ${address.suburb || address.neighbourhood}`;
              }
              
              // Add city if not already included
              const city = address.city || address.town || address.village;
              if (city && !locationString.toLowerCase().includes(city.toLowerCase())) {
                locationString = locationString ? `${locationString}, ${city}` : city;
              }
              
              // Fallback to display_name if we couldn't build a good string
              if (!locationString && data.display_name) {
                // Use first 2-3 parts of display_name
                const parts = data.display_name.split(',').slice(0, 3);
                locationString = parts.join(',').trim();
              }
              
              // Update the location field with the address
              if (locationString) {
                setAiInspiredFormData({
                  ...aiInspiredFormData,
                  location: locationString,
                });
                setToast(`📍 Location: ${locationString}`);
              } else {
                setToast(`Location fetched: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
              }
            } else {
              setToast(`Location fetched: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            setToast(`Location fetched: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setToast("Could not get location. Please check permissions.");
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setToast("Geolocation not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  const handleGenerateAIInspiredActivities = async () => {
    console.log("🎯 Generate AI Inspired Activities clicked");
    console.log("API Key value:", GEMINI_API_KEY);
    console.log("API Key type:", typeof GEMINI_API_KEY);
    
    if (isGeneratingAI) {
      console.log("⏳ Already generating, skipping...");
      return;
    }

    // If no API key, use fallback mock data for testing
    const hasValidApiKey = GEMINI_API_KEY && 
                          typeof GEMINI_API_KEY === 'string' && 
                          GEMINI_API_KEY.trim() !== "" && 
                          GEMINI_API_KEY !== "undefined";
    
    if (!hasValidApiKey) {
      console.log("⚠️ API Key missing or invalid - using fallback mock data");
      setToast("⚠️ Using demo data (API key not configured)");
      setIsGeneratingAI(true);
      
      // Simulate API delay
      setTimeout(() => {
        const mockSuggestions = [
          {
            title: aiInspiredFormData.topic 
              ? `${aiInspiredFormData.topic.charAt(0).toUpperCase() + aiInspiredFormData.topic.slice(1)} Session`
              : "Mindful Walk in English Garden",
            desc: aiInspiredFormData.location
              ? `Enjoy a refreshing activity at ${aiInspiredFormData.location}.`
              : "Take a peaceful stroll through Munich's beautiful English Garden. Perfect for clearing your mind.",
            duration: "30m",
            startTime: new Date().getHours() + ":30",
            actions: [
              "Put on comfortable shoes",
              aiInspiredFormData.location ? `Head to ${aiInspiredFormData.location}` : "Walk to the English Garden",
              "Enjoy the moment mindfully"
            ],
            type: "active"
          },
          {
            title: "Coffee & Journal Time",
            desc: "Find a cozy café nearby, order your favorite drink, and spend time reflecting in your journal.",
            duration: "45m",
            startTime: (new Date().getHours() + 1) + ":00",
            actions: [
              "Find a nearby café",
              "Order a warm beverage",
              "Write freely for 20 minutes"
            ],
            type: "calm"
          },
          {
            title: "Quick Creative Break",
            desc: "Express yourself through a simple creative activity. Draw, sketch, or write poetry.",
            duration: "20m",
            startTime: new Date().getHours() + ":15",
            actions: [
              "Gather paper and pen/pencil",
              "Find a quiet spot",
              "Create without judgment"
            ],
            type: "creative"
          }
        ];
        
        setAiInspiredSuggestions(mockSuggestions);
        setIsGeneratingAI(false);
        setToast("📝 Demo: 3 activities generated (set API key for AI)");
      }, 1500);
      
      return;
    }

    console.log("✅ Starting AI generation...");
    setIsGeneratingAI(true);
    setAiInspiredSuggestions([]);

    try {
      // Get current emotion/root causes if user wants to include them
    const emotionContext = aiInspiredFormData.useCurrentEmotion
      ? selectedCauses
          .map((id) => CAUSES.find((c) => c.id === id)?.label)
          .join(", ")
      : "";

    // Get nearby friends (within 20km - using same location as proxy)
    const nearbyFriends = friendsList.filter(
      (f) => f.location === USER_LOCATION && f.id !== currentUserId
    );
    let friendsContext = "";
    if (nearbyFriends.length > 0) {
      const friendList = nearbyFriends
        .map((f) => {
          let info = `${f.name}`;
          if (f.currentActivity) {
            info += ` is currently doing: ${f.currentActivity}`;
          } else if (f.activity) {
            info += ` recently did: ${f.activity}`;
          }
          return info;
        })
        .join("; ");
      friendsContext = `Friends nearby (within 20km): ${friendList}.`;
    }

    // Get current time to determine immediate vs. near-future activities
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeContext = `${currentHour}:${currentMinute < 10 ? "0" : ""}${currentMinute}`;

    // Build comprehensive prompt
    const prompt = `Generate 3 specific, immediately actionable activities for a user who wants to do something meaningful right now or within the next 1.5 hours.

USER INPUT:
${aiInspiredFormData.topic ? `- Topic/Interest: ${aiInspiredFormData.topic}` : ""}
${aiInspiredFormData.location ? `- Preferred Location: ${aiInspiredFormData.location}` : ""}
${aiInspiredFormData.participantsDescription ? `- Participants: ${aiInspiredFormData.participantsDescription}` : ""}
${emotionContext ? `- Current Emotional State: ${emotionContext}` : ""}

CONTEXT:
- Current Time: ${timeContext}
- Weather: ${weather}
- User Location: ${USER_LOCATION}
${userCoordinates ? `- User Coordinates: ${userCoordinates.lat}, ${userCoordinates.lng}` : ""}
${friendsContext ? `- ${friendsContext}` : ""}
${targetApp ? `- User was about to use: ${targetApp.name}` : ""}

REQUIREMENTS:
1. Activities must be SPECIFIC and CONCRETE (e.g., actual venue names, specific movie titles, real locations)
2. Activities should start immediately or within 1.5 hours maximum
3. Include start time in HH:MM format (24-hour)
4. Each activity must have 3 actionable steps
5. Prioritize the user's topic/interest first, then consider location, emotion, and context
6. If friends are nearby and relevant, suggest activities that could involve them
7. If user coordinates are provided, include 'location' (specific location name) and 'coordinates' (object with lat and lng) in each activity suggestion

Return a JSON array of objects with keys: 'title' (specific activity name), 'desc' (1-2 sentences with concrete details), 'duration' (e.g. '30m', '45m', '1-2h'), 'startTime' (HH:MM format), 'actions' (array of 3 specific action steps), 'type' (social/calm/creative/active/productive/rest), 'location' (optional, specific location name), 'coordinates' (optional, {lat: number, lng: number}).

Example: [{"title": "Watch 'Past Lives' at Cinema München", "desc": "Catch the 7:30 PM showing of this acclaimed romantic drama at Cinema München on Nymphenburger Straße.", "duration": "2h", "startTime": "19:30", "actions": ["Check tickets on cinema website", "Take U1 to Rotkreuzplatz", "Arrive 10 min early for snacks"], "type": "social", "location": "Cinema München, Nymphenburger Straße", "coordinates": {"lat": 48.1500, "lng": 11.5500}}]`;

      const resultText = await callGemini(prompt);

      if (resultText) {
        try {
          const jsonMatch = resultText.match(/\[[\s\S]*\]/);
          const jsonString = jsonMatch ? jsonMatch[0] : resultText;
          const data = JSON.parse(jsonString);
          
          if (Array.isArray(data) && data.length > 0) {
            setAiInspiredSuggestions(data);
            setToast("✨ Generated " + data.length + " activity ideas!");
          } else {
            setToast("⚠️ No suggestions generated. Try different inputs.");
          }
        } catch (e) {
          console.error("AI Parse Error:", e);
          console.error("Response text:", resultText);
          setToast("⚠️ Could not parse AI response. Try again.");
        }
      } else {
        setToast("⚠️ AI request failed. Check your API key or connection.");
      }
    } catch (error) {
      console.error("Error generating AI activities:", error);
      setToast("⚠️ Error: " + error.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleStartAlternative = (alt = selectedAlternative) => {
    if (!alt) return;
    // Parse duration
    const durationStr = alt.duration || "5m";
    const mins = parseInt(durationStr);
    setActionTimer(mins * 60);
    setSelectedAlternative(alt); // Ensure selected
    setInterventionState("action_timer");
  };

  const handleOpenAltScheduler = (alt = selectedAlternative) => {
    if (!alt) return;
    setAltPlanDraft(alt);
    setShowAltScheduler(true);
  };

  const handleLaunchApp = (app) => {
    if (app.id === "mindful") {
      setActiveContext("app-mindful");
      // If returning to MindfulOS while in session, status becomes focused
      if (
        userSessionState &&
        userSessionState.joined &&
        !userSessionState.isFinished
      ) {
        setUserSessionState((prev) => ({ ...prev, status: "focused" }));
      }
      return;
    }

    // Check Active Session Rules
    if (
      userSessionState &&
      userSessionState.joined &&
      !userSessionState.isFinished
    ) {
      // Is this app allowed?
      const isAllowed = userSessionState.allowedApps.includes(app.id);
      if (!isAllowed) {
        // Mark as distracted but allow usage (or we could block it, but prompt said switch app = no conscious time needed)
        // Simulating "user switch app" -> becomes distracted
        setUserSessionState((prev) => ({ ...prev, status: "distracted" }));
        // We can still trigger intervention if it's a monitored app
      } else {
        setUserSessionState((prev) => ({ ...prev, status: "focused" }));
      }
    }

    const isMonitored = monitoredApps.includes(app.id);
    const expiry = activeSessions[app.name];
    const now = Date.now();

    if (isMonitored && (!expiry || Date.now() > expiry)) {
      if (isQuickTaskActive) {
        setActiveContext(`app-${app.id}`);
        return;
      }

      const uses = ensureQuickTaskWindow(now);
      const remaining = Math.max(0, quickTaskUsesPerWindow - uses);

      if (remaining > 0) {
        setPendingQuickTaskApp(app);
        setTargetApp(app);
        setShowQuickTaskDialog(true);
        return;
      }

      beginInterventionForApp(app);
    } else {
      setActiveContext(`app-${app.id}`);
    }
  };

  const handleUnlockApp = (minutes) => {
    if (!targetApp) return;
    const expiry = Date.now() + minutes * 60 * 1000;
    setActiveSessions({ ...activeSessions, [targetApp.name]: expiry });
    setInterventionState("idle");
    setActiveContext(`app-${targetApp.id}`);
  };

  const handleHomeButton = () => {
    // Check if we are currently in a distraction app (monitored app)
    if (activeContext.startsWith("app-") && activeContext !== "app-mindful") {
      const appId = activeContext.replace("app-", "");
      const app = customApps.find((a) => a.id === appId);

      // If it's a monitored app, clear its session so intervention restarts next time
      if (app && monitoredApps.includes(app.id)) {
        const updatedSessions = { ...activeSessions };
        delete updatedSessions[app.name]; // Remove the session token
        setActiveSessions(updatedSessions);
      }
    }

    setActiveContext("launcher");
    setInterventionState("idle");
    setProactiveState(null);
    // If in session and going home -> Distracted
    if (
      userSessionState &&
      userSessionState.joined &&
      !userSessionState.isFinished
    ) {
      setUserSessionState((prev) => ({ ...prev, status: "distracted" }));
    }
  };

  const handleNotificationClick = () => {
    if (simNotification?.type === "social_planning") {
      setProactiveState("social_friday");
    } else if (simNotification?.type === "sleep_hygiene") {
      setProactiveState("sleep_hygiene");
    } else if (simNotification?.type === "late_night") {
      setProactiveState("sleep_hygiene");
    } else {
      handleLaunchApp({ id: "mindful" });
    }
    setSimNotification(null);
  };

  const handleSaveAIInspiredActivity = (suggestion) => {
    if (!suggestion || !suggestion.title) return;
    const newAlt = {
      id: `ai-inspired-${Date.now()}`,
      title: suggestion.title,
      desc: suggestion.desc,
      duration: suggestion.duration || "30m",
      type: suggestion.type || "active",
      isCustom: true,
      causes: selectedCauses.length > 0 ? selectedCauses : ["boredom"],
      actions: suggestion.actions || [],
      startTime: suggestion.startTime,
      location: suggestion.location,
      coordinates: suggestion.coordinates,
    };
    setCustomAlternatives([newAlt, ...customAlternatives]);
    setToast(`✨ Saved "${suggestion.title}"`);
    resetAIInspiredForm();
  };

  const handleSaveCustomAlternative = () => {
    if (!newAltData.title) return;
    const newAlt = {
      id: `custom-${Date.now()}`,
      ...newAltData,
      type: "custom",
      isCustom: true,
      causes: selectedCauses.length > 0 ? selectedCauses : ["boredom"],
      actions: newAltActions.filter((a) => a.trim() !== ""),
    };
    if (newAltData.isPrivate) {
      setPrivacyMap({ ...privacyMap, [newAlt.id]: true });
    }
    setCustomAlternatives([newAlt, ...customAlternatives]);
    resetNewAltForm();
  };

  const handleAddActionStep = () => setNewAltActions([...newAltActions, ""]);
  const handleActionChange = (index, value) => {
    const updated = [...newAltActions];
    updated[index] = value;
    setNewAltActions(updated);
  };

  const handleAddToMyList = (e, item) => {
    e.stopPropagation();
    if (!savedAlternativeIds.includes(item.id)) {
      setSavedAlternativeIds([...savedAlternativeIds, item.id]);
      item.likes = (item.likes || 0) + 1;
    }
  };

  const handleDeleteAlternative = (e, id) => {
    e.stopPropagation();
    setCustomAlternatives(customAlternatives.filter((a) => a.id !== id));
    setSavedAlternativeIds(savedAlternativeIds.filter((sid) => sid !== id));
    setToast("Item removed from list.");
  };

  const toggleItemPrivacy = (e, itemId) => {
    e.stopPropagation();
    setPrivacyMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const finishReflection = (rating) => {
    setInterventionState("idle");
    if (rating > 0) {
      setUserAccount((prev) => ({ ...prev, streak: prev.streak + 1 }));
      setToast("Streak +1! Well done.");
    }
  };

  const handleAddActivityFromProactive = (activity) => {
    const newItem = {
      id: `plan-${Date.now()}`,
      time: currentTime,
      duration: 60,
      title: activity.title,
      icon: "🌟",
      type: "personal",
      supervision: {
        enabled: false,
        checkScreenTime: false,
        distractedLimit: 15,
        screenTimeLimit: 60,
        buddyId: "",
      },
    };
    setDailyPlan(
      [...dailyPlan, newItem].sort((a, b) => a.time.localeCompare(b.time))
    );
    setProactiveState(null);
    setToast("Activity added to plan!");
  };

  const getDisplayAlternatives = () => {
    let pool = [];

    if (altTab === "ai") {
      return aiSuggestions; // Return AI generated list directly
    }

    if (altTab === "mylist") {
      const saved = ALL_ALTS.filter((a) => savedAlternativeIds.includes(a.id));
      pool = [...customAlternatives, ...saved];

      if (selectedCauses.length > 0) {
        pool = pool.filter((a) => {
          if (a.isCustom)
            return a.causes.some((c) => selectedCauses.includes(c));
          return selectedCauses.some((cId) =>
            ALTERNATIVES_DB[cId]?.some((dbItem) => dbItem.id === a.id)
          );
        });
      }
    } else {
      if (selectedCauses.length === 0) {
        pool = [...ALTERNATIVES_DB.boredom];
      } else {
        selectedCauses.forEach((causeId) => {
          if (ALTERNATIVES_DB[causeId])
            pool = [...pool, ...ALTERNATIVES_DB[causeId]];
        });
      }

      const unique = Array.from(new Set(pool.map((a) => a.id))).map((id) =>
        pool.find((a) => a.id === id)
      );
      pool = unique.filter((a) => !savedAlternativeIds.includes(a.id));
    }

    // --- CONTEXT AWARE FILTERING ---
    const hour = parseInt(currentTime.split(":")[0]);
    const isNight = hour >= 22 || hour < 6;

    pool = pool.filter((item) => {
      const tags = item.tags || [];
      if (weather === "rainy" && tags.includes("outdoor")) return false;
      if (isNight && tags.includes("daytime")) return false;
      if (isNight && tags.includes("social_call")) return false;
      return true;
    });

    const sorted = pool.sort((a, b) => {
      if (a.isFriend && !b.isFriend) return -1;
      if (!a.isFriend && b.isFriend) return 1;
      return (b.likes || 0) - (a.likes || 0);
    });

    return sorted;
  };

  const displayedList =
    altTab === "ai"
      ? aiSuggestions
      : getDisplayAlternatives().slice(altPage * 3, altPage * 3 + 3);
  const hasNextPage =
    altTab !== "ai" && altPage * 3 + 3 < getDisplayAlternatives().length;

  // --- HELPER RENDERERS (Defined BEFORE usage) ---

  const renderProactiveOverlay = () => {
    if (!proactiveState) return null;

    if (proactiveState === "social_friday") {
      const socialAlts = ALL_ALTS.filter(
        (a) => a.type === "social" && a.location === USER_LOCATION
      ).slice(0, 2);
      return (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col p-6 text-white animate-in slide-in-from-bottom duration-300 font-sans">
          <button
            onClick={handleHomeButton}
            className="absolute top-12 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>

          <div className="mt-12 mb-6">
            <div className="inline-block p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 mb-4 shadow-lg shadow-blue-500/30">
              <Users size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Weekend Plans?</h2>
            <p className="text-white/70 text-lg leading-snug">
              Beat the weekend blues early. Here are some social ideas:
            </p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pb-6">
            {socialAlts.map((alt, i) => (
              <div
                key={i}
                className="bg-white/10 p-4 rounded-xl border border-white/5"
              >
                <div className="font-bold text-lg mb-1">{alt.title}</div>
                <div className="text-white/60 text-xs mb-3">{alt.desc}</div>
                <button
                  onClick={() => handleAddActivityFromProactive(alt)}
                  className="w-full py-2 bg-white text-slate-900 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Add to Daily Plan
                </button>
              </div>
            ))}

            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300 mt-4 mb-2">
              Call a Friend
            </h3>
            {friendsList
              .filter((f) => f.id !== "f0" && f.status === "accepted")
              .slice(0, 2)
              .map((friend, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/5 p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${friend.avatar} flex items-center justify-center font-bold text-xs`}
                    >
                      {friend.name[0]}
                    </div>
                    <div className="font-bold text-sm">{friend.name}</div>
                  </div>
                  <button className="bg-green-500 p-2 rounded-full">
                    <Phone size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (proactiveState === "sleep_hygiene") {
      const sleepAlts = ALL_ALTS.filter(
        (a) => a.type === "calm" || a.type === "rest"
      ).slice(0, 2);
      return (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col p-6 text-white animate-in slide-in-from-bottom duration-300 font-sans">
          <button
            onClick={handleHomeButton}
            className="absolute top-12 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <div className="mt-12 mb-6">
            <div className="inline-block p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-lg shadow-indigo-500/30">
              <Moon size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Time to Wind Down</h2>
            <p className="text-white/70 text-sm">
              Using apps late affects sleep quality.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {sleepAlts.map((alt, i) => (
              <button
                key={i}
                onClick={() => handleAddActivityFromProactive(alt)}
                className="w-full text-left bg-white/10 p-4 rounded-xl hover:bg-white/20 transition-colors border border-white/5"
              >
                <div className="font-bold text-sm flex items-center gap-2">
                  <Check size={14} className="text-teal-400" /> {alt.title}
                </div>
                <div className="text-xs text-white/50 ml-6">{alt.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setToast("Sleep Mode Activated. Notifications muted.");
              handleHomeButton();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            Activate Sleep Mode
          </button>
        </div>
      );
    }
    return null;
  };

  const renderInterventionOverlay = () => {
    if (interventionState === "idle") return null;
    return (
      <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200 font-sans">
        <button
          onClick={() => {
            // When in "action" step (viewing selected alternative), go back to alternatives
            if (interventionState === "action") {
              setInterventionState("alternatives");
              setSelectedAlternative(null);
            } else {
              // Otherwise, go back to phone simulation
              handleHomeButton();
            }
          }}
          className="absolute top-12 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"
        >
          <X size={24} />
        </button>

        {interventionState === "breathing" && (
          <div className="text-center">
            <div className="mb-8 relative flex items-center justify-center">
              <div className="absolute w-40 h-40 bg-blue-500/30 rounded-full animate-ping"></div>
              <div className="relative w-32 h-32 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-5xl font-bold shadow-lg shadow-blue-500/50">
                {breathingCount}
              </div>
            </div>
            <div className="mb-4 bg-white/10 p-4 rounded-xl border border-white/20 animate-in slide-in-from-bottom-4">
              <div className="text-lg leading-snug font-semibold">Take a breath</div>
            </div>
            <p className="text-white/50 text-sm mt-4">
              Opening {targetApp?.name}...
            </p>
          </div>
        )}

        {interventionState === "root-cause" && (
          <div className="w-full max-w-md animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col h-[70vh]">
            <h2 className="text-2xl font-bold text-center mb-2">
              Why {targetApp?.name}?
            </h2>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 flex-1 content-start">
              {CAUSES.map((cause) => (
                <button
                  key={cause.id}
                  onClick={() => {
                    if (selectedCauses.includes(cause.id))
                      setSelectedCauses(
                        selectedCauses.filter((c) => c !== cause.id)
                      );
                    else setSelectedCauses([...selectedCauses, cause.id]);
                  }}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                    selectedCauses.includes(cause.id)
                      ? "bg-teal-500/20 border-teal-400 text-white"
                      : "bg-white/10 border-white/5 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <div
                    className={
                      selectedCauses.includes(cause.id)
                        ? "text-teal-300"
                        : "text-white/50"
                    }
                  >
                    {cause.icon}
                  </div>
                  <span className="font-medium">{cause.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto space-y-3">
              <button
                onClick={() => setInterventionState("alternatives")}
                disabled={selectedCauses.length === 0}
                className="w-full bg-white text-blue-900 font-bold py-3 rounded-xl disabled:opacity-50"
              >
                See Alternatives
              </button>
              <button
                onClick={() => setInterventionState("timer")}
                className="w-full py-2 text-white/40 text-sm hover:text-white"
              >
                I really need to use it.
              </button>
            </div>
          </div>
        )}

        {interventionState === "alternatives" && (
          <div className="w-full max-w-md animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col h-[80vh]">
            <div className="mb-4 border-b border-white/10 pb-2">
              <h2 className="text-2xl font-bold mb-1">Alternatives</h2>
              <p className="text-white/60 text-xs mb-4">
                Feeling:{" "}
                <span className="text-teal-300">
                  {selectedCauses
                    .map((id) => CAUSES.find((c) => c.id === id)?.label)
                    .join(", ")}
                </span>
              </p>

              {/* Full Width Tab Switcher */}
              <div className="flex bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setAltTab("discover");
                    setAltPage(0);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    altTab === "discover"
                      ? "bg-teal-500 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Globe size={12} /> Discover
                </button>
                <button
                  onClick={() => {
                    setAltTab("ai");
                    setAltPage(0);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    altTab === "ai"
                      ? "bg-purple-600 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Sparkles size={12} /> AI For You
                </button>
                <button
                  onClick={() => {
                    setAltTab("mylist");
                    setAltPage(0);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                    altTab === "mylist"
                      ? "bg-white text-slate-900"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  My List
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 relative pb-4 px-1">
              {/* AI LOADING / REGENERATE */}
              {altTab === "ai" && (
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-[10px] text-white/50 uppercase font-bold">
                    Context: {USER_LOCATION}, {weather}
                  </span>
                  <button
                    onClick={handleGenerateContextualAlternatives}
                    disabled={isGeneratingAI}
                    className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {isGeneratingAI ? (
                      <Loader size={10} className="animate-spin" />
                    ) : (
                      <RefreshCw size={10} />
                    )}{" "}
                    Regenerate
                  </button>
                </div>
              )}

              {/* AI API KEY WARNING */}
              {altTab === "ai" && !GEMINI_API_KEY && (
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center animate-in fade-in">
                  <Key size={32} className="mx-auto text-white/30 mb-3" />
                  <h3 className="text-white font-bold text-sm mb-1">
                    AI Key Required
                  </h3>
                  <p className="text-white/60 text-xs mb-4">
                    To use "AI For You" suggestions, please set the
                    REACT_APP_GEMINI_KEY environment variable.
                  </p>
                </div>
              )}

              {isAddingAlt ? (
                <div className="bg-white/10 border border-teal-500/50 p-4 rounded-xl space-y-3 mb-4 animate-in fade-in relative">
                  <h3 className="font-bold text-sm text-teal-300">
                    Create Alternative
                  </h3>

                  {/* AI SUGGESTION BUTTON */}
                  <button
                    onClick={handleMagicSuggest}
                    className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-500 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {isGeneratingAI ? (
                      <Loader size={10} className="animate-spin" />
                    ) : (
                      <Sparkles size={10} />
                    )}{" "}
                    Magic Assist
                  </button>

                  <input
                    type="text"
                    placeholder="Title (or keyword for AI)"
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white"
                    value={newAltData.title}
                    onChange={(e) =>
                      setNewAltData({ ...newAltData, title: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Desc"
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white"
                    value={newAltData.desc}
                    onChange={(e) =>
                      setNewAltData({ ...newAltData, desc: e.target.value })
                    }
                  />

                  {/* Actions Preview */}
                  {newAltActions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">
                        Steps:
                      </p>
                      {newAltActions.map((step, i) => (
                        <div
                          key={i}
                          className="text-[10px] text-white bg-white/5 px-2 py-1 rounded"
                        >
                          {i + 1}. {step}
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-white/60 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAltData.isPrivate}
                      onChange={(e) =>
                        setNewAltData({
                          ...newAltData,
                          isPrivate: e.target.checked,
                        })
                      }
                      className="rounded bg-white/10 border-white/30"
                    />
                    {newAltData.isPrivate ? (
                      <EyeOff size={12} />
                    ) : (
                      <Globe size={12} />
                    )}
                    {newAltData.isPrivate
                      ? "Private (Not seen by friends)"
                      : "Visible to friends"}
                  </label>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveCustomAlternative}
                      className="flex-1 bg-teal-600 py-2 rounded-lg text-sm font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={resetNewAltForm}
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : showAIInspiredForm ? (
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/50 p-4 rounded-xl space-y-3 mb-4 animate-in fade-in relative">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Sparkles size={16} />
                      Get Inspired by AI
                    </h3>
                    <button
                      onClick={resetAIInspiredForm}
                      className="text-white/50 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {aiInspiredSuggestions.length === 0 ? (
                    <>
                      {/* API Key Warning */}
                      {(!(GEMINI_API_KEY && typeof GEMINI_API_KEY === 'string' && GEMINI_API_KEY.trim() !== "" && GEMINI_API_KEY !== "undefined")) && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-yellow-200">
                              <p className="font-bold mb-1">Demo Mode (No API Key)</p>
                              <p className="text-yellow-300/80">
                                Set REACT_APP_GEMINI_KEY environment variable for real AI. Currently using demo data.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Input Form */}
                      <input
                        type="text"
                        placeholder="Topic or interest (e.g., 'watch a movie', 'stretching')"
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-white/40"
                        value={aiInspiredFormData.topic}
                        onChange={(e) =>
                          setAiInspiredFormData({
                            ...aiInspiredFormData,
                            topic: e.target.value,
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Location (e.g., 'Park', 'Downtown', 'At home')"
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-white/40"
                          value={aiInspiredFormData.location}
                          onChange={(e) =>
                            setAiInspiredFormData({
                              ...aiInspiredFormData,
                              location: e.target.value,
                            })
                          }
                        />
                        <button
                          onClick={handleGetCurrentLocation}
                          disabled={isGettingLocation}
                          className="bg-blue-600/80 hover:bg-blue-600 px-3 rounded-lg flex items-center gap-1 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Use my current location"
                        >
                          {isGettingLocation ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <MapPin size={14} />
                          )}
                        </button>
                      </div>
                      <textarea
                        placeholder="Participants & preferences (optional) (e.g., '2 people, prefer quiet', 'romantic movie for me and my girlfriend')"
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-white/40 resize-none"
                        rows={2}
                        value={aiInspiredFormData.participantsDescription}
                        onChange={(e) =>
                          setAiInspiredFormData({
                            ...aiInspiredFormData,
                            participantsDescription: e.target.value,
                          })
                        }
                      />

                      {/* Emotion Checkbox */}
                      {selectedCauses.length > 0 && (
                        <label className="flex items-center gap-2 text-white/70 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aiInspiredFormData.useCurrentEmotion}
                            onChange={(e) =>
                              setAiInspiredFormData({
                                ...aiInspiredFormData,
                                useCurrentEmotion: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <span>
                            For current emotion:{" "}
                            <span className="text-purple-300 font-semibold">
                              {selectedCauses
                                .map((id) => CAUSES.find((c) => c.id === id)?.label)
                                .join(", ")}
                            </span>
                          </span>
                        </label>
                      )}

                      {/* Context Info */}
                      <div className="text-[10px] text-white/40 space-y-1 pt-2 border-t border-white/10">
                        <p>📍 Location: {USER_LOCATION}</p>
                        {userCoordinates && (
                          <p className="text-green-400">
                            🎯 GPS: {userCoordinates.lat.toFixed(4)}, {userCoordinates.lng.toFixed(4)}
                          </p>
                        )}
                        <p>🌤️ Weather: {weather}</p>
                        {targetApp && <p>📱 Triggered by: {targetApp.name}</p>}
                      </div>

                      {/* Generate Button */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleGenerateAIInspiredActivities}
                          disabled={isGeneratingAI}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader size={14} className="animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              Generate Ideas
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetAIInspiredForm}
                          className="px-4 py-2 bg-white/10 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* AI Suggestions Display */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-white/60">
                            AI generated {aiInspiredSuggestions.length} suggestions
                          </p>
                          <button
                            onClick={() => setAiInspiredSuggestions([])}
                            className="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1"
                          >
                            <ArrowLeft size={10} />
                            Back to form
                          </button>
                        </div>

                        {aiInspiredSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="bg-black/30 rounded-lg p-3 space-y-2 border border-white/10"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold text-sm text-white">
                                  {suggestion.title}
                                </h4>
                                {suggestion.startTime && (
                                  <p className="text-[10px] text-purple-300 mt-1">
                                    ⏰ Start: {suggestion.startTime} • Duration:{" "}
                                    {suggestion.duration}
                                  </p>
                                )}
                              </div>
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded uppercase font-bold">
                                {suggestion.type}
                              </span>
                            </div>
                            <p className="text-xs text-white/70">{suggestion.desc}</p>

                            {/* Action Steps */}
                            {suggestion.actions && suggestion.actions.length > 0 && (
                              <div className="space-y-1 pt-2">
                                <p className="text-[10px] font-bold text-white/50">
                                  Action Steps:
                                </p>
                                {suggestion.actions.map((action, i) => (
                                  <div
                                    key={i}
                                    className="text-[10px] text-white/70 bg-white/5 px-2 py-1 rounded"
                                  >
                                    {i + 1}. {action}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setSelectedAlternative({
                                    ...suggestion,
                                    id: `ai-inspired-temp-${idx}`,
                                  });
                                  setInterventionState("action");
                                }}
                                className="flex-1 bg-teal-600 hover:bg-teal-500 py-1.5 rounded text-xs font-bold"
                              >
                                Start Now
                              </button>
                              <button
                                onClick={() => handleSaveAIInspiredActivity(suggestion)}
                                className="flex-1 bg-purple-600 hover:bg-purple-500 py-1.5 rounded text-xs font-bold"
                              >
                                Save to List
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                altTab === "mylist" && (
                  <div className="space-y-2 mb-2">
                    <button
                      onClick={() => setIsAddingAlt(true)}
                      className="w-full p-4 border-2 border-dashed border-white/20 text-white/50 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                    >
                      <Plus size={16} /> Add your own idea
                    </button>
                    <button
                      onClick={() => setShowAIInspiredForm(true)}
                      className="w-full p-4 border-2 border-dashed border-purple-500/30 bg-purple-900/10 text-purple-300 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-900/20 transition-all"
                    >
                      <Sparkles size={16} /> Get inspired by AI
                    </button>
                  </div>
                )
              )}

              {/* AI LOADING SKELETON */}
              {altTab === "ai" && isGeneratingAI && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-white/5 rounded-xl animate-pulse"
                    ></div>
                  ))}
                </div>
              )}

              {displayedList && displayedList.length > 0
                ? displayedList.map((alt, i) => {
                    const isPrivate = privacyMap[alt.id] || alt.isPrivate;

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedAlternative(alt);
                          setInterventionState("action");
                        }}
                        className={`bg-white rounded-xl p-4 flex flex-col gap-2 relative group cursor-pointer transition-transform ${
                          altTab === "ai" ? "" : "hover:scale-[1.02]"
                        }`}
                      >
                        {/* BADGES ROW */}
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex gap-2">
                            {/* AI BADGE */}
                            {altTab === "ai" && (
                              <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <Sparkles size={10} /> AI Suggestion
                              </div>
                            )}

                            {alt.isFriend ? (
                              <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <Users size={10} /> {alt.friendName}
                              </div>
                            ) : (
                              altTab !== "ai" && (
                                <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  <MapPin size={10} />{" "}
                                  {getDistanceDisplay(alt.location, USER_LOCATION, alt.desc, alt.title, state.userCoordinates, alt.coordinates)}
                                </div>
                              )
                            )}
                            {(alt.likes || 0) > 0 && (
                              <div className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <Heart size={10} className="fill-orange-600" />{" "}
                                {alt.likes}
                              </div>
                            )}
                            {/* Privacy Badge for My List items */}
                            {altTab === "mylist" && isPrivate && (
                              <div className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <EyeOff size={10} /> Private
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {/* Privacy Toggle for My List */}
                            {altTab === "mylist" && (
                              <button
                                onClick={(e) => toggleItemPrivacy(e, alt.id)}
                                className="text-slate-300 hover:text-slate-500 p-1 rounded-full transition-colors"
                              >
                                {isPrivate ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            )}
                            {/* Delete Button for My List */}
                            {altTab === "mylist" && (
                              <button
                                onClick={(e) =>
                                  handleDeleteAlternative(e, alt.id)
                                }
                                className="text-slate-300 hover:text-red-500 p-1 rounded-full transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {/* Download button only in Discover/AI */}
                            {altTab !== "mylist" && (
                              <button
                                onClick={(e) => handleAddToMyList(e, alt)}
                                className="text-slate-300 hover:text-teal-500 hover:bg-teal-50 p-1 rounded-full transition-colors border border-transparent hover:border-teal-100"
                              >
                                <Download size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-slate-900 font-bold text-lg leading-tight">
                              {alt.title}
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">
                              {alt.desc}
                            </p>
                          </div>
                          <div className="bg-slate-5 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                            {alt.duration}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-[11px] text-slate-400">
                            {alt.location || "Flexible timing"}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleOpenAltScheduler(alt);
                            }}
                            className={`text-[11px] relative z-10 ${
                              altTab === "ai"
                                ? "text-slate-500 hover:text-slate-700"
                                : "font-bold text-blue-600 hover:underline"
                            }`}
                          >
                            Plan this activity
                          </button>
                        </div>
                      </div>
                    );
                  })
                : !isGeneratingAI &&
                  altTab !== "ai" && (
                    <div className="text-white/40 text-center py-10">
                      <div className="text-4xl mb-2">🌧️</div>
                      <div className="text-sm">Nothing found.</div>
                      <div className="text-xs opacity-70">
                        Try changing context or adding ideas!
                      </div>
                    </div>
                  )}
            </div>

            <div className="mt-2 flex justify-between items-center pt-2 border-t border-white/10">
              <button
                disabled={altPage === 0}
                onClick={() => setAltPage((p) => p - 1)}
                className="text-xs text-white/60 hover:text-white disabled:opacity-20"
              >
                Previous
              </button>
              <button
                disabled={hasNextPage === false}
                onClick={() => setAltPage((p) => p + 1)}
                className="text-xs text-white/60 hover:text-white disabled:opacity-20"
              >
                Next Page
              </button>
            </div>
            <button
              onClick={() => setInterventionState("timer")}
              className="w-full py-2 text-white/40 text-sm hover:text-white mt-2"
            >
              Ignore & Continue
            </button>
          </div>
        )}

        {interventionState === "action" && selectedAlternative && (
          <div className="text-center animate-in zoom-in w-full max-w-md">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Great Choice!</h2>
            <p className="text-white/70 mb-6">
              Put the phone down and {selectedAlternative.title.toLowerCase()}.
            </p>
            <div className="bg-white/10 rounded-2xl p-6 text-left mb-8 border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">
                Action Steps
              </h3>
              <ol className="list-decimal pl-5 space-y-4 text-sm">
                {selectedAlternative.actions &&
                  selectedAlternative.actions.map((step, idx) => (
                    <li key={idx} className="pl-2 text-white">
                      {step}
                    </li>
                  ))}
              </ol>
            </div>
            {/* UPDATED: Start Button instead of Complete */}
            <button
              onClick={() => handleStartAlternative(selectedAlternative)}
              className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
            >
              <Play size={20} /> Start Activity
            </button>
            <button
              onClick={() => handleOpenAltScheduler(selectedAlternative)}
              className="mt-3 border border-white/30 text-white px-8 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/15 transition-colors"
            >
              <CalendarDays size={18} /> Plan for later
            </button>
          </div>
        )}

        {/* NEW: Action Timer State */}
        {interventionState === "action_timer" && selectedAlternative && (
          <div className="text-center animate-in zoom-in w-full max-w-md">
            <div className="mb-8 relative flex items-center justify-center">
              <div className="absolute w-56 h-56 bg-teal-500/10 rounded-full animate-pulse"></div>
              <div className="relative w-48 h-48 rounded-full border-4 border-teal-500 flex flex-col items-center justify-center text-white bg-slate-900 shadow-2xl shadow-teal-500/30">
                <div className="text-5xl font-bold tabular-nums tracking-tight">
                  {formatSeconds(actionTimer)}
                </div>
                <div className="text-xs text-teal-400 font-bold uppercase tracking-wider mt-2">
                  Focusing
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {selectedAlternative.title}
            </h2>
            <p className="text-white/50 text-sm mb-8">
              Keep going, you're doing great.
            </p>

            {/* ACTION STEPS UNDER TIMER (NEW) */}
            {selectedAlternative.actions && (
              <div className="bg-white/10 p-4 rounded-xl text-left w-full mb-6 border border-white/5 animate-in slide-in-from-bottom-4">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
                  Steps
                </h4>
                <ol className="list-decimal pl-4 space-y-1">
                  {selectedAlternative.actions.map((step, i) => (
                    <li key={i} className="text-sm text-white/80">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <button
              onClick={() => setInterventionState("reflection")}
              className="bg-white/10 border border-white/20 text-white px-8 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <Check size={20} />{" "}
              {actionTimer === 0 ? "Complete & Reflect" : "Finish Early"}
            </button>
          </div>
        )}

        {interventionState === "timer" && (
          <div className="w-full max-w-md text-center animate-in slide-in-from-bottom-10">
            <Clock size={48} className="mx-auto mb-4 text-white/50" />
            <h2 className="text-2xl font-bold mb-2">Set Intention Timer</h2>
            <div className="grid grid-cols-3 gap-3 mb-8 mt-6">
              {[5, 15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => handleUnlockApp(m)}
                  className="bg-white/10 hover:bg-white/20 border border-white/10 py-4 rounded-xl font-bold text-xl"
                >
                  {m}m
                </button>
              ))}
            </div>
            <button
              onClick={() => handleUnlockApp(1)}
              className="text-white/30 text-sm hover:text-white"
            >
              Just 1 min
            </button>
          </div>
        )}

        {interventionState === "reflection" && (
          <div className="text-center animate-in zoom-in w-full max-w-md">
            <div className="mb-6">
              <div className="text-4xl mb-2">✨</div>
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-white/60 text-sm">How did that feel?</p>
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => finishReflection(1)}
                className="p-4 bg-white/10 rounded-2xl hover:bg-green-500/20 transition-colors text-3xl hover:scale-110"
              >
                😊
              </button>
              <button
                onClick={() => finishReflection(0)}
                className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors text-3xl hover:scale-110"
              >
                😐
              </button>
              <button
                onClick={() => finishReflection(-1)}
                className="p-4 bg-white/10 rounded-2xl hover:bg-red-500/20 transition-colors text-3xl hover:scale-110"
              >
                😫
              </button>
            </div>
            <button
              onClick={() => finishReflection(0)}
              className="text-white/40 text-sm hover:text-white"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    );
  };

  const StatusBar = ({ dark = false }) => (
    <div
      className={`flex justify-between items-center px-6 py-3 text-xs font-bold ${
        dark ? "text-slate-900" : "text-white"
      }`}
    >
      <span>{currentTime}</span>
      <div className="flex gap-1.5 items-center">
        <Signal size={12} />
        <Wifi size={12} />
        <Battery size={14} />
      </div>
    </div>
  );

  const renderQuickTaskBadge = () => {
    if (!isQuickTaskActive) return null;
    const secondsLeft = Math.max(
      0,
      Math.floor((quickTaskActiveUntil - Date.now()) / 1000)
    );
    return (
      <div className="mx-4 mt-2 p-3 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between z-50">
        <div className="text-xs font-bold uppercase tracking-wide">
          Quick task mode
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Timer size={14} /> {formatSeconds(secondsLeft)}
        </div>
      </div>
    );
  };

  const renderQuickTaskDialogUI = () => (
    <QuickTaskDialog
      open={showQuickTaskDialog}
      remainingUses={quickTaskRemainingUses}
      durationMinutes={quickTaskDurationMinutes}
      onClose={() => {
        setShowQuickTaskDialog(false);
        setPendingQuickTaskApp(null);
      }}
      onQuickTask={() => handleStartQuickTask(pendingQuickTaskApp || targetApp)}
      onConscious={() => handleGoConscious(pendingQuickTaskApp || targetApp)}
    />
  );

  // --- MAIN RENDER ---

  const todayIso = new Date().toISOString().slice(0, 10);

  const formatDateLabel = (dateVal) => {
    if (!dateVal) return "TBD";
    try {
      return new Date(dateVal).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return dateVal;
    }
  };

  const buildTimeLabel = (start, end) =>
    end ? `${start || "TBD"} - ${end}` : start || "TBD";

  const updateCommunityData = (updater) =>
    actions.setCommunityData((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );

  // Adds a solo/AI activity into My Upcoming and persists via community store.
  const addSoloActivity = (
    payload,
    { source = "manual", toastMessage, skipPlanModalClose = false, onComplete } = {}
  ) => {
    const readableDate = formatDateLabel(payload.date || todayIso);
    const timeLabel = buildTimeLabel(
      payload.time || payload.timePreference || payload.timeOfDay,
      payload.endTime
    );
    const entry = {
      id: `ua-${Date.now()}`,
      title: payload.title || "Planned activity",
      description: payload.description || payload.steps || payload.topic,
      date: readableDate,
      time: timeLabel || "TBD",
      location: payload.location || "TBD",
      eventPlace: payload.eventPlace,
      hostType: "self",
      hostId: currentUser.id,
      hostName: currentUser.name,
      visibility: payload.visibility || "private",
      status: payload.status || "confirmed",
      maxParticipants: payload.maxParticipants ?? payload.participantLimit,
      participantLimit: payload.participantLimit ?? payload.maxParticipants,
      duration: payload.duration,
      topic: payload.topic,
      invited: payload.invited || [],
      source,
    };

    updateCommunityData((prev) => ({
      ...prev,
      upcomingActivities: [entry, ...prev.upcomingActivities],
    }));
    const nextToast =
      toastMessage ||
      (source === "ai"
        ? "AI idea added to My Upcoming"
        : "Activity saved to My Upcoming");
    setToast(nextToast);
    if (!skipPlanModalClose && onComplete) {
      onComplete();
    }
  };

  const handleSavePlannedAlternative = (formData) => {
    if (!formData) return;
    const participantLimit =
      formData.participantLimit !== undefined && formData.participantLimit !== ""
        ? Number(formData.participantLimit)
        : undefined;
    const payload = {
      ...formData,
      title: formData.title || altPlanDraft?.title || "Planned activity",
      description: formData.description || altPlanDraft?.desc,
      location: formData.location || altPlanDraft?.location || "TBD",
      eventPlace: formData.eventPlace,
      visibility: formData.visibility || "friends",
      timePreference: formData.timePreference || formData.timeOfDay,
      participantLimit,
      maxParticipants: participantLimit,
      invited: formData.invited || [],
      status: "confirmed",
    };
    addSoloActivity(payload, {
      source: "alt-plan",
      toastMessage: "Saved to My Upcoming Activities",
      skipPlanModalClose: true,
    });
    setShowAltScheduler(false);
    setAltPlanDraft(null);
  };

  const bgClass = settings.theme === "forest" ? "bg-emerald-900" : "bg-black";
  
  // Render modals that should be available everywhere
  const renderGlobalModals = () => (
    <>
      {showAltScheduler && (
        <AltSchedulerModal
          isOpen={showAltScheduler}
          activity={altPlanDraft || selectedAlternative}
          friends={friendsList.filter((f) => f.id !== currentUserId)}
          onSave={handleSavePlannedAlternative}
          onClose={() => {
            setShowAltScheduler(false);
            setAltPlanDraft(null);
          }}
        />
      )}
    </>
  );

  if (activeContext === "launcher") {
    return (
      <>
        {renderGlobalModals()}
        <PhoneShell statusBar={<StatusBar />} bg={bgClass}>
        {simNotification && (
          <div
            className="mx-4 mt-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg animate-in slide-in-from-top-2 flex items-start gap-3 z-20 cursor-pointer"
            onClick={handleNotificationClick}
          >
            <div
              className={`p-2 rounded-xl text-white ${
                simNotification.type === "social_planning"
                  ? "bg-indigo-500"
                  : simNotification.type === "sleep_hygiene"
                  ? "bg-purple-600"
                  : "bg-blue-500"
              }`}
            >
              {simNotification.type === "social_planning" ? (
                <Users size={16} />
              ) : simNotification.type === "sleep_hygiene" ? (
                <Moon size={16} />
              ) : (
                <Sparkles size={16} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900">
                  BreakLoop • Now
                </span>
              </div>
              <h4 className="font-bold text-sm text-gray-800">
                {simNotification.title}
              </h4>
              <p className="text-xs text-gray-600 leading-snug">
                {simNotification.body}
              </p>
            </div>
          </div>
        )}

        {renderQuickTaskBadge()}

        {/* TOAST NOTIFICATION FOR LAUNCHER */}
        {toast && (
          <div className="absolute top-12 left-4 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-lg z-[60] animate-in slide-in-from-top flex items-center gap-3">
            <Check size={16} className="text-green-400" />
            <div className="text-xs font-bold">{toast}</div>
          </div>
        )}

        {/* ACTIVE SESSION WIDGET ON LAUNCHER */}
        {userSessionState &&
          userSessionState.joined &&
          !userSessionState.isFinished && (
            <div
              className="mx-4 mt-2 mb-2 p-3 bg-indigo-600 rounded-2xl shadow-lg flex items-center justify-between text-white cursor-pointer"
              onClick={() => handleLaunchApp({ id: "mindful" })}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl animate-pulse">
                  <Target size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                    Session Active
                  </div>
                  <div className="font-bold text-sm">Tap to return</div>
                </div>
              </div>
              <div className="text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">
                Live
              </div>
            </div>
          )}

        <div className="grid grid-cols-4 gap-x-4 gap-y-8 p-6 pt-8 flex-1 align-content-start relative z-10">
          <AppIcon
            id="mindful"
            name="BreakLoop"
            color="bg-violet-600"
            icon={<Shield size={28} className="text-white" />}
            onClick={() => handleLaunchApp({ id: "mindful" })}
          />
          {customApps.map((app) => (
            <AppIcon
              key={app.id}
              id={app.id}
              name={app.name}
              color={app.color}
              icon={getIcon(app?.iconName)}
              isUnlocked={
                activeSessions[app.name] &&
                Date.now() < activeSessions[app.name]
              }
              isMonitored={monitoredApps.includes(app.id)}
              onClick={() => handleLaunchApp(app)}
            />
          ))}
        </div>
        <div className="mx-4 mb-6 p-4 bg-white/20 backdrop-blur-md rounded-3xl flex justify-around z-10">
          <DockIcon
            bg="bg-green-500"
            icon={
              <Phone size={24} fill="currentColor" className="text-white" />
            }
          />
          <DockIcon
            bg="bg-blue-400"
            icon={<Globe size={24} className="text-white" />}
          />
          <DockIcon
            bg="bg-slate-700"
            icon={<MessageCircle size={24} className="text-white" />}
          />
          <DockIcon
            bg="bg-orange-400"
            icon={<span className="text-2xl">🎵</span>}
          />
        </div>

        {/* SIMULATION CONTROLS */}
        <div className="absolute bottom-28 left-0 right-0 flex justify-center flex-wrap gap-2 z-50 pointer-events-none px-4">
          <button
            className="bg-black/80 text-white text-[10px] px-3 py-1.5 rounded-full pointer-events-auto backdrop-blur-sm border border-white/10 hover:bg-black transition-colors"
            onClick={() => setSimNotification(null)}
          >
            Reset
          </button>
          <button
            className="bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-full pointer-events-auto font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-colors"
            onClick={() => {
              setSimNotification({
                title: "Weekend Approaching",
                body: "Beat the blues. Plan a social activity now?",
                action: "Plan",
                type: "social_planning",
              });
            }}
          >
            Sim: Friday
          </button>
          <button
            className="bg-slate-700 text-white text-[10px] px-3 py-1.5 rounded-full pointer-events-auto font-bold shadow-lg hover:bg-slate-600 transition-colors"
            onClick={() => {
              setSimNotification({
                title: "Late Night",
                body: "It's late. Filtering social activities.",
                action: "Ok",
                type: "late_night",
              });
            }}
          >
            Sim: 23:30
          </button>
          <button
            className={`text-white text-[10px] px-3 py-1.5 rounded-full pointer-events-auto font-bold shadow-lg transition-colors flex items-center gap-1 ${
              weather === "rainy" ? "bg-blue-500" : "bg-orange-500"
            }`}
            onClick={() => {
              setWeather((w) => (w === "sunny" ? "rainy" : "sunny"));
            }}
          >
            {weather === "sunny" ? <Sun size={10} /> : <CloudRain size={10} />}{" "}
            {weather}
          </button>
        </div>

        {renderInterventionOverlay()}
        {renderProactiveOverlay()}
        {renderQuickTaskDialogUI()}
      </PhoneShell>
      </>
    );
  }

  if (activeContext === "app-mindful") {
    return (
      <>
        {renderQuickTaskDialogUI()}
        <BreakLoopConfig
          onClose={handleHomeButton}
          state={state}
          actions={actions}
          onOpenAltScheduler={handleOpenAltScheduler}
          onSavePlannedAlternative={handleSavePlannedAlternative}
          addSoloActivity={addSoloActivity}
        />
      </>
    );
  }

  const dummyApp = customApps.find((a) => `app-${a.id}` === activeContext) || {
    name: "App",
    color: "bg-slate-800",
  };
  const expiry = activeSessions[dummyApp.name];
  const timeLeft = expiry ? Math.ceil((expiry - Date.now()) / 60000) : 0;

  return (
    <PhoneShell statusBar={<StatusBar dark />} bg="bg-white">
      {/* TOAST FOR DUMMY APP */}
      {toast && (
        <div className="absolute top-14 left-4 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-lg z-[60] animate-in slide-in-from-top flex items-center gap-3">
          <Check size={16} className="text-green-400" />
          <div className="text-xs font-bold">{toast}</div>
        </div>
      )}
      {renderQuickTaskBadge()}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white relative z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleHomeButton}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-xl">{dummyApp.name}</span>
        </div>
        {timeLeft > 0 ? (
          <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
            <Timer size={12} /> {timeLeft}m
            <button
              onClick={() => {
                setInterventionState("idle");
                handleHomeButton();
              }}
              className="ml-2 text-[10px] bg-white/20 px-1.5 rounded hover:bg-white/30"
            >
              Finish
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>
      <div className="flex-1 bg-slate-50 p-4 space-y-4 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white h-40 rounded-xl shadow-sm"></div>
        ))}
      </div>
      <div className="py-4 flex justify-center bg-white border-t border-slate-100 relative z-10">
        <button
          onClick={handleHomeButton}
          className="w-32 h-1.5 bg-slate-300 rounded-full hover:bg-slate-400 active:scale-95 transition-all"
        ></button>
      </div>
      {/* INTERVENTION OVERLAY */}
      {interventionState !== "idle" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center text-white">
          {/* Animated gradient background layer (calming, CSS-only) */}
          <div className="gradient-animated absolute inset-0" aria-hidden="true" />
          {/* Subtle vignette to darken edges for focus and depth */}
          <div className="gradient-vignette absolute inset-0" aria-hidden="true" />
          {/* Optional very light texture/noise overlay for depth */}
          <div className="noise-overlay absolute inset-0" aria-hidden="true" />
          {/* Content layer remains on top the background layers */}
          {renderInterventionOverlay()}
        </div>
      )}
      {renderQuickTaskDialogUI()}
      {showAltScheduler && (
        <div className="fixed inset-0 bg-red-500/50 z-[999] flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl">
            <h1 className="text-2xl font-bold">TEST MODAL VISIBLE!</h1>
            <button 
              onClick={() => {
                setShowAltScheduler(false);
                setAltPlanDraft(null);
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Close Test
            </button>
          </div>
        </div>
      )}
      {showAltScheduler && (
        <AltSchedulerModal
          isOpen={showAltScheduler}
          activity={altPlanDraft || selectedAlternative}
          friends={friendsList.filter((f) => f.id !== currentUserId)}
          onSave={handleSavePlannedAlternative}
          onClose={() => {
            console.log("🔒 Closing scheduler modal");
            setShowAltScheduler(false);
            setAltPlanDraft(null);
          }}
        />
      )}
    </PhoneShell>
  );
}

function QuickTaskDialog({
  open,
  remainingUses,
  durationMinutes,
  onQuickTask,
  onConscious,
  onClose,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md px-6 py-8 space-y-8 text-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-4 p-2 text-gray-400 hover:text-gray-300"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            QUICK TASK
          </p>
          <h2 className="text-3xl font-medium text-white">
            Quick, necessary task?
          </h2>
          <p className="text-base text-gray-400">
            {remainingUses > 0
              ? `${remainingUses} left in this 15-minute window.`
              : "No quick tasks left right now."}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={onConscious}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-2xl transition-colors"
          >
            Start conscious process
          </button>
          <button
            onClick={onQuickTask}
            disabled={remainingUses <= 0}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-4 rounded-2xl transition-colors disabled:bg-gray-900 disabled:text-gray-600"
          >
            Quick Task
          </button>
        </div>

        {/* Footer text */}
        <p className="text-sm text-gray-500 leading-relaxed pt-4">
          Quick tasks skip the full intervention for urgent moments and expire
          automatically.
        </p>
      </div>
    </div>
  );
}

function BreakLoopConfig({
  onClose,
  state,
  actions,
  onOpenAltScheduler = () => {},
  onSavePlannedAlternative,
  addSoloActivity,
}) {
  // Derive currentUser from state
  const currentUserId = state.currentUserId;
  const currentUser =
    state.friendsList?.find((f) => f.id === currentUserId) || {
      id: currentUserId,
      name: "You",
    };
  const friendsList = state.friendsList;
  const todayIso = new Date().toISOString().slice(0, 10);
  
  // Helper functions for date and time formatting
  const formatDateLabel = (dateVal) => {
    if (!dateVal) return "TBD";
    try {
      return new Date(dateVal).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return dateVal;
    }
  };

  const buildTimeLabel = (start, end) =>
    end ? `${start || "TBD"} - ${end}` : start || "TBD";

  // Helper to update community data using actions from parent
  const updateCommunityData = (updater) =>
    actions.setCommunityData((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  
  // Local ref for live session timeout
  const liveSessionTimeoutRef = useRef(null);

  const [activeTab, setActiveTab] = useState("insights");
  const [statsPeriod, setStatsPeriod] = useState("Today");

  const [isEditingValues, setIsEditingValues] = useState(false);
  const [newValueCard, setNewValueCard] = useState({ label: "", icon: "❤️" });
  const [isEditingApps, setIsEditingApps] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [viewingFriend, setViewingFriend] = useState(null);
  // Controls the new Plan Activity modal (replaces inline stub card).
  const [showPlanModal, setShowPlanModal] = useState(false);
  // Community tab horizontal menu (friends | my-upcoming | discover | plan)
  const [communityMenu, setCommunityMenu] = useState("friends");
  const [activityToEdit, setActivityToEdit] = useState(null);

  // New states for Friends/Buddies
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isAddingBuddy, setIsAddingBuddy] = useState(false);
  const [addFriendTab, setAddFriendTab] = useState("phone");
  const [messagingBuddy, setMessagingBuddy] = useState(null);
  const [callingBuddy, setCallingBuddy] = useState(null);

  // SESSION STATES
  const [joiningSession, setJoiningSession] = useState(null); // The session object being joined
  const [selectedSessionApps, setSelectedSessionApps] = useState(["mindful"]); // List of allowed app IDs
  const [leavingSession, setLeavingSession] = useState(false);
  const [leaveCountdown, setLeaveCountdown] = useState(5);
  const [sessionChatMsg, setSessionChatMsg] = useState("");
  const [sessionChatHistory, setSessionChatHistory] = useState([]);

  // AI INSIGHT STATE
  const [aiInsight, setAiInsight] = useState(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  // DELETED: isGeneratingPlan state (AI Auto-Plan removed)

  // CHAT UI STATE
  const [chatInput, setChatInput] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);

  // INBOX STATE (Phase E-2d)
  const [inboxSubTab, setInboxSubTab] = useState("updates"); // "messages" or "updates"
  const [unresolvedUpdates, setUnresolvedUpdates] = useState([]);

  const [toast, setToast] = useState(null);

  // Pre-calc chart maximums so bars always have a visible height
  const todayMaxMinutes = Math.max(
    ...SCREEN_TIME_DATA.today.hourlyBreakdown.map((h) => h.minutes),
    0
  );
  const weekMaxValue = Math.max(
    ...SCREEN_TIME_DATA.week.dailyBreakdown.map((day) => day.val),
    0
  );
  const monthMaxValue = Math.max(
    ...SCREEN_TIME_DATA.month.weeklyBreakdown.map((week) => week.val),
    0
  );

  useEffect(() => {
    actions.setCurrentTime("09:41");
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Load unresolved updates when entering inbox tab or when updates might have changed
  useEffect(() => {
    if (activeTab === "inbox") {
      setUnresolvedUpdates(getUnresolvedUpdates());
    }
  }, [activeTab]);

  // Session Leave Timer
  useEffect(() => {
    let timer;
    if (leavingSession && leaveCountdown > 0) {
      timer = setTimeout(() => setLeaveCountdown((c) => c - 1), 1000);
    } else if (leavingSession && leaveCountdown === 0) {
      // Actually leave
      actions.setUserSessionState(null);
      setLeavingSession(false);
    }
    return () => clearTimeout(timer);
  }, [leavingSession, leaveCountdown]);

  const nowTs = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const quickTasksToday = (state.quickTaskLog || []).filter(
    (q) => q.startedAt >= startOfDay.getTime()
  ).length;
  const quickTasksWeek = (state.quickTaskLog || []).filter(
    (q) => q.startedAt >= nowTs - 7 * 24 * 60 * 60 * 1000
  ).length;
  const quickTaskSecondsLeft =
    state.quickTaskActiveUntil && state.quickTaskActiveUntil > nowTs
      ? Math.max(0, Math.floor((state.quickTaskActiveUntil - nowTs) / 1000))
      : 0;
  const quickTaskInsight =
    state.quickTaskLog && state.quickTaskLog.length > 0
      ? (() => {
          const evening = state.quickTaskLog.filter((q) => {
            const hour = new Date(q.startedAt).getHours();
            return hour >= 18 || hour < 6;
          }).length;
          const morning = state.quickTaskLog.filter((q) => {
            const hour = new Date(q.startedAt).getHours();
            return hour >= 6 && hour < 12;
          }).length;
          if (evening / state.quickTaskLog.length > 0.5) {
            return "You mostly used quick tasks in the evening.";
          }
          if (morning / state.quickTaskLog.length > 0.4) {
            return "You often use quick tasks in the morning.";
          }
          return "Quick tasks are spread across the day. Consider pairing them with a reflection.";
        })()
      : null;

  const findActivityById = useCallback(
    (id) => {
      // First try direct id match
      let found = state.upcomingActivities.find((a) => a.id === id) ||
        state.friendSharedActivities.find((a) => a.id === id) ||
        state.sharedCurrentActivities.find((a) => a.id === id) ||
        state.publicEvents.find((a) => a.id === id);
      
      // If not found, try matching by sourceId (for activities added to upcomingActivities)
      if (!found) {
        found = state.upcomingActivities.find((a) => a.sourceId === id);
      }
      
      return found;
    },
    [
      state.sharedCurrentActivities,
      state.friendSharedActivities,
      state.publicEvents,
      state.upcomingActivities,
    ]
  );

  useEffect(() => {
    if (!selectedActivity) return;
    // Try to find the activity in any list, checking both id and sourceId
    const next =
      findActivityById(selectedActivity.id) ||
      (selectedActivity.sourceId && findActivityById(selectedActivity.sourceId)) ||
      // Also check if any upcomingActivity has sourceId matching this activity's id
      state.upcomingActivities.find((a) => a.sourceId === selectedActivity.id);
    if (next) {
      setSelectedActivity((prev) => {
        // Only update if the content actually changed
        const hasChanges = Object.keys(next).some(key => next[key] !== prev[key]);
        return hasChanges ? { ...prev, ...next } : prev;
      });
    }
  }, [
    state.upcomingActivities,
    state.friendSharedActivities,
    state.sharedCurrentActivities,
    state.publicEvents,
    findActivityById,
    selectedActivity,
  ]);

  // CHAT HANDLERS
  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !state.activeChatFriend) return;
    const friendId = state.activeChatFriend.id;
    
    // Get or create conversation
    const conversationId = getConversationId(currentUserId, friendId);
    getOrCreateConversation(currentUserId, friendId);
    
    // Add message to global store
    addMessageToConversation(conversationId, {
      senderId: currentUserId,
      senderName: currentUser.name,
      text: chatInput.trim(),
    });
    
    setChatInput("");

    // Auto reply simulation
    setTimeout(() => {
      addMessageToConversation(conversationId, {
        senderId: friendId,
        senderName: state.activeChatFriend.name,
        text: "Sounds good! 👍",
      });
    }, 2000);
  };

  const openChat = (friend) => {
    actions.setActiveChatFriend(friend);
    
    // Mark conversation as read when opened (Phase E-2e)
    const conversationId = getConversationId(currentUserId, friend.id);
    markConversationAsRead(conversationId);
  };

  // GEMINI FUNCTIONS
  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    const prompt = `Analyze these digital wellbeing stats for a user: 
      - Top Trigger: ${ADVANCED_STATS.topTrigger.label} (${ADVANCED_STATS.topTrigger.count} times)
      - Peak Usage Time: ${ADVANCED_STATS.peakTime}
      - Top Loop: Boredom leads to TikTok (65% correlation)
      - Success Rate with Friends: ~85%
      
      Generate a short, 2-sentence encouraging insight using "✨" emojis. Address the user as "Wei".`;

    const text = await callGemini(prompt);
    setAiInsight(text);
    setIsGeneratingInsight(false);
  };

  // DELETED: handleAutoPlan function
  // DELETED: handleCreateSession function

  const handleJoinSession = () => {
    if (!joiningSession) return;
    actions.setUserSessionState({
      joined: true,
      sessionId: joiningSession.id,
      status: "focused",
      allowedApps: selectedSessionApps,
      isFinished: false,
    });
    // Add user to participants list visually ONLY IF NOT THERE
    const updatedSessions = state.liveSessions.map((s) => {
      if (s.id === joiningSession.id) {
        const alreadyJoined = s.participants.some((p) => p.id === "me");
        if (alreadyJoined) return s;
        return {
          ...s,
          participants: [
            ...s.participants,
            {
              id: "me",
              name: state.userAccount.name,
              status: "focused",
              avatar: "bg-blue-500",
            },
          ],
        };
      }
      return s;
    });
    actions.setLiveSessions(updatedSessions);
    setJoiningSession(null);
  };

  const handleFinishSession = () => {
    // Transition to post-session
    actions.setUserSessionState((prev) => ({ ...prev, isFinished: true }));
    // Add to history
    const session = state.liveSessions.find(
      (s) => s.id === state.userSessionState.sessionId
    );
    if (session) {
      actions.setSessionHistory([
        ...state.sessionHistory,
        { ...session, date: "Today" },
      ]);
    }
  };

  const handleSendChat = () => {
    if (!sessionChatMsg) return;
    setSessionChatHistory([
      ...sessionChatHistory,
      { user: "Me", text: sessionChatMsg, time: "Now" },
    ]);
    setSessionChatMsg("");
    // Simulate reply
    setTimeout(() => {
      setSessionChatHistory((prev) => [
        ...prev,
        { user: "David", text: "Great session everyone!", time: "Now" },
      ]);
    }, 2000);
  };

  // INBOX HANDLERS (Phase E-2d)
  const handleChatOpened = useCallback((eventId) => {
    // Resolve all event_chat updates for this event
    resolveUpdatesByEventAndType(eventId, UPDATE_TYPES.EVENT_CHAT);
    // Refresh unresolved updates
    setUnresolvedUpdates(getUnresolvedUpdates());
  }, []);

  const handleUpdateClick = (update) => {
    const activity = findActivityById(update.eventId);
    
    // Resolve based on update type
    switch (update.type) {
      case UPDATE_TYPES.EVENT_CHAT:
        // Open Activity Details → Chat tab
        if (activity) {
          setSelectedActivity(activity);
          // Resolve event_chat updates for this event when chat is opened
          resolveUpdatesByEventAndType(update.eventId, UPDATE_TYPES.EVENT_CHAT);
        } else {
          // Event no longer exists
          resolveUpdate(update.id);
          setToast("This event is no longer available.");
        }
        break;
        
      case UPDATE_TYPES.JOIN_REQUEST:
        // Open Activity Details for host to approve/decline
        // Note: Actual resolution happens when host accepts/declines
        if (activity) {
          setSelectedActivity(activity);
          // Don't resolve yet - wait for host action
        } else {
          resolveUpdate(update.id);
          setToast("This event is no longer available.");
        }
        break;
        
      case UPDATE_TYPES.JOIN_APPROVED:
      case UPDATE_TYPES.JOIN_DECLINED:
        // Open Activity Details to show status
        if (activity) {
          setSelectedActivity(activity);
        }
        // Resolve immediately after viewing
        resolveUpdate(update.id);
        break;
        
      case UPDATE_TYPES.EVENT_UPDATED:
        // Open Activity Details to show changes
        if (activity) {
          setSelectedActivity(activity);
        }
        resolveUpdate(update.id);
        break;
        
      case UPDATE_TYPES.EVENT_CANCELLED:
        // Show cancellation info
        if (activity) {
          setSelectedActivity(activity);
        }
        resolveUpdate(update.id);
        break;
        
      case UPDATE_TYPES.PARTICIPANT_LEFT:
        // Open Activity Details to show updated participant list
        if (activity) {
          setSelectedActivity(activity);
        }
        resolveUpdate(update.id);
        break;
        
      default:
        resolveUpdate(update.id);
    }
    
    // Refresh unresolved updates list
    setUnresolvedUpdates(getUnresolvedUpdates());
    
    // Switch to community tab where ActivityDetailsModal will be shown
    if (activity) {
      setActiveTab("community");
    }
  };

  const handleRequestToJoin = (activity) => {
    if (!activity) return;

    actions.setCommunityData((prev) => {
      const newState = createJoinRequestState(prev, activity, currentUser);
      return newState;
    });

    // Emit event update signal (Phase E-2c)
    emitJoinRequestUpdate(
      activity.id,
      currentUserId,
      currentUser.name
    );

    setToast("The host has been informed and will decide whether you can join this activity");
  };

  const handleAcceptRequest = (activity, request) => {
    if (!request) return;
    actions.setCommunityData((prev) => acceptJoinRequestState(prev, request));
    
    // Emit event update signal (Phase E-2c)
    if (activity?.id) {
      emitJoinApprovedUpdate(
        activity.id,
        currentUserId,
        currentUser.name
      );
    }
    
    // Resolve join_request updates for this event (Phase E-2d)
    if (activity?.id) {
      resolveUpdatesByEventAndType(activity.id, UPDATE_TYPES.JOIN_REQUEST);
      setUnresolvedUpdates(getUnresolvedUpdates());
    }
    
    setToast("Request accepted");
  };

  const handleDeclineRequest = (activity, request) => {
    if (!request) return;
    actions.setCommunityData((prev) => declineJoinRequestState(prev, request));
    
    // Emit event update signal (Phase E-2c)
    if (activity?.id) {
      emitJoinDeclinedUpdate(
        activity.id,
        currentUserId,
        currentUser.name
      );
    }
    
    // Resolve join_request updates for this event (Phase E-2d)
    if (activity?.id) {
      resolveUpdatesByEventAndType(activity.id, UPDATE_TYPES.JOIN_REQUEST);
      setUnresolvedUpdates(getUnresolvedUpdates());
    }
    
    setToast("Request declined");
  };

  const handleCancelRequest = (activity) => {
    if (!activity) return;
    actions.setCommunityData((prev) =>
      cancelJoinRequestState(prev, activity, currentUserId)
    );
    setToast("Join request cancelled");
    setSelectedActivity(null);
  };

  // Adds a hosted group event; mirrors to Discover lists based on visibility.
  const addGroupActivity = (payload, { sendInvites = false } = {}) => {
    const newId = `ua-${Date.now()}`;
    const readableDate = formatDateLabel(payload.date || todayIso);
    const timeLabel = buildTimeLabel(
      payload.time || payload.timeOfDay,
      payload.endTime
    );
    const visibility = payload.visibility || "friends";
    const participantLimit =
      Number(payload.participantLimit ?? payload.maxParticipants) || undefined;
    const baseActivity = {
      id: newId,
      title: payload.title || "Hosted activity",
      description: payload.description,
      date: readableDate,
      time: timeLabel,
      location: payload.location || "TBD",
      hostType: "self",
      hostId: currentUser.id,
      hostName: currentUser.name,
      visibility,
      participantLimit,
      maxParticipants: participantLimit,
      status: "hosting",
      isHost: true,
      allowAutoJoin: !!payload.allowAutoJoin,
      participants: [
        {
          id: currentUser.id,
          name: currentUser.name,
          status: "hosting",
        },
      ],
    };

    const invitees =
      sendInvites && friendsList
        ? friendsList
            .filter((f) => f.id !== currentUserId)
            .slice(0, 2)
            .map((friend) => ({
              id: `inv-${Date.now()}-${friend.id}`,
              activityId: newId,
              activityTitle: baseActivity.title,
              requesterId: friend.id,
              requesterName: friend.name,
              hostId: currentUser.id,
              status: "pending",
              type: "invite",
            }))
        : [];

    updateCommunityData((prev) => ({
      ...prev,
      upcomingActivities: [baseActivity, ...prev.upcomingActivities],
      friendSharedActivities:
        visibility === "friends"
          ? [
              { ...baseActivity, hostType: "friend", visibility: "friends" },
              ...(prev.friendSharedActivities || []),
            ]
          : prev.friendSharedActivities,
      publicEvents:
        visibility === "public"
          ? [
              { ...baseActivity, hostType: "public", visibility: "public" },
              ...(prev.publicEvents || []),
            ]
          : prev.publicEvents,
      incomingRequests: [...(prev.incomingRequests || []), ...invitees],
      pendingRequests: [...(prev.pendingRequests || []), ...invitees],
    }));
    setToast("Event published to your lists");
    setShowPlanModal(false);
  };

  const handleStartCommunityActivity = (activity, options = {}) => {
    if (!activity) return;
    const parsedOptions =
      typeof options === "boolean"
        ? { allowJoin: options, visibility: "friends" }
        : options || {};
    const allowLiveJoin = !!parsedOptions.allowJoin;
    const liveVisibility =
      parsedOptions.visibility || activity.visibility || "friends";
    updateCommunityData((prev) => {
      const upcomingActivities = prev.upcomingActivities.map((act) =>
        act.id === activity.id || act.sourceId === activity.id
          ? { ...act, status: "confirmed" }
          : act
      );
      const liveId = `live-${activity.id}`;
      const friendSharedActivities = prev.friendSharedActivities.filter(
        (a) => !a.live || a.id !== liveId
      );
      let sharedActivities = prev.sharedCurrentActivities || [];

      if (allowLiveJoin) {
        const liveEntry = {
          id: liveId,
          sourceId: activity.id,
          title: activity.title,
          description: activity.description,
          date: "Today",
          time: "Now",
          location: activity.location,
          hostType: "friend",
          hostId: currentUser.id,
          hostName: currentUser.name,
          visibility: liveVisibility,
          status: "confirmed",
          live: true,
          allowJoin: true,
          startAt: Date.now(),
        };
        sharedActivities = [
          liveEntry,
          ...sharedActivities.filter((a) => a.id !== liveId),
        ];
      } else {
        sharedActivities = sharedActivities.filter(
          (a) => a.id !== liveId && a.sourceId !== activity.id
        );
      }

      const currentActivityPayload = allowLiveJoin
        ? {
            id: activity.id,
            hostId: currentUser.id,
            hostName: currentUser.name,
            title: activity.title,
            time: buildTimeLabel(activity.time || "Now", activity.endTime),
            allowJoin: true,
            visibility: liveVisibility,
            startAt: Date.now(),
          }
        : null;

      return setCurrentActivityState(
        {
          ...prev,
          upcomingActivities,
          friendSharedActivities,
          sharedCurrentActivities: sharedActivities,
        },
        currentActivityPayload
      );
    });

    actions.setFriendsList((prev = []) =>
      prev.map((f) =>
        f.id === currentUserId
          ? { ...f, currentActivity: allowLiveJoin ? activity.title : null }
          : f
      )
    );

    if (allowLiveJoin) {
      if (liveSessionTimeoutRef.current) {
        clearTimeout(liveSessionTimeoutRef.current);
      }
      liveSessionTimeoutRef.current = setTimeout(() => {
        actions.setCommunityData((prev) => ({
          ...prev,
          friendSharedActivities: prev.friendSharedActivities.filter(
            (a) => !a.live
          ),
          sharedCurrentActivities: (prev.sharedCurrentActivities || []).filter(
            (a) => !a.live
          ),
          currentActivity: null,
        }));
        actions.setFriendsList((prev = []) =>
          prev.map((f) =>
            f.id === currentUserId ? { ...f, currentActivity: null } : f
          )
        );
      }, 5 * 60 * 1000);
    }

  setToast(allowLiveJoin ? "Live join session started" : "Activity started");
  setSelectedActivity(null);
};

  const handleEditActivity = (activity) => {
    if (!activity) return;
    // Set the activity to edit in state and open the PlanActivityModal in edit mode
    setActivityToEdit(activity);
    setShowPlanModal(true);
    setSelectedActivity(null);
  };

  const handleUpdateActivity = (data) => {
    if (!activityToEdit) return;
    
    // Format date and time
    const readableDate = formatDateLabel(data.date || todayIso);
    const timeLabel = buildTimeLabel(data.time, data.endTime);
    
    // Emit event update signal (Phase E-2c)
    emitEventUpdatedUpdate(
      activityToEdit.id,
      currentUserId,
      currentUser.name,
      "Event details updated"
    );
    
    actions.setCommunityData((prev) => ({
      ...prev,
      upcomingActivities: prev.upcomingActivities.map((act) =>
        act.id === activityToEdit.id
          ? {
              ...act,
              title: data.title,
              description: data.description,
              date: readableDate,
              time: timeLabel,
              location: data.location || act.location,
              visibility: data.visibility || act.visibility,
              maxParticipants: data.maxParticipants || act.maxParticipants,
            }
          : act
      ),
      friendSharedActivities: prev.friendSharedActivities.map((act) =>
        act.id === activityToEdit.id || act.sourceId === activityToEdit.id
          ? {
              ...act,
              title: data.title,
              description: data.description,
              location: data.location || act.location,
            }
          : act
      ),
      publicEvents: prev.publicEvents.map((act) =>
        act.id === activityToEdit.id
          ? {
              ...act,
              title: data.title,
              description: data.description,
              location: data.location || act.location,
            }
          : act
      ),
    }));
    setToast("Activity updated successfully");
    setShowPlanModal(false);
    setActivityToEdit(null);
  };

  const handleCancelActivity = (activity) => {
    if (!activity) return;
    
    // Emit event update signal (Phase E-2c)
    emitEventCancelledUpdate(
      activity.id,
      currentUserId,
      currentUser.name
    );
    
    // Remove from upcomingActivities
    actions.setCommunityData((prev) => ({
      ...prev,
      upcomingActivities: prev.upcomingActivities.filter(
        (act) => act.id !== activity.id
      ),
      friendSharedActivities: prev.friendSharedActivities.filter(
        (act) => act.id !== activity.id && act.sourceId !== activity.id
      ),
      publicEvents: prev.publicEvents.filter(
        (act) => act.id !== activity.id
      ),
      sharedCurrentActivities: (prev.sharedCurrentActivities || []).filter(
        (act) => act.id !== activity.id && act.sourceId !== activity.id
      ),
    }));
    
    setToast("Event cancelled successfully");
    setSelectedActivity(null);
  };

  const handleQuitActivity = (activity) => {
    if (!activity) return;
    
    // Emit event update signal (Phase E-2c)
    emitParticipantLeftUpdate(
      activity.id,
      currentUserId,
      currentUser.name
    );
    
    // Remove from user's upcomingActivities (only the user's participation)
    actions.setCommunityData((prev) => ({
      ...prev,
      upcomingActivities: prev.upcomingActivities.filter(
        (act) => act.id !== activity.id && act.sourceId !== activity.id
      ),
      sharedCurrentActivities: (prev.sharedCurrentActivities || []).filter(
        (act) => act.id !== activity.id && act.sourceId !== activity.id
      ),
    }));
    
    setToast("You have left the event");
    setSelectedActivity(null);
  };

// Duplicate removed - now defined earlier at line ~1793

  const handleOpenPlannerFromAlt = useCallback(
    (alt) => {
      const today = new Date();
      const defaultDate = today.toISOString().slice(0, 10);
      actions.setCreateEventDraft({
        title: alt.title || "",
        date: defaultDate,
        time: "17:00",
        endTime: "",
        location: alt.location || "",
        description: alt.desc || "",
        visibility: "private",
        maxParticipants: 6,
        participantLimit: 1,
        sendInvites: true,
        mode: "solo",
      });
    },
    [actions]
  );

  const handleSubmitPlannedEvent = () => {
    if (!state.createEventDraft) return;
    if (state.createEventDraft.mode === "solo") {
      addSoloActivity(state.createEventDraft, { source: "planner" });
    } else {
      addGroupActivity(state.createEventDraft, {
        sendInvites: state.createEventDraft.sendInvites,
      });
    }
    actions.setCreateEventDraft(null);
  };

  const handleAddValueCard = () => {
    if (!newValueCard.label) return;
    const newId = `custom-${Date.now()}`;
    actions.setAvailableValueCards([
      ...state.availableValueCards,
      { id: newId, ...newValueCard },
    ]);
    actions.setSelectedValues([...state.selectedValues, newId]);
    setNewValueCard({ label: "", icon: "❤️" });
  };

  const handleAddContact = (contact, type) => {
    const existing = state.friendsList.find((f) => f.name === contact.name);
    const wasDeleted = state.deletedFriends.includes(contact.name);

    if (wasDeleted) {
      if (existing) {
        const updated = state.friendsList.map((f) =>
          f.name === contact.name ? { ...f, status: "accepted" } : f
        );
        actions.setFriendsList(updated);
      } else {
        const newFriend = {
          id: `f-${Date.now()}`,
          name: contact.name,
          successRate: Math.floor(Math.random() * 40) + 50,
          avatar: "bg-slate-400",
          rank: state.friendsList.length + 1,
          status: "accepted",
          buddyStatus: type === "buddy" ? "pending" : "none",
          alternatives: [],
          isFavorite: false,
          note: "",
        };
        actions.setFriendsList([...state.friendsList, newFriend]);
      }
      actions.setDeletedFriends(
        state.deletedFriends.filter((n) => n !== contact.name)
      );
      setToast(
        `${contact.name} added back${
          type === "buddy" ? " and buddy invite sent" : ""
        }!`
      );
      setIsAddingFriend(false);
      setIsAddingBuddy(false);
      return;
    }
    if (existing) {
      if (type === "buddy" && existing.buddyStatus === "none") {
        const updated = state.friendsList.map((f) =>
          f.id === existing.id ? { ...f, buddyStatus: "pending" } : f
        );
        actions.setFriendsList(updated);
        setToast(`Buddy invite sent to ${contact.name}.`);
      }
      setIsAddingFriend(false);
      setIsAddingBuddy(false);
      return;
    }
    const newFriend = {
      id: `f-${Date.now()}`,
      name: contact.name,
      successRate: Math.floor(Math.random() * 40) + 50,
      avatar: "bg-slate-400",
      rank: state.friendsList.length + 1,
      status: type === "friend" ? "pending" : "accepted",
      buddyStatus: type === "buddy" ? "pending" : "none",
      alternatives: [],
      isFavorite: false,
      note: "",
    };
    actions.setFriendsList([...state.friendsList, newFriend]);
    setToast(
      `${type === "buddy" ? "Buddy" : "Friend"} invitation sent to ${
        contact.name
      }.`
    );
    setIsAddingFriend(false);
    setIsAddingBuddy(false);
  };

  const handleDeleteFriend = (e, friend) => {
    e.stopPropagation();
    if (confirm(`Remove ${friend.name} from friends?`)) {
      actions.setFriendsList(
        state.friendsList.filter((f) => f.id !== friend.id)
      );
      actions.setDeletedFriends([...state.deletedFriends, friend.name]);
      setToast(`${friend.name} removed.`);
      if (viewingFriend && viewingFriend.id === friend.id)
        setViewingFriend(null);
    }
  };

  const handleDeleteBuddy = (e, friend) => {
    e.stopPropagation();
    if (confirm(`Remove ${friend.name} from buddies?`)) {
      const updated = state.friendsList.map((f) => {
        if (f.id === friend.id) return { ...f, buddyStatus: "none" };
        return f;
      });
      actions.setFriendsList(updated);
      setToast(`${friend.name} is no longer a buddy.`);
    }
  };

  const handleNudge = (e, buddy) => {
    e.stopPropagation();
    setToast(`Nudged ${buddy.name}! 🌊`);
  };

  const handleUpdateNote = (id, newNote) => {
    const updated = state.friendsList.map((f) =>
      f.id === id ? { ...f, note: newNote } : f
    );
    actions.setFriendsList(updated);
    setViewingFriend({ ...viewingFriend, note: newNote }); // Update local view
  };

  const handleToggleFavorite = (e, friend) => {
    e.stopPropagation();
    const updated = state.friendsList.map((f) =>
      f.id === friend.id ? { ...f, isFavorite: !f.isFavorite } : f
    );
    actions.setFriendsList(updated);
    if (viewingFriend && viewingFriend.id === friend.id) {
      setViewingFriend({
        ...viewingFriend,
        isFavorite: !viewingFriend.isFavorite,
      });
    }
  };

  if (!state.hasOnboarded) {
    return (
      <PhoneShell bg="bg-slate-50">
        <div className="p-8 pt-16 flex flex-col h-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Let's set up BreakLoop.
          </h1>
          <p className="text-slate-500 mb-6 text-sm">
            Configure your mindful phone experience.
          </p>
          {onboardingStep === 0 && (
            <>
              <h2 className="text-lg font-bold mb-4">Step 1: Your Values</h2>
              <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto content-start pb-4">
                {state.availableValueCards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (state.selectedValues.includes(c.id))
                        actions.setSelectedValues(
                          state.selectedValues.filter((v) => v !== c.id)
                        );
                      else
                        actions.setSelectedValues([
                          ...state.selectedValues,
                          c.id,
                        ]);
                    }}
                    className={`p-4 rounded-xl border-2 text-left ${
                      state.selectedValues.includes(c.id)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <div className="text-xs font-bold">{c.label}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setOnboardingStep(1)}
                disabled={state.selectedValues.length === 0}
                className="mt-auto w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
          {onboardingStep === 1 && (
            <AppSelectionScreen
              apps={state.customApps}
              selected={state.monitoredApps}
              onToggle={(id) => {
                if (state.monitoredApps.includes(id))
                  actions.setMonitoredApps(
                    state.monitoredApps.filter((a) => a !== id)
                  );
                else actions.setMonitoredApps([...state.monitoredApps, id]);
              }}
              onAddWebsite={(url) => {
                const newSite = {
                  id: `web-${Date.now()}`,
                  name: url,
                  icon: <Globe size={24} />,
                  color: "bg-slate-400",
                  type: "distraction",
                  category: "web",
                };
                actions.setCustomApps([...state.customApps, newSite]);
              }}
              onFinish={() => actions.setHasOnboarded(true)}
            />
          )}
        </div>
      </PhoneShell>
    );
  }

  // --- RENDER ACTIVE SESSION VIEW (OVERRIDE MAIN CONTENT) ---
  if (state.userSessionState && state.userSessionState.joined) {
    // ... (Same Active Session View Code) ...
    const currentSession = state.liveSessions.find(
      (s) => s.id === state.userSessionState.sessionId
    );
    const isFinished = state.userSessionState.isFinished;

    return (
      <PhoneShell bg="bg-slate-900">
        <div className="h-full flex flex-col text-white relative">
          {/* Header */}
          <div className="p-6 pb-2 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isFinished ? "bg-slate-500" : "bg-green-500 animate-pulse"
                  }`}
                ></div>{" "}
                {isFinished ? "Session Ended" : "Live Session"}
              </div>
              <h2 className="text-xl font-bold">{currentSession?.topic}</h2>
            </div>
            {!isFinished && (
              <button
                onClick={() => {
                  setLeaveCountdown(5);
                  setLeavingSession(true);
                }}
                className="bg-red-500/20 text-red-300 p-2 rounded-xl hover:bg-red-500/30"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>

          {quickTaskSecondsLeft > 0 && (
            <div className="mx-4 mb-2">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl flex items-center justify-between shadow-lg">
                <div className="text-[11px] font-bold uppercase tracking-wide">
                  Quick task mode
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Timer size={14} /> {formatSeconds(quickTaskSecondsLeft)}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isFinished ? (
              <>
                {/* Allowed Apps */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-xs font-bold text-slate-400 mb-2">
                    Allowed Apps
                  </div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Shield size={20} />
                    </div>
                    {state.userSessionState.allowedApps
                      .filter((id) => id !== "mindful")
                      .map((appId) => {
                        const app = state.customApps.find(
                          (a) => a.id === appId
                        );
                        return (
                          <div
                            key={appId}
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-2xl"
                          >
                            {getIcon(app?.iconName)}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Grid of Participants */}
                <div className="grid grid-cols-2 gap-3">
                  {currentSession?.participants.map((p) => {
                    const isMe = p.id === "me";
                    // If it's me, use local real-time status
                    const status = isMe
                      ? state.userSessionState.status
                      : p.status;
                    return (
                      <div
                        key={p.id}
                        className="bg-white/10 p-3 rounded-xl border border-white/5 flex items-center gap-3"
                      >
                        <div
                          className={`w-10 h-10 rounded-full ${p.avatar} flex items-center justify-center font-bold text-sm relative`}
                        >
                          {p.name[0]}
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                              status === "focused"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {p.name} {isMe && "(You)"}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              status === "focused"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {status.toUpperCase()}
                          </div>
                        </div>
                        {!isMe && (
                          <button className="ml-auto text-slate-400 hover:text-white">
                            <UserPlus size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 text-center text-slate-500 text-sm">
                  Focus until {currentSession?.endTime}
                  <br />
                  <button
                    onClick={handleFinishSession}
                    className="mt-4 text-xs bg-white/5 px-3 py-1 rounded hover:bg-white/10"
                  >
                    (Simulate End)
                  </button>
                </div>
              </>
            ) : (
              /* POST SESSION CHAT */
              <div className="h-full flex flex-col">
                <div className="flex-1 bg-white/5 rounded-2xl p-4 overflow-y-auto space-y-3 mb-3">
                  <div className="text-center text-xs text-slate-500 my-2">
                    Session Ended. Chat open for 30m.
                  </div>
                  {sessionChatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.user === "Me" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-xl text-sm ${
                          msg.user === "Me"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {msg.user} • {msg.time}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white/10 rounded-xl px-4 text-sm text-white border-none outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Message group..."
                    value={sessionChatMsg}
                    onChange={(e) => setSessionChatMsg(e.target.value)}
                  />
                  <button
                    onClick={handleSendChat}
                    className="bg-blue-600 p-3 rounded-xl"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <button
                  onClick={() => actions.setUserSessionState(null)}
                  className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl mt-4"
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>

          {/* Leave Confirmation Overlay */}
          {leavingSession && (
            <div className="absolute inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-6 text-center animate-in fade-in">
              <div>
                <h2 className="text-3xl font-bold mb-2">Leaving Session</h2>
                <p className="text-slate-400 mb-6">
                  Take a breath before disconnecting.
                </p>
                <div className="text-6xl font-bold text-white mb-8">
                  {leaveCountdown}
                </div>
                <button
                  onClick={() => setLeavingSession(false)}
                  className="text-sm text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell bg="bg-slate-50">
      {toast && (
        <div className="absolute top-12 left-4 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-lg z-[60] animate-in slide-in-from-top flex items-center gap-3">
          <Check size={16} className="text-green-400" />
          <div className="text-xs font-bold">{toast}</div>
        </div>
      )}

      <div className="pt-10 pb-4 px-6 bg-white border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Shield className="text-blue-600" size={20} /> BreakLoop
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200"
        >
          <X size={18} />
        </button>
      </div>

      {quickTaskSecondsLeft > 0 && (
        <div className="px-6 mt-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wide">
              Quick task mode
            </div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Timer size={14} /> {formatSeconds(quickTaskSecondsLeft)}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {activeTab === "insights" && (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  My "Why"
                </h3>
                <button
                  onClick={() => setIsEditingValues(true)}
                  className="text-blue-500"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {state.selectedValues.map((id) => {
                  const v = state.availableValueCards.find((c) => c.id === id);
                  return (
                    <div
                      key={id}
                      className="flex-shrink-0 bg-white border border-slate-100 text-slate-700 px-3 py-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 w-20 shadow-sm"
                    >
                      <span className="text-xl">{v?.icon}</span> {v?.label}
                    </div>
                  );
                })}
                <button
                  onClick={() => setIsEditingValues(true)}
                  className="flex-shrink-0 bg-slate-100 text-slate-400 px-3 py-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 w-20 border-2 border-dashed border-slate-200"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-slate-800">
                  Screen Time
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {["Today", "Week", "Month"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setStatsPeriod(p)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        statsPeriod === p
                          ? "bg-white shadow-sm text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                <button className="hover:text-slate-800">
                  <ChevronLeft size={16} />
                </button>
                <span>
                  {statsPeriod === "Today"
                    ? "Today, 24 Oct"
                    : statsPeriod === "Week"
                    ? "Oct 18 - Oct 24"
                    : "October 2023"}
                </span>
                <button className="hover:text-slate-800">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-slate-800">
                  {statsPeriod === "Today"
                    ? formatScreenTime(SCREEN_TIME_DATA.today.totalMinutes)
                    : statsPeriod === "Week"
                    ? formatScreenTime(SCREEN_TIME_DATA.week.totalMinutes)
                    : formatScreenTime(SCREEN_TIME_DATA.month.totalMinutes)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Total usage {statsPeriod.toLowerCase()}
                </div>
              </div>
              <div className="flex items-end gap-2 h-44 pt-8 border-b border-slate-100 pb-4 overflow-x-auto">
                {statsPeriod === "Today"
                  ? SCREEN_TIME_DATA.today.hourlyBreakdown.map((d, i) => {
                      const heightPct =
                        todayMaxMinutes > 0 ? (d.minutes / todayMaxMinutes) * 100 : 0;
                      const barHeight = heightPct > 0 && heightPct < 6 ? 6 : heightPct;
                      const isCurrentHour = new Date().getHours() === d.hour;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2 group min-w-[20px] h-full justify-end"
                        >
                          <span className="text-[9px] font-bold text-slate-600 min-h-[20px] flex items-center justify-center whitespace-nowrap">
                            {formatScreenTime(d.minutes)}
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              isCurrentHour ? "bg-blue-500" : "bg-slate-200"
                            }`}
                            style={{
                              height: `${barHeight}%`,
                            }}
                          ></div>
                          <span className="text-[10px] font-bold text-slate-300">
                            {d.hour}
                          </span>
                        </div>
                      );
                    })
                  : statsPeriod === "Week"
                  ? SCREEN_TIME_DATA.week.dailyBreakdown.map((d, i) => {
                      const heightPct =
                        weekMaxValue > 0 ? (d.val / weekMaxValue) * 100 : 0;
                      const barHeight = heightPct > 0 && heightPct < 6 ? 6 : heightPct;
                      const isToday = i === 4; // Assuming Friday is today
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                        >
                          <span className="text-[9px] font-bold text-slate-600 min-h-[20px] flex items-center justify-center whitespace-nowrap">
                            {formatScreenTime(d.minutes)}
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              isToday ? "bg-blue-500" : "bg-slate-200"
                            }`}
                            style={{
                              height: `${barHeight}%`,
                            }}
                          ></div>
                          <span className="text-[10px] font-bold text-slate-300">
                            {d.label}
                          </span>
                        </div>
                      );
                    })
                  : SCREEN_TIME_DATA.month.weeklyBreakdown.map((d, i) => {
                      const heightPct =
                        monthMaxValue > 0 ? (d.val / monthMaxValue) * 100 : 0;
                      const barHeight = heightPct > 0 && heightPct < 6 ? 6 : heightPct;
                      const isCurrentWeek = i === 3; // Assuming week 4 is current
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                        >
                          <span className="text-[9px] font-bold text-slate-600 min-h-[20px] flex items-center justify-center whitespace-nowrap">
                            {formatScreenTime(d.minutes)}
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              isCurrentWeek ? "bg-blue-500" : "bg-slate-200"
                            }`}
                            style={{
                              height: `${barHeight}%`,
                            }}
                          ></div>
                          <span className="text-[10px] font-bold text-slate-300">
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* SESSION HISTORY */}
            {state.sessionHistory.length > 0 && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <History size={18} /> Focus History
                </h3>
                <div className="space-y-3">
                  {state.sessionHistory.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800">
                          {s.topic}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.date} • {s.category}
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                        Completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEEP INSIGHTS CARD */}
            <div className="bg-slate-900 p-5 rounded-3xl shadow-lg text-white relative overflow-hidden">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-yellow-400" /> Deep
                Insights
              </h3>

              {/* AI BUTTON */}
              <button
                onClick={handleGenerateInsight}
                className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                {isGeneratingInsight ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} className="text-purple-300" />
                )}{" "}
                AI Analysis
              </button>

              {aiInsight && (
                <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-4 rounded-xl mb-4 border border-white/10 animate-in fade-in">
                  <p className="text-sm leading-relaxed italic">
                    "{aiInsight}"
                  </p>
                </div>
              )}

              {/* Top Insight */}
              <div className="bg-white/10 p-4 rounded-xl mb-4 border border-white/5">
                <p className="text-sm leading-relaxed">
                  You scroll mostly when you are{" "}
                  <span className="font-bold text-teal-300">
                    {ADVANCED_STATS.topTrigger.label}
                  </span>{" "}
                  on{" "}
                  <span className="font-bold text-teal-300">
                    {ADVANCED_STATS.peakTime}
                  </span>
                  .
                </p>
              </div>

              {/* The Loop Visualization */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  Habit Loops
                </h4>
                {ADVANCED_STATS.correlations.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg text-white/70">
                        {item.causeIcon}
                      </div>
                      <span className="text-xs font-bold">{item.cause}</span>
                    </div>
                    <ArrowRight size={12} className="text-white/30" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${item.color}`}
                      ></div>
                      <span className="text-xs font-bold">{item.appName}</span>
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continued Use by Trigger */}
              <div className="space-y-3 mt-6">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  Continued Use by Trigger
                </h4>
                {ADVANCED_STATS.causeFail.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${item.color
                        .replace("text-", "bg-")
                        .replace("500", "500/20")} ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{item.label}</span>
                        <span>{item.rate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color.replace(
                            "text-",
                            "bg-"
                          )}`}
                          style={{ width: `${item.rate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white/30 w-4 text-right">
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Alternatives */}
              <div className="space-y-3 mt-6">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  Top Alternatives
                </h4>
                {ADVANCED_STATS.topAlternatives.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-white/30 w-4">
                        #{i + 1}
                      </div>
                      <div className="text-lg">{item.icon}</div>
                      <div className="text-sm font-bold">{item.title}</div>
                    </div>
                    <div className="text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">
                      {item.count}x
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div className="p-6 pb-2 h-full flex flex-col overflow-hidden">
            {/* --- CHAT VIEW (SUB-SCREEN) --- */}
            {state.activeChatFriend ? (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => actions.setActiveChatFriend(null)}
                      className="p-2 bg-white rounded-full hover:bg-slate-200 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full ${state.activeChatFriend.avatar} flex items-center justify-center text-white font-bold text-xs`}
                      >
                        {state.activeChatFriend.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800">
                          {state.activeChatFriend.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>{" "}
                          Online
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white scrollbar-hide">
                  {(() => {
                    const conversationId = getConversationId(currentUserId, state.activeChatFriend.id);
                    const conversation = getConversation(conversationId);
                    const messages = conversation?.messages || [];
                    
                    return messages.length > 0 ? (
                      messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        const timestamp = new Date(msg.createdAt);
                        const timeStr = timestamp.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        });
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isMe ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                                isMe
                                  ? "bg-blue-600 text-white rounded-tr-none"
                                  : "bg-slate-100 text-slate-800 rounded-tl-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                              {timeStr}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-slate-400 text-xs py-10">
                        Start a mindful conversation.
                      </div>
                    );
                  })()}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendChatMessage()
                    }
                  />
                  <button
                    onClick={handleSendChatMessage}
                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ) : viewingFriend ? (
              /* --- FRIEND PROFILE VIEW --- */
              <div className="flex-1 flex flex-col animate-in slide-in-from-right">
                <div className="mb-6 flex items-center gap-3">
                  <button
                    onClick={() => setViewingFriend(null)}
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {viewingFriend.name}'s Profile
                    </h2>
                    <p className="text-xs text-slate-500">
                      Shared Alternatives & Stats
                    </p>
                  </div>
                </div>

                {/* Friend Header Card */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-full ${viewingFriend.avatar} flex items-center justify-center text-white font-bold text-2xl shadow-md`}
                      >
                        {viewingFriend.name[0]}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => handleToggleFavorite(e, viewingFriend)}
                        className={`p-2 rounded-full border ${
                          viewingFriend.isFavorite
                            ? "bg-yellow-100 border-yellow-200 text-yellow-500"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        <StarIcon
                          size={20}
                          fill={
                            viewingFriend.isFavorite ? "currentColor" : "none"
                          }
                        />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFriend(e, viewingFriend)}
                        className="p-2 rounded-full bg-red-50 border border-red-100 text-red-400 hover:bg-red-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* LIVE STATUS SECTION (New) */}
                  {((state.settings.shareMood && viewingFriend.recentMood) ||
                    (state.settings.shareActivity &&
                      viewingFriend.currentActivity)) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {state.settings.shareMood && viewingFriend.recentMood && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                          {(() => {
                            const mood = CAUSES.find(
                              (c) => c.id === viewingFriend.recentMood
                            );
                            if (!mood) return null;
                            return (
                              <>
                                <div className="text-slate-400 mb-1">
                                  {React.cloneElement(mood.icon, { size: 18 })}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Mood
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                  {mood.label}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {state.settings.shareActivity &&
                        viewingFriend.currentActivity && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-1">
                            <div className="text-slate-400 mb-1">
                              <Activity size={18} />
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Activity
                            </div>
                            <div className="text-xs font-bold text-slate-700">
                              {viewingFriend.currentActivity}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => openChat(viewingFriend)}
                      className="bg-blue-600 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} /> Chat
                    </button>
                    <button className="bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <Phone size={16} /> Call
                    </button>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <StickyNote size={12} /> Notes
                    </div>
                    <textarea
                      className="w-full bg-transparent text-sm text-slate-700 resize-none outline-none placeholder:text-slate-400"
                      placeholder="Add a note about this friend..."
                      rows={2}
                      value={viewingFriend.note || ""}
                      onChange={(e) =>
                        handleUpdateNote(viewingFriend.id, e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pb-20 scrollbar-hide">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                    What works for {viewingFriend.name}
                  </h3>
                  {viewingFriend.alternatives &&
                  viewingFriend.alternatives.length > 0 ? (
                    viewingFriend.alternatives
                      .filter((alt) => !alt.isPrivate)
                      .map((alt, i) =>
                        alt ? (
                          <div
                            key={i}
                            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-slate-800">
                                {alt.title}
                              </div>
                              <div className="text-xs text-slate-500">
                                {alt.desc} • {alt.duration}
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Heart size={12} /> {alt.likes || 12}
                            </div>
                          </div>
                        ) : null
                      )
                  ) : (
                    <div className="text-center text-slate-400 py-10 italic">
                      No public alternatives shared.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* --- MAIN COMMUNITY LIST VIEW --- */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Community
                  </h2>
                </div>

                {/* Horizontal Menu Navigation */}
                <div className="grid grid-cols-4 gap-2 mb-4 flex-shrink-0">
                  <button
                    onClick={() => setCommunityMenu("friends")}
                    className={`px-2 py-2 rounded-xl font-bold text-xs transition-colors ${
                      communityMenu === "friends"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Friends
                  </button>
                  <button
                    onClick={() => setCommunityMenu("my-upcoming")}
                    className={`px-2 py-2 rounded-xl font-bold text-xs transition-colors ${
                      communityMenu === "my-upcoming"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    My Upcoming
                  </button>
                  <button
                    onClick={() => setCommunityMenu("discover")}
                    className={`px-2 py-2 rounded-xl font-bold text-xs transition-colors ${
                      communityMenu === "discover"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Discover
                  </button>
                  <button
                    onClick={() => setCommunityMenu("plan")}
                    className={`px-2 py-2 rounded-xl font-bold text-xs transition-colors ${
                      communityMenu === "plan"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Plan
                  </button>
                </div>

                {/* Menu Content - Vertical Scrollable */}
                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide min-h-0 pb-20">
                  {/* FRIENDS MENU */}
                  {communityMenu === "friends" && (
                    <>
                      {/* FRIEND LIST (Favorites + All) */}
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                              Friends
                            </h3>
                          </div>
                          <button
                            onClick={() => setIsAddingFriend(true)}
                            className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1"
                          >
                            <UserPlus size={12} /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {/* Separating Favorites to Top */}
                          {state.friendsList
                            .filter((f) => f.id !== "f0") // Filter out self for list
                            .sort(
                              (a, b) =>
                                (b.isFavorite === a.isFavorite
                                  ? 0
                                  : b.isFavorite
                                  ? 1
                                  : -1) || a.name.localeCompare(b.name)
                            )
                            .map((f, i) => (
                              <button
                                key={i}
                                onClick={() => setViewingFriend(f)}
                                className="w-full flex items-center justify-between group hover:bg-slate-50 p-2 rounded-xl transition-colors relative border border-transparent hover:border-slate-100"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div
                                    className={`w-10 h-10 rounded-full ${f.avatar} flex items-center justify-center text-white font-bold text-sm relative flex-shrink-0`}
                                  >
                                    {f.name[0]}
                                    {f.isFavorite && (
                                      <div className="absolute -top-1 -right-1 text-yellow-400 bg-white rounded-full p-0.5 shadow-sm">
                                        <StarIcon size={10} fill="currentColor" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-left flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <div className="font-bold text-sm text-slate-800 flex items-center gap-1">
                                        {f.name}
                                        {f.status === "pending" && (
                                          <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 rounded font-normal">
                                            Pending
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Mood Display (Activity removed per Decision 1) */}
                                    <div className="flex items-center gap-1.5 mt-1 min-h-[18px]">
                                      {state.settings.shareMood &&
                                        f.recentMood &&
                                        (() => {
                                          const mood = CAUSES.find(
                                            (c) => c.id === f.recentMood
                                          );
                                          if (!mood) return null;
                                          return (
                                            <div
                                              className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-500`}
                                            >
                                              {React.cloneElement(mood.icon, {
                                                size: 10,
                                              })}{" "}
                                              {mood.label}
                                            </div>
                                          );
                                        })()}
                                    </div>

                                    {/* Fallback Note: Show if no mood is displayed */}
                                    {f.note &&
                                      (!state.settings.shareMood || !f.recentMood) && (
                                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                          📝 {f.note}
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-slate-50 pl-2">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openChat(f);
                                    }}
                                    className="p-1.5 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100"
                                  >
                                    <MessageCircle size={14} />
                                  </div>
                                  <div
                                    onClick={(e) => handleToggleFavorite(e, f)}
                                    className={`p-1.5 rounded-full hover:bg-yellow-100 ${
                                      f.isFavorite
                                        ? "text-yellow-500"
                                        : "text-slate-300 hover:text-yellow-500"
                                    }`}
                                  >
                                    <StarIcon
                                      size={14}
                                      fill={f.isFavorite ? "currentColor" : "none"}
                                    />
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* What Friends Are Up To */}
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <Users size={18} className="text-indigo-500" />
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                            What friends are up to
                          </h3>
                        </div>
                        {(() => {
                          // Decision 2: Filter for TODAY only and cap at 3 items
                          const todayActivities = [...(state.sharedCurrentActivities || []), ...(state.friendSharedActivities || [])]
                            .filter((activity, idx, arr) => 
                              // Deduplicate
                              arr.findIndex((a) => a.id === activity.id) === idx
                            )
                            .filter((activity) => 
                              // Only show activities happening TODAY
                              activity.date === "Today"
                            )
                            .slice(0, 3); // Hard cap at 3 items
                          
                          return todayActivities.length > 0 ? (
                            <div className="space-y-3">
                              {todayActivities.map((activity) => (
                                <div key={activity.id} onClick={() => setSelectedActivity(activity)}>
                                  <ActivityCard
                                    activity={activity}
                                    currentUserId={currentUserId}
                                    upcomingActivities={state.upcomingActivities || []}
                                    onClick={() => setSelectedActivity(activity)}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-sm text-slate-400 py-6 bg-slate-50 rounded-2xl border border-slate-100">
                              No friends are currently active.
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}

                  {/* MY UPCOMING ACTIVITIES MENU */}
                  {communityMenu === "my-upcoming" && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={18} className="text-blue-500" />
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                          My Upcoming Activities
                        </h3>
                      </div>
                      {state.upcomingActivities?.length ? (
                        <div className="space-y-3">
                          {state.upcomingActivities.map((activity) => (
                            <div key={activity.id} onClick={() => setSelectedActivity(activity)}>
                              <ActivityCard
                                activity={activity}
                                currentUserId={currentUserId}
                                upcomingActivities={state.upcomingActivities || []}
                                onClick={() => setSelectedActivity(activity)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm text-slate-400 py-6 bg-slate-50 rounded-2xl border border-slate-100">
                          No upcoming activities yet. Add something restorative for
                          the week ahead.
                        </div>
                      )}
                    </div>
                  )}

                  {/* DISCOVER ACTIVITY MENU */}
                  {communityMenu === "discover" && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe size={18} className="text-emerald-500" />
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Discover Activity
                        </h3>
                      </div>
                      {state.publicEvents?.length ? (
                        <div className="space-y-3">
                          {state.publicEvents.map((activity) => (
                            <div key={activity.id} onClick={() => setSelectedActivity(activity)}>
                              <ActivityCard
                                activity={activity}
                                currentUserId={currentUserId}
                                upcomingActivities={state.upcomingActivities || []}
                                onClick={() => setSelectedActivity(activity)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm text-slate-400 py-6 bg-slate-50 rounded-2xl border border-slate-100">
                          No public events available right now.
                        </div>
                      )}
                    </div>
                  )}

                  {/* PLAN AN ACTIVITY MENU */}
                  {communityMenu === "plan" && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-emerald-500" />
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Plan an Activity
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm text-slate-600">
                          Plan for yourself or host a group. AI suggestions stay on-device;
                          swap in your backend when ready.
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Private
                            </div>
                            <div className="text-sm text-slate-700">
                              Quick AI ideas or manual steps. Saves into My Upcoming.
                            </div>
                          </div>
                          <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Public (hosted)
                            </div>
                            <div className="text-sm text-slate-700">
                              Publish to friends or public. Allows ask-to-join.
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPlanModal(true)}
                          className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                          <Sparkles size={16} /> Plan an activity
                        </button>
                        <div className="text-[11px] text-slate-400 leading-relaxed">
                          Accept AI ideas to confirm instantly. Public group events appear
                          in Discover. Friends can ask to join; manage inside the details
                          modal.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Inbox</h2>
            </div>

            {/* Sub-tabs */}
            <div className="px-6 flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setInboxSubTab("messages")}
                className={`px-4 py-2 text-sm font-bold transition-colors relative ${
                  inboxSubTab === "messages"
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Messages
                {(() => {
                  const unreadCount = getUnreadConversationCount(currentUserId);
                  return unreadCount > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] inline-flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  );
                })()}
                {inboxSubTab === "messages" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setInboxSubTab("updates")}
                className={`px-4 py-2 text-sm font-bold transition-colors relative ${
                  inboxSubTab === "updates"
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Updates
                {unresolvedUpdates.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] inline-flex items-center justify-center px-1">
                    {unresolvedUpdates.length > 99 ? '99+' : unresolvedUpdates.length}
                  </span>
                )}
                {inboxSubTab === "updates" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {inboxSubTab === "messages" && (() => {
                const conversations = getAllConversationsSorted();
                
                return conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageCircle size={48} className="text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No messages yet</h3>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Private conversations with friends will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-2">
                    {conversations.map((conversation) => {
                      const otherUserId = getOtherParticipantId(conversation, currentUserId);
                      const otherUser = state.friendsList?.find(f => f.id === otherUserId);
                      const lastMessage = conversation.messages[conversation.messages.length - 1];
                      const isMyMessage = lastMessage?.senderId === currentUserId;
                      const timestamp = lastMessage?.createdAt ? formatRelativeTime(lastMessage.createdAt) : '';
                      const isUnread = isConversationUnread(conversation, currentUserId);
                      
                      // Fallback if friend not found in list
                      const displayName = otherUser?.name || 'Unknown';
                      const displayAvatar = otherUser?.avatar || 'bg-slate-400';
                      
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => {
                            if (otherUser) {
                              openChat(otherUser);
                              setActiveTab("community");
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full ${displayAvatar} flex items-center justify-center text-white font-bold flex-shrink-0 relative`}>
                              {displayName[0]}
                              {isUnread && (
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                                  {displayName}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {timestamp}
                                </span>
                              </div>
                              <p className={`text-xs truncate ${isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                {isMyMessage && 'You: '}{lastMessage?.text || ''}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {inboxSubTab === "updates" && (
                <div className="p-6 space-y-2">
                  {unresolvedUpdates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell size={48} className="text-slate-300 mb-3" />
                      <h3 className="text-lg font-bold text-slate-700 mb-1">All caught up!</h3>
                      <p className="text-sm text-slate-400 max-w-xs">
                        You have no pending updates. New activity changes and messages will appear here.
                      </p>
                    </div>
                  ) : (
                    unresolvedUpdates.map((update) => {
                      const activity = findActivityById(update.eventId);
                      const eventTitle = activity?.title || "Unknown Event";
                      
                      // Generate update text and icon based on type
                      let updateText = "";
                      let updateIcon = null;
                      
                      switch (update.type) {
                        case UPDATE_TYPES.EVENT_CHAT:
                          updateText = `New message in '${eventTitle}'`;
                          updateIcon = <MessageCircle size={20} className="text-blue-500" />;
                          break;
                        case UPDATE_TYPES.JOIN_REQUEST:
                          updateText = `Join request for '${eventTitle}'`;
                          updateIcon = <UserPlus size={20} className="text-purple-500" />;
                          break;
                        case UPDATE_TYPES.JOIN_APPROVED:
                          updateText = `Your request was approved for '${eventTitle}'`;
                          updateIcon = <Check size={20} className="text-green-500" />;
                          break;
                        case UPDATE_TYPES.JOIN_DECLINED:
                          updateText = `Your request was declined for '${eventTitle}'`;
                          updateIcon = <X size={20} className="text-red-500" />;
                          break;
                        case UPDATE_TYPES.EVENT_UPDATED:
                          updateText = `'${eventTitle}' was updated`;
                          updateIcon = <Edit2 size={20} className="text-orange-500" />;
                          break;
                        case UPDATE_TYPES.EVENT_CANCELLED:
                          updateText = `'${eventTitle}' was cancelled`;
                          updateIcon = <AlertTriangle size={20} className="text-red-500" />;
                          break;
                        case UPDATE_TYPES.PARTICIPANT_LEFT:
                          updateText = `${update.actorName || 'Someone'} left '${eventTitle}'`;
                          updateIcon = <UserMinus size={20} className="text-slate-500" />;
                          break;
                        default:
                          updateText = `Update for '${eventTitle}'`;
                          updateIcon = <Bell size={20} className="text-slate-400" />;
                      }
                      
                      return (
                        <button
                          key={update.id}
                          onClick={() => handleUpdateClick(update)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {updateIcon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 mb-1">
                                {updateText}
                              </p>
                              {update.message && (
                                <p className="text-xs text-slate-500 mb-1 truncate">
                                  {update.message}
                                </p>
                              )}
                              <p className="text-xs text-slate-400">
                                {formatRelativeTime(update.createdAt)}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Settings</h2>

            {/* Demo Mode */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              {/* Top row: Title and Toggle */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCw size={18} /> Demo Mode
                </h3>
                <button
                  onClick={() => {
                    const next = !state.demoMode;
                    actions.setDemoMode(next);
                    if (next) {
                      actions.resetAllState({ demoMode: next });
                    }
                  }}
                  className={`group relative inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full border transition-all ${
                    state.demoMode
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-400 shadow-lg shadow-emerald-200/60"
                      : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  <div
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      state.demoMode ? "bg-white/30" : "bg-white"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        state.demoMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                  <span className={`text-[10px] font-normal ${state.demoMode ? "text-white/90" : "text-slate-500"}`}>
                    {state.demoMode ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
              {/* Bottom row: Full-width explanatory text */}
              <p className="text-[10px] text-slate-400 leading-relaxed">
                When enabled, the app ignores saved data and reloads clean
                defaults on refresh. Turn it off to keep your progress.
              </p>
            </div>

            {/* Account Section */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={18} /> Account
              </h3>
              {state.userAccount.loggedIn ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {state.userAccount.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {state.userAccount.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {state.userAccount.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      actions.setUserAccount({
                        ...state.userAccount,
                        loggedIn: false,
                      })
                    }
                    className="w-full border border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-50"
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-xs">
                    Sign In
                  </button>
                  <button className="w-full border border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs">
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Social Privacy */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Globe size={18} /> Social Privacy
              </h3>

              {/* Option 1: Share Alternatives List */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-600">
                  Share Alternatives List
                </div>
                <button
                  onClick={() =>
                    actions.setSettings({
                      ...state.settings,
                      shareAlternatives: !state.settings.shareAlternatives,
                    })
                  }
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    state.settings.shareAlternatives
                      ? "bg-blue-600"
                      : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      state.settings.shareAlternatives ? "left-5" : "left-1"
                    }`}
                  ></div>
                </button>
              </div>

              {/* Option 2: Share Current Activity */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-600">
                  Share Current Activity
                </div>
                <button
                  onClick={() =>
                    actions.setSettings({
                      ...state.settings,
                      shareActivity: !state.settings.shareActivity,
                    })
                  }
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    state.settings.shareActivity
                      ? "bg-blue-600"
                      : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      state.settings.shareActivity ? "left-5" : "left-1"
                    }`}
                  ></div>
                </button>
              </div>

              {/* Option 3: Share Recent Mood */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600">
                  Share Recent Mood
                </div>
                <button
                  onClick={() =>
                    actions.setSettings({
                      ...state.settings,
                      shareMood: !state.settings.shareMood,
                    })
                  }
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    state.settings.shareMood ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      state.settings.shareMood ? "left-5" : "left-1"
                    }`}
                  ></div>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-50 leading-relaxed">
                Control exactly what friends see on the leaderboard. Disabling
                "Share Current Activity" hides your live status. Disabling
                "Share Recent Mood" hides your emotional context.
              </p>
            </div>

            {/* Monitored Apps */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Shield size={18} /> Monitored Apps
              </h3>
              <button
                onClick={() => setIsEditingApps(true)}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"
              >
                Edit
              </button>
              <div className="flex flex-wrap gap-2 mt-2">
                {state.monitoredApps.map((id) => {
                  const app = state.customApps.find((a) => a.id === id);
                  return app ? (
                    <div
                      key={id}
                      className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1"
                    >
                      {getIcon(app?.iconName)} {app.name}
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* QUICK TASK SETTINGS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Zap size={18} /> Quick Task (Emergency)
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    state.userAccount.isPremium
                      ? "bg-purple-50 text-purple-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {state.userAccount.isPremium ? "Premium" : "Free"}
                </span>
              </div>

              {!state.userAccount.isPremium ? (
                <>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Duration</span>
                    <span>{state.demoMode ? "Testing (10 s)" : "3 min"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Uses per 15 minutes</span>
                    <span>1</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Upgrade to Premium to customize these.
                    {state.demoMode
                      ? " Demo mode uses the 10s testing timer automatically."
                      : ""}
                  </p>
                  <button
                    onClick={() =>
                      actions.setUserAccount({
                        ...state.userAccount,
                        isPremium: true,
                      })
                    }
                    className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Upgrade to Premium
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Duration
                    </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QUICK_TASK_DURATION_OPTIONS.map(({ value, label }) => {
                      const isTestOption =
                        value === QUICK_TASK_TEST_DURATION_MINUTES;
                      const buttonLabel = isTestOption
                        ? label
                        : `${label} (${formatQuickTaskDuration(value)})`;
                      return (
                        <button
                          key={value}
                          onClick={() =>
                            actions.setQuickTaskDurationMinutes(value)
                          }
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center text-center ${
                            state.quickTaskDurationMinutes === value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          {buttonLabel}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Quick tasks per 15 minutes
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map((val) => (
                        <button
                          key={val}
                          onClick={() => actions.setQuickTaskUsesPerWindow(val)}
                          className={`p-3 rounded-xl border text-xs font-bold ${
                            state.quickTaskUsesPerWindow === val
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          {val} use{val > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* THEME SELECTOR */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 mt-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sliders size={18} /> Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    actions.setSettings({ ...state.settings, theme: "default" })
                  }
                  className={`p-3 rounded-xl border ${
                    state.settings.theme === "default"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200"
                  } text-xs font-bold`}
                >
                  Default (Dark)
                </button>
                <button
                  onClick={() =>
                    actions.setSettings({ ...state.settings, theme: "forest" })
                  }
                  className={`p-3 rounded-xl border ${
                    state.settings.theme === "forest"
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200"
                  } text-xs font-bold`}
                >
                  Forest
                </button>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 mt-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sliders size={18} /> Preferences
              </h3>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">
                    Intervention Duration
                  </span>
                  <span className="text-xs text-blue-600 font-bold">
                    {state.settings.interventionDuration}s
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={state.settings.interventionDuration}
                  onChange={(e) =>
                    actions.setSettings({
                      ...state.settings,
                      interventionDuration: e.target.value,
                    })
                  }
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">
                    App Switch Interval
                  </span>
                  <span className="text-xs text-blue-600 font-bold">
                    {state.settings.gracePeriod}m
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={state.settings.gracePeriod}
                  onChange={(e) =>
                    actions.setSettings({
                      ...state.settings,
                      gracePeriod: e.target.value,
                    })
                  }
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Allows switching between configured apps without a new
                  breathing exercise.
                </p>
              </div>
            </div>

            <div className="text-center text-xs text-slate-300 pt-4">
              {VERSION_ID}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-6 flex justify-around z-50">
        <NavIcon
          icon={<BarChart2 size={20} />}
          label="Insights"
          active={activeTab === "insights"}
          onClick={() => setActiveTab("insights")}
        />
        <NavIcon
          icon={<Users size={20} />}
          label="Community"
          active={activeTab === "community"}
          onClick={() => setActiveTab("community")}
        />
        <NavIcon
          icon={<Inbox size={20} />}
          label="Inbox"
          active={activeTab === "inbox"}
          onClick={() => setActiveTab("inbox")}
          badge={getUnresolvedCount() + getUnreadConversationCount(currentUserId)}
        />
        <NavIcon
          icon={<Settings size={20} />}
          label="Settings"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </div>

      {/* --- MODALS --- */}

      {false && state.createEventDraft && (
        <div className="hidden" />
      )}

      <PlanActivityModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setActivityToEdit(null);
        }}
        defaultDate={todayIso}
        editActivity={activityToEdit}
        onCreateSolo={(data) => addSoloActivity(data, { source: "manual", onComplete: () => { setShowPlanModal(false); setActivityToEdit(null); } })}
        onUpdateActivity={handleUpdateActivity}
        onSaveSuggestion={(suggestion) =>
          addSoloActivity(
            { ...suggestion, date: suggestion.date || todayIso },
            { source: "ai", onComplete: () => { setShowPlanModal(false); setActivityToEdit(null); } }
          )
        }
        onCreateGroup={(data) => addGroupActivity(data)}
      />

      <AltSchedulerModal
        isOpen={state.showAltScheduler}
        activity={state.altPlanDraft || state.selectedAlternative}
        friends={state.friendsList.filter((f) => f.id !== currentUserId)}
        onSave={onSavePlannedAlternative}
        onClose={() => {
          actions.setShowAltScheduler(false);
          actions.setAltPlanDraft(null);
        }}
      />

      <ActivityDetailsModal
        activity={selectedActivity}
        currentUserId={currentUserId}
        onClose={() => setSelectedActivity(null)}
        onRequestJoin={handleRequestToJoin}
        onStartActivity={handleStartCommunityActivity}
        onEditActivity={handleEditActivity}
        onCancelActivity={handleCancelActivity}
        onQuitActivity={handleQuitActivity}
        onCancelRequest={handleCancelRequest}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
        onChatOpened={handleChatOpened}
        upcomingActivities={state.upcomingActivities || []}
        pendingRequests={state.pendingRequests || []}
        requests={
          selectedActivity
            ? (
                state.pendingRequests ||
                state.incomingRequests ||
                []
              ).filter(
                (req) =>
                  req.activityId === selectedActivity.id ||
                  req.activityId === selectedActivity.sourceId
              )
            : []
        }
      />

      {/* Join Session Modal (App Selection) */}
      {joiningSession && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom h-[60vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Join {joiningSession.topic}</h3>
              <button
                onClick={() => setJoiningSession(null)}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select the apps you are allowed to use during this session.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {/* MindfulOS Always Included */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 flex justify-between items-center opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Shield size={18} />
                  </div>
                  <span className="font-bold text-sm">BreakLoop</span>
                </div>
                <Check size={16} className="text-blue-600" />
              </div>
              {state.customApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    if (selectedSessionApps.includes(app.id))
                      setSelectedSessionApps(
                        selectedSessionApps.filter((id) => id !== app.id)
                      );
                    else
                      setSelectedSessionApps([...selectedSessionApps, app.id]);
                  }}
                  className={`w-full p-3 rounded-xl border flex justify-between items-center ${
                    selectedSessionApps.includes(app.id)
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${app.color}`}
                    >
                      {app.icon}
                    </div>
                    <span className="text-sm font-bold">{app.name}</span>
                  </div>
                  {selectedSessionApps.includes(app.id) && (
                    <Check size={16} className="text-green-600" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleJoinSession}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
            >
              Start Focus
            </button>
          </div>
        </div>
      )}

      {/* --- ADD FRIEND / BUDDY MODAL --- */}
      {(isAddingFriend || isAddingBuddy) && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom flex flex-col h-[70vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {isAddingBuddy ? "Add Buddy" : "Add Friend"}
              </h3>
              <button
                onClick={() => {
                  setIsAddingFriend(false);
                  setIsAddingBuddy(false);
                }}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
              <button
                onClick={() => setAddFriendTab("phone")}
                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                  addFriendTab === "phone"
                    ? "bg-white shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <Contact size={14} /> Cellphone
              </button>
              <button
                onClick={() => setAddFriendTab("whatsapp")}
                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                  addFriendTab === "whatsapp"
                    ? "bg-white shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {MOCK_CONTACTS.filter((c) => c.type === addFriendTab).map(
                (contact, i) => {
                  const existing = state.friendsList.find(
                    (f) => f.name === contact.name
                  );

                  // Check status based on what we are adding
                  let isAdded = false;
                  if (isAddingBuddy) {
                    isAdded =
                      existing?.buddyStatus === "accepted" ||
                      existing?.buddyStatus === "pending";
                  } else {
                    isAdded =
                      existing?.status === "accepted" ||
                      existing?.status === "pending";
                  }

                  const wasDeleted = state.deletedFriends.includes(
                    contact.name
                  );

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border-b border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                          {contact.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-800">
                            {contact.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {contact.type === "phone"
                              ? "+49 152 ..."
                              : "Last seen today"}
                          </div>
                        </div>
                      </div>
                      {isAdded ? (
                        <span className="text-xs text-slate-400 font-bold px-4 py-2">
                          {existing?.buddyStatus === "pending" ||
                          existing?.status === "pending"
                            ? "Invited"
                            : "Added"}
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            handleAddContact(
                              contact,
                              isAddingBuddy ? "buddy" : "friend"
                            )
                          }
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                            isAdded
                              ? "bg-slate-100 text-slate-400"
                              : "bg-blue-600 text-white hover:bg-blue-500"
                          }`}
                        >
                          {wasDeleted && !isAddingBuddy ? (
                            "Add Back"
                          ) : (
                            <>
                              <Send size={12} /> Invite
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MESSAGING BUDDY MODAL --- */}
      {messagingBuddy && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Message {messagingBuddy.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Pick a thoughtful message.
                </p>
              </div>
              <button
                onClick={() => setMessagingBuddy(null)}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {messagingBuddy.situation === "stuck" ? (
                <>
                  <button
                    onClick={() => setMessagingBuddy(null)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                  >
                    "Hey! 👋 Noticed you've been online a while. Want to grab a
                    coffee?"
                  </button>
                  <button
                    onClick={() => setMessagingBuddy(null)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                  >
                    "Sending you some good vibes! ✨ Time for a screen break?"
                  </button>
                  <button
                    onClick={() => setMessagingBuddy(null)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                  >
                    "I'm going for a walk. Care to join via phone call?"
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setMessagingBuddy(null)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
                >
                  "Hey! Just thinking of you."
                </button>
              )}
            </div>
            <div className="text-center text-xs text-slate-400">
              Message sent via WhatsApp
            </div>
          </div>
        </div>
      )}

      {isEditingValues && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Manage Values</h3>
              <button
                onClick={() => setIsEditingValues(false)}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start pb-4">
              {state.availableValueCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (state.selectedValues.includes(c.id))
                      actions.setSelectedValues(
                        state.selectedValues.filter((v) => v !== c.id)
                      );
                    else
                      actions.setSelectedValues([
                        ...state.selectedValues,
                        c.id,
                      ]);
                  }}
                  className={`p-4 rounded-xl border-2 text-left ${
                    state.selectedValues.includes(c.id)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-xs font-bold">{c.label}</div>
                </button>
              ))}
            </div>
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">
                Add Custom
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Value Name"
                  className="flex-1 bg-white border border-slate-200 rounded px-2 text-sm"
                  value={newValueCard.label}
                  onChange={(e) =>
                    setNewValueCard({ ...newValueCard, label: e.target.value })
                  }
                />
                <button
                  onClick={handleAddValueCard}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsEditingValues(false)}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {isEditingApps && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Monitored Apps</h3>
              <button
                onClick={() => setIsEditingApps(false)}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            <AppSelectionScreen
              apps={state.customApps}
              selected={state.monitoredApps}
              onToggle={(id) => {
                if (state.monitoredApps.includes(id))
                  actions.setMonitoredApps(
                    state.monitoredApps.filter((a) => a !== id)
                  );
                else actions.setMonitoredApps([...state.monitoredApps, id]);
              }}
              onAddWebsite={(url) => {
                const newSite = {
                  id: `web-${Date.now()}`,
                  name: url,
                  icon: <Globe size={24} />,
                  color: "bg-slate-400",
                  type: "distraction",
                  category: "web",
                };
                actions.setCustomApps([...state.customApps, newSite]);
              }}
              onFinish={() => setIsEditingApps(false)}
            />
          </div>
        </div>
      )}
    </PhoneShell>
  );
}

const PhoneShell = ({ children, statusBar, bg = "bg-black" }) => (
  <div className="min-h-screen bg-slate-800 flex justify-center items-center p-4">
    <div
      className={`w-[360px] h-[740px] ${bg} rounded-[50px] border-[8px] border-slate-800 relative overflow-hidden shadow-2xl flex flex-col`}
    >
      {statusBar}
      {children}
    </div>
  </div>
);

const AppIcon = ({ name, color, icon, onClick, isUnlocked, isMonitored }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 group relative"
  >
    <div
      className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-md transition-transform group-active:scale-90 relative overflow-hidden`}
    >
      {icon}
      {isMonitored && isUnlocked && (
        <div className="absolute inset-0 border-4 border-green-400 rounded-2xl animate-pulse"></div>
      )}
    </div>
    <span
      className={`text-[11px] font-medium text-center leading-tight w-16 truncate ${
        name === "BreakLoop"
          ? "text-violet-400 font-bold"
          : color.includes("bg-white")
          ? "text-slate-800"
          : "text-white drop-shadow-md"
      }`}
    >
      {name}
    </span>
  </button>
);

const DockIcon = ({ bg, icon }) => (
  <button
    className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95`}
  >
    {icon}
  </button>
);
const NavIcon = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 relative ${
      active ? "text-blue-600" : "text-slate-400"
    }`}
  >
    <div className="relative">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const AppSelectionScreen = ({
  apps,
  selected,
  onToggle,
  onAddWebsite,
  onFinish,
}) => {
  const [tab, setTab] = useState("app");
  const [url, setUrl] = useState("");
  return (
    <>
      <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => setTab("app")}
          className={`flex-1 py-2 text-xs font-bold rounded-md ${
            tab === "app" ? "bg-white shadow-sm" : ""
          }`}
        >
          Apps
        </button>
        <button
          onClick={() => setTab("web")}
          className={`flex-1 py-2 text-xs font-bold rounded-md ${
            tab === "web" ? "bg-white shadow-sm" : ""
          }`}
        >
          Websites
        </button>
      </div>
      {tab === "web" && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="example.com"
            className="flex-1 bg-slate-100 rounded-lg px-3 text-xs"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={() => {
              onAddWebsite(url);
              setUrl("");
            }}
            disabled={!url}
            className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold"
          >
            Add
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4 scrollbar-hide">
        {apps
          .filter((a) => a.category === tab)
          .map((app) => (
            <button
              key={app.id}
              onClick={() => onToggle(app.id)}
              className={`w-full p-3 rounded-xl border flex justify-between items-center ${
                selected.includes(app.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${app.color}`}
                >
                  {app.icon}
                </div>
                <span className="text-sm font-bold">{app.name}</span>
              </div>
              {selected.includes(app.id) && (
                <Check size={16} className="text-blue-600" />
              )}
            </button>
          ))}
      </div>
      <button
        onClick={onFinish}
        className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
      >
        Done
      </button>
    </>
  );
};
