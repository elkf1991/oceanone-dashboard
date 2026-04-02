/**
 * Ocean One Team Data
 * Generated from team/teammates.json
 * Kobo Lam added as Team Manager (root node)
 * Active teammates sorted by interviewDate (earliest first)
 */

const TRAINING_LIST = {
  L1: { name: "心態 Training", durationHrs: 3 },
  L2: { name: "Product Training", durationHrs: 2 },
  L3: { name: "CDP, Career Development Planning", durationHrs: 2, note: "一人一節" },
  L4: { name: "講 Plan Training", durationHrs: 2 },
  L5: { name: "邀約 Training", durationHrs: 2 },
  "自爆": { name: "自己買一份儲蓄保險", durationHrs: null }
};

const MEMBERS = {
  kobo: {
    id: "kobo",
    displayName: "Kobo Lam",
    fullName: "Lam Cheuk Hang (林卓衡)",
    role: "Team Manager",
    contact: null,
    background: "Team Manager",
    interviewDate: null,
    trainingCompleted: [],
    trainingScheduled: {},
    trainingPending: [],
    exam: { paper1: "N/A", paper3: "N/A", licence: "N/A" },
    accomplishment: {},
    remarks: null,
    availabilityType: "flexible",
    timetable: null
  },
  ken: {
    id: "ken",
    displayName: "Ken",
    fullName: "望月謙",
    contact: "60867358",
    background: "CityU 學生",
    interviewDate: "2026-01-19",
    trainingCompleted: ["L1", "L2", "L3"],
    trainingScheduled: { L4: "2026-03-20 09:00-11:00 (暫定，待confirm)" },
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L4 暫定 03-20 Fri 09:00-11:00，待 confirm",
    availabilityType: "timetable",
    timetable: {
      Mon: "after 14:00",
      Tue: "not available",
      Wed: "not available",
      Thu: "09:00-11:00, after 16:00",
      Fri: "before 14:00"
    }
  },
  lilyli: {
    id: "lilyli",
    displayName: "Lily Li",
    fullName: "Li Sin Yi (李倩怡)",
    contact: "64023868",
    background: "HKU Space 九龍灣分校學生",
    interviewDate: "2026-01-19",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: { L4: "2026-03-16 Mon 09:00-11:00 (已邀約 pending confirmation)" },
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: { "自爆": "2026-01-19", "邀約Interview": "In Progress" },
    remarks: "L4 已於 03-09 已完成；03-16 Mon 09:00-11:00 L4 已邀約 pending confirmation",
    availabilityType: "timetable",
    timetable: {
      Mon: "free",
      Tue: "free",
      Wed: "not available",
      Thu: "after ~15:30",
      Fri: "not available"
    }
  },
  jacky: {
    id: "jacky",
    displayName: "Jacky",
    fullName: "Chow Po Yin (鄒普賢)",
    contact: "51990757",
    background: "非學生",
    interviewDate: "2026-01-15",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: {},
    trainingPending: ["L5"],
    exam: { paper1: "Passed (Feb 2026)", paper3: "Passed (2026-03-19)", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L4 2026-03-13 已完成；Paper3 2026-03-19 Passed；Available 時間每次再約",
    availabilityType: "by_booking",
    timetable: null
  },
  jarvis: {
    id: "jarvis",
    displayName: "Jarvis",
    fullName: "Tang Hei Shun",
    contact: "97667367",
    background: "PolyU 學生",
    interviewDate: "2026-01-30",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: {},
    trainingPending: ["L5"],
    exam: { paper1: "已考 2026-03-09（筆試，約一星期知結果）", paper3: "擬報 2026-03-20（未確認）", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: { "邀約Interview": "1 now" },
    remarks: "Paper1 03-09 已考（筆試約一星期知結果）；Paper3 擬報 03-20 未確認；L4 2026-03-13 已完成",
    availabilityType: "timetable",
    timetable: {
      Mon: "not available",
      Tue: "free",
      Wed: "likely not available",
      Thu: "after 16:00",
      Fri: "free"
    }
  },
  achi: {
    id: "achi",
    displayName: "阿智",
    fullName: null,
    contact: "66989079",
    background: "YMCA 尖沙咀（應用教育文憑）學生",
    interviewDate: "2026-02-03",
    trainingCompleted: ["L1", "L2"],
    trainingScheduled: { L4: "2026-03-18 15:00-17:00 (暫定，待上完L2/L3後confirm)" },
    trainingPending: ["L3", "L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L2 2026-03-11 已完成；L4 暫定 03-18 15:00-17:00",
    availabilityType: "timetable",
    timetable: {
      Mon: "before 11:30",
      Tue: "not available",
      Wed: "free",
      Thu: "not available",
      Fri: "not available"
    }
  },
  austin: {
    id: "austin",
    displayName: "Austin",
    fullName: null,
    contact: "65878782",
    background: "香港恒生大學學生",
    interviewDate: "2026-02-03",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: {},
    trainingPending: ["L5"],
    exam: { paper1: "已報 2026-03-17", paper3: "已報 2026-03-17", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: { "自爆": "2026-02-27" },
    remarks: "L4 2026-03-13 已完成；Paper1、Paper3 已報 03-17 考試；2026-03-17–24 日本不在港。Fri 下午固定工作 not available。與 Vanessa 情侶，meeting 須同 timeslot",
    availabilityType: "timetable",
    timetable: {
      Mon: "free",
      Tue: "free",
      Wed: "not available",
      Thu: "not available",
      Fri: "before 11:00"
    }
  },
  kitty: {
    id: "kitty",
    displayName: "Kitty Ma",
    fullName: null,
    contact: "65105718",
    background: "非學生，有正職 Mon-Fri 09:00-18:00",
    interviewDate: "2026-02-03",
    trainingCompleted: ["L1"],
    trainingScheduled: { L2: "2026-03-27 19:00-21:00" },
    trainingPending: ["L3", "L4", "L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L2 03-27 Fri 19:00-21:00（晚上）",
    availabilityType: "weekday_evening_weekend",
    timetable: null
  },
  sarah: {
    id: "sarah",
    displayName: "Sarah",
    fullName: "Tsang Tsz Yan (曾梓殷)",
    contact: "67063305",
    background: "HKU Space 九龍灣分校學生",
    interviewDate: "2026-02-03",
    trainingCompleted: ["L1", "L2", "L3"],
    trainingScheduled: {},
    trainingPending: ["L4", "L5"],
    exam: { paper1: "2026-03-16", paper3: "2026-03-16", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: { "自爆": "2026-02-26" },
    remarks: "03-13 L4 生病缺席，待 reschedule；Paper1、Paper3 2026-03-16 考",
    availabilityType: "timetable",
    timetable: {
      Mon: "not available",
      Tue: "after 17:00",
      Wed: "not available",
      Thu: "free",
      Fri: "free"
    }
  },
  vanessa: {
    id: "vanessa",
    displayName: "Vanessa",
    fullName: "Wong Wing Lam (王穎琳)",
    contact: "53151646",
    background: "香港恒生大學學生",
    interviewDate: "2026-02-03",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: {},
    trainingPending: ["L5"],
    exam: { paper1: "Passed", paper3: "Passed", licence: "已成功上牌" },
    accomplishment: { "自爆": "2026-02-27" },
    remarks: "L4 2026-03-13 已完成；3月: 03-09 not available; 03-10 after 14:00; 03-17~24 日本。與 Austin 情侶，meeting 須同 timeslot",
    availabilityType: "timetable",
    timetable: {
      Mon: "free",
      Tue: "free",
      Wed: "not available",
      Thu: "not available",
      Fri: "before 11:00, after 16:00"
    }
  },
  zenia: {
    id: "zenia",
    displayName: "Zenia",
    fullName: "Tai Tsz Ching",
    contact: "60859565",
    background: "CUHK 學生",
    interviewDate: "2026-02-03",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: {},
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L2 2026-03-06 已完成；L3 2026-03-17 已完成；L4 2026-03-16 已完成",
    availabilityType: "timetable",
    timetable: {
      Mon: "before 15:30",
      Tue: "after 15:30",
      Wed: "after 14:30",
      Thu: "not available",
      Fri: "after 15:30"
    }
  },
  rita: {
    id: "rita",
    displayName: "Rita",
    fullName: "黃泳羲",
    contact: "98835752",
    background: "HKCC 學生",
    interviewDate: "2026-02-06",
    trainingCompleted: ["L1", "L2", "L3"],
    trainingScheduled: {},
    trainingPending: ["L4", "L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L3 2026-03-13 已完成。Wed 她想休息，非首選",
    availabilityType: "timetable",
    timetable: {
      Mon: "13:00-16:00",
      Tue: "after 17:00",
      Wed: "free but not preferred",
      Thu: "not available",
      Fri: "after 12:00"
    }
  },
  yexinyu: {
    id: "yexinyu",
    displayName: "Sophia",
    fullName: "葉心雨",
    contact: "54206966",
    background: "暨南大學珠海校區學生",
    interviewDate: "2026-02-24",
    trainingCompleted: ["L1", "L2"],
    trainingScheduled: { L3: "2026-03-19 10:00-12:00", L4: "2026-03-20 09:00-11:00 (暫定，待上完L1/L2/L3後confirm)" },
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L1 2026-03-12 已完成；L2 2026-03-13 已完成；L3 03-19 Thu 10:00-12:00；L4 暫定 03-20。Mon-Wed 珠海；Thu/Fri 在香港 before 18:00",
    availabilityType: "timetable",
    timetable: {
      Mon: "not available (珠海)",
      Tue: "not available (珠海)",
      Wed: "not available (珠海)",
      Thu: "before 18:00",
      Fri: "before 18:00"
    }
  },
  sam: {
    id: "sam",
    displayName: "Sam",
    fullName: "湯智深",
    contact: "56078910",
    background: "HKU Space 炮台山分校學生",
    interviewDate: "2026-02-25",
    trainingCompleted: ["L1", "L2", "L3", "L4"],
    trainingScheduled: {},
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L3 2026-03-12 已完成；L4 2026-03-16 已完成",
    availabilityType: "timetable",
    timetable: {
      Mon: "free",
      Tue: "before 13:00",
      Wed: "before 13:00",
      Thu: "after 14:30",
      Fri: "before 11:00, after 16:30"
    }
  },
  yuki: {
    id: "yuki",
    displayName: "Yuki",
    fullName: null,
    contact: "67630652",
    background: "輟學",
    interviewDate: "2026-02-26",
    trainingCompleted: ["L1", "L2"],
    trainingScheduled: {},
    trainingPending: ["L3", "L4", "L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "基本上所有時間都可以。L1 03-05、L2 03-06 已完成。去了波蘭旅行，4月5日才回港。",
    availabilityType: "flexible",
    timetable: null
  },
  isaac: {
    id: "isaac",
    displayName: "Isaac",
    fullName: null,
    contact: "55409209",
    background: "PolyU 學生",
    interviewDate: "2026-02-27",
    trainingCompleted: ["L1", "L2"],
    trainingScheduled: { L3: "2026-03-20 15:00-17:00", L4: "2026-03-20 09:00-11:00 (暫定，待上完L2/L3後confirm)" },
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L2 2026-03-13 已完成；L3 03-20 Fri 15:00-17:00；L4 暫定 03-20 Fri 09:00-11:00",
    availabilityType: "timetable",
    timetable: {
      Mon: "有其他工作",
      Tue: "有其他工作",
      Wed: "before 14:00",
      Thu: "not available",
      Fri: "free"
    }
  },
  eric: {
    id: "eric",
    displayName: "Eric",
    fullName: null,
    contact: "51294119",
    background: "香港恒生大學學生",
    interviewDate: "2026-03-03",
    trainingCompleted: ["L1", "L2", "L4"],
    trainingScheduled: { L3: "2026-03-18 10:00-12:00" },
    trainingPending: ["L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L2 2026-03-11 已完成；L4 2026-03-16 已完成；L3 03-18 Wed 10:00-12:00",
    availabilityType: "timetable",
    timetable: {
      Mon: "before 11:00",
      Tue: "after 16:00",
      Wed: "free",
      Thu: "free",
      Fri: "before 11:00"
    }
  },
  matthew: {
    id: "matthew",
    displayName: "Matthew",
    fullName: "Chau Chun Hei",
    contact: "95813177",
    background: "學生",
    interviewDate: "2026-03-11",
    trainingCompleted: ["L1"],
    trainingScheduled: { L2: "2026-03-20 10:00-12:00" },
    trainingPending: ["L3", "L4", "L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "L1 2026-03-16 已完成；L2 03-20 Fri 10:00-12:00。2026-03-16 至 2026-09-01 開學前不用上堂，all time available",
    availabilityType: "timetable",
    timetable: {
      Mon: "free",
      Tue: "free",
      Wed: "free",
      Thu: "free",
      Fri: "free"
    }
  },
  alita: {
    id: "alita",
    displayName: "Alita",
    fullName: "黄嘉宜",
    contact: "64808905",
    background: "香港樹仁大學學生",
    interviewDate: "2026-03-27",
    trainingCompleted: [],
    trainingScheduled: {},
    trainingPending: ["L1", "L2", "L3", "L4", "L5"],
    exam: { paper1: "未排期", paper3: "未排期", licence: "須通過 Paper1+Paper3 後辦理" },
    accomplishment: {},
    remarks: "Tue/Wed/Thu/Fri 有上堂時段，其餘時間有機會兼職，要再夾",
    availabilityType: "timetable",
    timetable: {
      Mon: "free",
      Tue: "before 12:00（其餘時間或需兼職，再夾）",
      Wed: "before 13:00, after 16:00（其餘時間或需兼職，再夾）",
      Thu: "before 17:00（其餘時間或需兼職，再夾）",
      Fri: "before 11:00, after 19:00（其餘時間或需兼職，再夾）"
    }
  }
};

// Org chart hierarchy — sorted by interviewDate (earliest first, left to right)
const ORG_TREE = {
  id: "kobo",
  displayName: "Kobo Lam",
  role: "Team Manager",
  children: [
    { id: "ken" },
    { id: "lilyli" },
    { id: "jacky" },
    { id: "jarvis" },
    { id: "achi" },
    { id: "austin" },
    { id: "kitty" },
    { id: "sarah" },
    { id: "vanessa" },
    { id: "zenia" },
    { id: "rita" },
    { id: "yexinyu" },
    { id: "sam" },
    { id: "yuki" },
    { id: "isaac" },
    { id: "eric" },
    { id: "matthew" },
    { id: "alita" }
  ]
};
