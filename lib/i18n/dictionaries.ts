import { type Locale, DEFAULT_LOCALE } from "./config";

// The English dictionary is the canonical shape; `th` must mirror it exactly
// (TypeScript enforces this via the `Dictionary` type below). Keys are grouped
// by feature namespace so the incremental rollout to remaining pages stays
// organized — add new namespaces here and resolve them with t()/translate().
//
// NOTE: only hardcoded UI chrome belongs here. Database-sourced values (KPI
// category names, faculty names) already arrive as Thai domain data and must
// NOT be translated.
const en = {
  common: {
    language: "Language",
    thai: "ไทย",
    english: "English",
    loading: "Loading…",
  },
  nav: {
    groups: {
      overview: "Overview",
      workflow: "Workflow",
      kpiManagement: "KPI Management",
      facultyData: "Faculty Data",
      administration: "Administration",
      administrationPrototype: "Administration (prototype)",
    },
    items: {
      dashboard: "Dashboard",
      studentSuccess: "Student Success",
      validationQueue: "Validation Queue",
      performanceApprovals: "Performance Approvals",
      kpiManagement: "KPI Management",
      performanceRecords: "Performance Records",
      dataSources: "Data Sources",
      kpisLibrary: "KPIs Library",
      facultyData: "Faculty Data",
      facultyRoster: "Faculty Roster",
      committees: "Committees",
      facultyManagement: "Faculty Management",
      units: "Units",
      kpisPrototype: "KPIs (prototype)",
      metrics: "Metrics",
      formulaBuilder: "Formula Builder",
      versionHistory: "Version History",
    },
  },
  sidebar: {
    brandTitle: "Health Sciences",
    brandSubtitle: "Analytics Platform",
    brandFull: "Health Sciences Analytics Platform",
    expand: "Expand sidebar",
    collapse: "Collapse sidebar",
    footer: "MFU · School of Health Sciences",
    footerShort: "MFU",
  },
  topbar: {
    openNavigation: "Open navigation",
    notifications: "Notifications",
  },
  userMenu: {
    loadingMembership: "Loading membership…",
    viewingAs: "Viewing as {name}",
    viewAs: "View as",
    searchFaculty: "Search faculty…",
    noMatches: "No matches",
    signOut: "Sign out",
  },
  breadcrumb: {
    dashboard: "Dashboard",
    committee: "Committees",
    faculty: "Faculty Roster",
    export: "Roster Export",
    kpis: "KPI Management",
    "kpi-management": "KPI Management",
    library: "KPIs Library",
    performance: "Performance Records",
    "data-sources": "Data Sources",
    metrics: "Metrics",
    formulas: "Formulas",
    builder: "Formula Builder",
    history: "Version History",
    analytics: "Analytics",
    "student-success": "Student Success",
    validation: "Validation Queue",
    admin: "Administration",
    units: "Units",
  },
  login: {
    schoolName: "Mae Fah Luang University · School of Health Science",
    systemLabel: "Health Science Analytics",
    title: "KPI System",
    description:
      "A focused workspace for KPI planning, performance, and reporting.",
    brandNote: "Faculty access is governed by the current SHS roster.",
    panelLabel: "Secure faculty access",
    panelTitle: "Continue to your workspace",
    panelDescription: "Sign in with your university Google account to continue.",
    googleButton: "Continue with Google",
    accessNote:
      "Use your @mfu.ac.th account. Your role and committee positions follow the faculty roster.",
    copyright: "© 2026 School of Health Science, Mae Fah Luang University",
    designedBy: "Designed by Saharat Arreeras",
    errors: {
      accessDeniedTitle: "That account isn’t on the faculty roster",
      accessDeniedMessage:
        "Sign-in is limited to active School of Health Science faculty. If you should have access, ask the SHS Office to add your mfu.ac.th address to the faculty roster.",
      configurationTitle: "Sign-in isn’t configured",
      configurationMessage:
        "The server is missing its Google OAuth settings. Check AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local.",
      verificationTitle: "Your Google email isn’t verified",
      verificationMessage: "Verify your address with Google, then try again.",
      defaultTitle: "Sign-in failed",
      defaultMessage:
        "Something went wrong on the way back from Google. Please try again.",
    },
  },
  dashboard: {
    loading: "Loading dashboard…",
  },
  kpiDetail: {
    titleFallback: "KPI",
    kpisCrumb: "KPIs",
    headerDescription:
      "Configure this KPI's core details, 5-year targets, calculation logic and sub-KPIs.",
    backToSet: "Back to Set",
    saveChanges: "Save Changes",
    saving: "Saving…",
    deleteKpi: "Delete KPI",
    deleteConfirmTitle: "Delete KPI",
    deleteConfirmLabel: "Delete",
    deleteMessage:
      'Delete "{name}"? {subs} will be removed, and it will disappear from active performance records. Closed records keep their history. This can\'t be undone.',
    deleteSubsPhrase: "Its {count} sub-KPI and all annual targets",
    deleteSubsPhrasePlural: "Its {count} sub-KPIs and all annual targets",
    deleteNoSubsPhrase: "Its annual targets",
    coreConfig: "Core Configuration",
    name: "Name",
    category: "Category",
    routineCategory: "Routine Category",
    kpiType: "KPI Type",
    collectionPeriod: "Collection Period",
    dataCollectMethod: "Data Collecting Method",
    dataSourceUrl: "Data Source (URL)",
    committeeInCharge: "Committee in Charge",
    personInCharge: "Person in Charge",
    description: "Description",
    uncategorised: "Uncategorised",
    unassigned: "Unassigned",
    noRoutineCategories:
      "No routine categories in this set — add one under Manage Categories.",
    selectCommitteeFirst:
      "Select a committee in charge first to choose a person.",
    notInCommittee: " — not in committee",
    placeholderDataMethod: "e.g. Survey, registry export",
    placeholderUrl: "https://…",
    placeholderDescription: "What this KPI measures",
    annualTarget: "Annual Target (5 years)",
    annualTargetSubtitle: "Each year target must not exceed the 5-year target.",
    weight: "Weight (%)",
    unit: "Unit",
    fiveYearTargetCap: "5-Year Target (cap)",
    year: "Year {n}",
    capCaption: "Each year target must not exceed the 5-year target{cap}.",
    capError:
      "Year {year} target ({value}) must not exceed the 5-year target ({cap}).",
    calcLogic: "KPI Calculation Logic",
    openInBuilder: "Open in builder",
    linkedFormula: "Linked formula",
    selectFormula: "— Select a formula —",
    noFormulaLinked:
      "No formula linked yet — pick one above or open the builder to create one.",
    noteBadge: "note",
    customFormulaNote:
      "A linked formula records how this KPI is calculated; it is not evaluated automatically. On performance records the quarterly value stays blank until someone enters it.",
    pooledNoPreview: " No preview here — the library holds targets only.",
    weightsBadge: "weights",
    weightWarning:
      "Sub-KPI weights total {total}%, not 100%. A weighted sum multiplies each sub-KPI by its weight ÷ 100 without rescaling, so this KPI reads {total}% of its true weighted average.",
    quarterlyTarget: "Quarterly Target",
    quarterlyTargetHint:
      "How each quarter's target is derived on performance records — applies to this KPI and its sub-KPIs.",
    kpiVariables: "KPI variables",
    kpiVariablesHint:
      "Data entered per quarter on performance records (for KPIs without sub-KPIs). Value = Variable 1{divisor}.",
    divisorPercent: " ÷ Variable 2 × 100",
    divisorRatio: " ÷ Variable 2",
    variable1Name: "Variable 1 (Dividend) — name",
    variable2Name: "Variable 2 (Divisor) — name",
    placeholderVar1: "e.g. Graduates employed",
    placeholderVar2: "e.g. Total graduates",
    placeholderVar2Disabled: "Enabled for Percent / Ratio units",
    var1Required: "Variable 1 (Dividend) name is required.",
    var2Required:
      "Variable 2 (Divisor) name is required when the unit is Percent or Ratio.",
    thresholdSettings: "Threshold Settings",
    thresholdSubtitle:
      "Percent of target — ≥ on-target is healthy, ≥ watch is amber, below is at risk.",
    previewAtTarget: "Preview at 5-year target",
    onTargetThreshold: "On-target threshold (≥)",
    watchThreshold: "Watch threshold (≥)",
    rollup: "Roll-up",
    subKpiCount: "{count} sub-KPI",
    subKpiCountPlural: "{count} sub-KPIs",
    leafKpi: "Leaf KPI (direct entry)",
    noSubKpisAggregate:
      "No sub-KPIs to aggregate — add component metrics below to derive a value.",
    previewFrom: "Preview from {count} sub-KPI · 5-year targets",
    previewFromPlural: "Preview from {count} sub-KPIs · 5-year targets",
    formulaNotFound: "Formula not found.",
    // Keyed by calculationType id — the id stays the logic value, only these
    // labels/hints are translated at render.
    calcType: {
      weighted_sum: {
        label: "Weighted Sum of sub-KPIs",
        hint: "Sub-KPI values combined by their weights",
      },
      simple_average: {
        label: "Simple average",
        hint: "Unweighted mean of sub-KPIs",
      },
      percent_of_total: {
        label: "Percent of total",
        hint: "Sum of sub-KPI progress ÷ sum of their targets × 100",
      },
      ratio_of_total: {
        label: "Ratio of total",
        hint: "Sum of sub-KPI progress ÷ sum of their targets",
      },
      combined_percent: {
        label: "Combined percentage",
        hint: "Sum of sub-KPI numerators ÷ sum of their denominators × 100",
      },
      combined_ratio: {
        label: "Combined ratio",
        hint: "Sum of sub-KPI numerators ÷ sum of their denominators",
      },
      custom_formula: {
        label: "Custom formula",
        hint: "Evaluated from a linked formula",
      },
    },
    calcPooled: {
      percent_of_total:
        "Computed on performance records as total sub-KPI progress ÷ total sub-KPI target × 100 for the quarter.",
      ratio_of_total:
        "Computed on performance records as total sub-KPI progress ÷ total sub-KPI target for the quarter.",
      combined_percent:
        "Computed on performance records as total sub-KPI numerator ÷ total sub-KPI denominator × 100 for the quarter. Use this when the sub-KPIs are themselves percentages.",
      combined_ratio:
        "Computed on performance records as total sub-KPI numerator ÷ total sub-KPI denominator for the quarter. Use this when the sub-KPIs are themselves ratios.",
    },
    period: {
      Q1: "Quarter 1",
      Q2: "Quarter 2",
      Q3: "Quarter 3",
      Q4: "Quarter 4",
      every_quarter: "Every quarter",
    },
    quarterlyMode: {
      divide_equally: {
        label: "Divide annual target into quarters (25% each)",
        hint: "Cumulative — Q1 25%, Q2 50%, Q3 75%, Q4 100% of the annual target.",
      },
      use_annual: {
        label: "Use annual target as each quarter's target",
        hint: "Every quarter is measured against the full annual target.",
      },
    },
  },
} as const;

const th: Dictionary = {
  common: {
    language: "ภาษา",
    thai: "ไทย",
    english: "English",
    loading: "กำลังโหลด…",
  },
  nav: {
    groups: {
      overview: "ภาพรวม",
      workflow: "กระบวนการทำงาน",
      kpiManagement: "การจัดการ KPI",
      facultyData: "ข้อมูลบุคลากร",
      administration: "การดูแลระบบ",
      administrationPrototype: "การดูแลระบบ (ต้นแบบ)",
    },
    items: {
      dashboard: "แดชบอร์ด",
      studentSuccess: "ความสำเร็จของนักศึกษา",
      validationQueue: "คิวตรวจสอบข้อมูล",
      performanceApprovals: "การอนุมัติผลการดำเนินงาน",
      kpiManagement: "การจัดการ KPI",
      performanceRecords: "บันทึกผลการดำเนินงาน",
      dataSources: "แหล่งข้อมูล",
      kpisLibrary: "คลัง KPI",
      facultyData: "ข้อมูลบุคลากร",
      facultyRoster: "ทำเนียบบุคลากร",
      committees: "คณะกรรมการ",
      facultyManagement: "การจัดการบุคลากร",
      units: "หน่วยนับ",
      kpisPrototype: "KPI (ต้นแบบ)",
      metrics: "ตัวชี้วัด",
      formulaBuilder: "เครื่องมือสร้างสูตร",
      versionHistory: "ประวัติเวอร์ชัน",
    },
  },
  sidebar: {
    brandTitle: "วิทยาศาสตร์สุขภาพ",
    brandSubtitle: "แพลตฟอร์มวิเคราะห์ข้อมูล",
    brandFull: "แพลตฟอร์มวิเคราะห์ข้อมูลวิทยาศาสตร์สุขภาพ",
    expand: "ขยายแถบเมนู",
    collapse: "ย่อแถบเมนู",
    footer: "มฟล · สำนักวิชาวิทยาศาสตร์สุขภาพ",
    footerShort: "มฟล",
  },
  topbar: {
    openNavigation: "เปิดเมนูนำทาง",
    notifications: "การแจ้งเตือน",
  },
  userMenu: {
    loadingMembership: "กำลังโหลดข้อมูลสมาชิก…",
    viewingAs: "กำลังดูในมุมมองของ {name}",
    viewAs: "ดูในมุมมองของ",
    searchFaculty: "ค้นหาบุคลากร…",
    noMatches: "ไม่พบรายการ",
    signOut: "ออกจากระบบ",
  },
  breadcrumb: {
    dashboard: "แดชบอร์ด",
    committee: "คณะกรรมการ",
    faculty: "ทำเนียบบุคลากร",
    export: "ส่งออกทำเนียบ",
    kpis: "การจัดการ KPI",
    "kpi-management": "การจัดการ KPI",
    library: "คลัง KPI",
    performance: "บันทึกผลการดำเนินงาน",
    "data-sources": "แหล่งข้อมูล",
    metrics: "ตัวชี้วัด",
    formulas: "สูตรคำนวณ",
    builder: "เครื่องมือสร้างสูตร",
    history: "ประวัติเวอร์ชัน",
    analytics: "การวิเคราะห์",
    "student-success": "ความสำเร็จของนักศึกษา",
    validation: "คิวตรวจสอบข้อมูล",
    admin: "การดูแลระบบ",
    units: "หน่วยนับ",
  },
  login: {
    schoolName: "มหาวิทยาลัยแม่ฟ้าหลวง · สำนักวิชาวิทยาศาสตร์สุขภาพ",
    systemLabel: "การวิเคราะห์ข้อมูลวิทยาศาสตร์สุขภาพ",
    title: "ระบบ KPI",
    description:
      "พื้นที่ทำงานสำหรับการวางแผน ผลการดำเนินงาน และการรายงาน KPI",
    brandNote: "สิทธิ์การเข้าใช้งานเป็นไปตามทำเนียบบุคลากร SHS ปัจจุบัน",
    panelLabel: "การเข้าใช้งานสำหรับบุคลากร",
    panelTitle: "เข้าสู่พื้นที่ทำงานของคุณ",
    panelDescription:
      "ลงชื่อเข้าใช้ด้วยบัญชี Google ของมหาวิทยาลัยเพื่อดำเนินการต่อ",
    googleButton: "เข้าสู่ระบบด้วย Google",
    accessNote:
      "ใช้บัญชี @mfu.ac.th ของคุณ บทบาทและตำแหน่งในคณะกรรมการเป็นไปตามทำเนียบบุคลากร",
    copyright: "© 2026 สำนักวิชาวิทยาศาสตร์สุขภาพ มหาวิทยาลัยแม่ฟ้าหลวง",
    designedBy: "ออกแบบโดย Saharat Arreeras",
    errors: {
      accessDeniedTitle: "บัญชีนี้ไม่อยู่ในทำเนียบบุคลากร",
      accessDeniedMessage:
        "การลงชื่อเข้าใช้จำกัดเฉพาะบุคลากรของสำนักวิชาวิทยาศาสตร์สุขภาพที่ยังปฏิบัติงานอยู่ หากคุณควรมีสิทธิ์เข้าใช้งาน โปรดติดต่อสำนักงาน SHS เพื่อเพิ่มอีเมล mfu.ac.th ของคุณลงในทำเนียบบุคลากร",
      configurationTitle: "ยังไม่ได้ตั้งค่าการลงชื่อเข้าใช้",
      configurationMessage:
        "เซิร์ฟเวอร์ยังไม่มีการตั้งค่า Google OAuth โปรดตรวจสอบ AUTH_SECRET, AUTH_GOOGLE_ID และ AUTH_GOOGLE_SECRET ใน .env.local",
      verificationTitle: "อีเมล Google ของคุณยังไม่ได้รับการยืนยัน",
      verificationMessage: "โปรดยืนยันอีเมลของคุณกับ Google แล้วลองใหม่อีกครั้ง",
      defaultTitle: "การลงชื่อเข้าใช้ล้มเหลว",
      defaultMessage:
        "เกิดข้อผิดพลาดระหว่างการเชื่อมต่อกับ Google โปรดลองใหม่อีกครั้ง",
    },
  },
  dashboard: {
    loading: "กำลังโหลดแดชบอร์ด…",
  },
  kpiDetail: {
    titleFallback: "KPI",
    kpisCrumb: "KPI",
    headerDescription:
      "กำหนดรายละเอียดหลักของ KPI นี้ เป้าหมาย 5 ปี ตรรกะการคำนวณ และ KPI ย่อย",
    backToSet: "กลับไปยังชุด",
    saveChanges: "บันทึกการเปลี่ยนแปลง",
    saving: "กำลังบันทึก…",
    deleteKpi: "ลบ KPI",
    deleteConfirmTitle: "ลบ KPI",
    deleteConfirmLabel: "ลบ",
    deleteMessage:
      'ลบ "{name}" หรือไม่? {subs} จะถูกลบออก และ KPI นี้จะหายไปจากบันทึกผลการดำเนินงานที่ยังใช้งานอยู่ บันทึกที่ปิดแล้วจะยังคงเก็บประวัติไว้ การดำเนินการนี้ไม่สามารถย้อนกลับได้',
    deleteSubsPhrase: "KPI ย่อย {count} รายการและเป้าหมายรายปีทั้งหมดของมัน",
    deleteSubsPhrasePlural: "KPI ย่อย {count} รายการและเป้าหมายรายปีทั้งหมดของมัน",
    deleteNoSubsPhrase: "เป้าหมายรายปีของมัน",
    coreConfig: "การตั้งค่าหลัก",
    name: "ชื่อ",
    category: "หมวดหมู่",
    routineCategory: "หมวดหมู่งานประจำ",
    kpiType: "ประเภท KPI",
    collectionPeriod: "รอบการเก็บข้อมูล",
    dataCollectMethod: "วิธีการเก็บข้อมูล",
    dataSourceUrl: "แหล่งข้อมูล (URL)",
    committeeInCharge: "คณะกรรมการผู้รับผิดชอบ",
    personInCharge: "ผู้รับผิดชอบ",
    description: "คำอธิบาย",
    uncategorised: "ไม่ระบุหมวดหมู่",
    unassigned: "ไม่ได้กำหนด",
    noRoutineCategories:
      "ยังไม่มีหมวดหมู่งานประจำในชุดนี้ — เพิ่มได้ที่ จัดการหมวดหมู่",
    selectCommitteeFirst:
      "เลือกคณะกรรมการผู้รับผิดชอบก่อนจึงจะเลือกบุคคลได้",
    notInCommittee: " — ไม่ได้อยู่ในคณะกรรมการ",
    placeholderDataMethod: "เช่น แบบสำรวจ, การส่งออกจากทะเบียน",
    placeholderUrl: "https://…",
    placeholderDescription: "KPI นี้วัดอะไร",
    annualTarget: "เป้าหมายรายปี (5 ปี)",
    annualTargetSubtitle: "เป้าหมายของแต่ละปีต้องไม่เกินเป้าหมาย 5 ปี",
    weight: "น้ำหนัก (%)",
    unit: "หน่วย",
    fiveYearTargetCap: "เป้าหมาย 5 ปี (เพดาน)",
    year: "ปีที่ {n}",
    capCaption: "เป้าหมายของแต่ละปีต้องไม่เกินเป้าหมาย 5 ปี{cap}",
    capError:
      "เป้าหมายปีที่ {year} ({value}) ต้องไม่เกินเป้าหมาย 5 ปี ({cap})",
    calcLogic: "ตรรกะการคำนวณ KPI",
    openInBuilder: "เปิดในเครื่องมือสร้างสูตร",
    linkedFormula: "สูตรที่เชื่อมโยง",
    selectFormula: "— เลือกสูตร —",
    noFormulaLinked:
      "ยังไม่ได้เชื่อมโยงสูตร — เลือกด้านบนหรือเปิดเครื่องมือสร้างสูตรเพื่อสร้างใหม่",
    noteBadge: "หมายเหตุ",
    customFormulaNote:
      "สูตรที่เชื่อมโยงเป็นการบันทึกวิธีคำนวณ KPI นี้ ไม่ได้ถูกคำนวณโดยอัตโนมัติ ในบันทึกผลการดำเนินงาน ค่ารายไตรมาสจะว่างไว้จนกว่าจะมีผู้กรอก",
    pooledNoPreview: " ไม่มีตัวอย่างที่นี่ — คลังเก็บเฉพาะเป้าหมายเท่านั้น",
    weightsBadge: "น้ำหนัก",
    weightWarning:
      "น้ำหนัก KPI ย่อยรวม {total}% ไม่ใช่ 100% การรวมแบบถ่วงน้ำหนักจะคูณ KPI ย่อยแต่ละตัวด้วยน้ำหนัก ÷ 100 โดยไม่ปรับสัดส่วนใหม่ ดังนั้น KPI นี้จึงอ่านค่าได้ {total}% ของค่าเฉลี่ยถ่วงน้ำหนักที่แท้จริง",
    quarterlyTarget: "เป้าหมายรายไตรมาส",
    quarterlyTargetHint:
      "วิธีกำหนดเป้าหมายของแต่ละไตรมาสในบันทึกผลการดำเนินงาน — ใช้กับ KPI นี้และ KPI ย่อยของมัน",
    kpiVariables: "ตัวแปรของ KPI",
    kpiVariablesHint:
      "ข้อมูลที่กรอกรายไตรมาสในบันทึกผลการดำเนินงาน (สำหรับ KPI ที่ไม่มี KPI ย่อย) ค่า = ตัวแปร 1{divisor}",
    divisorPercent: " ÷ ตัวแปร 2 × 100",
    divisorRatio: " ÷ ตัวแปร 2",
    variable1Name: "ตัวแปร 1 (ตัวตั้ง) — ชื่อ",
    variable2Name: "ตัวแปร 2 (ตัวหาร) — ชื่อ",
    placeholderVar1: "เช่น บัณฑิตที่มีงานทำ",
    placeholderVar2: "เช่น บัณฑิตทั้งหมด",
    placeholderVar2Disabled: "เปิดใช้งานสำหรับหน่วย Percent / Ratio",
    var1Required: "ต้องระบุชื่อตัวแปร 1 (ตัวตั้ง)",
    var2Required:
      "ต้องระบุชื่อตัวแปร 2 (ตัวหาร) เมื่อหน่วยเป็น Percent หรือ Ratio",
    thresholdSettings: "การตั้งค่าเกณฑ์",
    thresholdSubtitle:
      "เปอร์เซ็นต์ของเป้าหมาย — ≥ ตามเป้าคือปกติ, ≥ เฝ้าระวังคือสีเหลือง, ต่ำกว่าคือเสี่ยง",
    previewAtTarget: "ตัวอย่างที่เป้าหมาย 5 ปี",
    onTargetThreshold: "เกณฑ์ตามเป้า (≥)",
    watchThreshold: "เกณฑ์เฝ้าระวัง (≥)",
    rollup: "การรวมผล",
    subKpiCount: "KPI ย่อย {count} รายการ",
    subKpiCountPlural: "KPI ย่อย {count} รายการ",
    leafKpi: "KPI ปลายทาง (กรอกโดยตรง)",
    noSubKpisAggregate:
      "ไม่มี KPI ย่อยให้รวม — เพิ่มตัวชี้วัดองค์ประกอบด้านล่างเพื่อคำนวณค่า",
    previewFrom: "ตัวอย่างจาก KPI ย่อย {count} รายการ · เป้าหมาย 5 ปี",
    previewFromPlural: "ตัวอย่างจาก KPI ย่อย {count} รายการ · เป้าหมาย 5 ปี",
    formulaNotFound: "ไม่พบสูตร",
    calcType: {
      weighted_sum: {
        label: "ผลรวมถ่วงน้ำหนักของ KPI ย่อย",
        hint: "รวมค่าของ KPI ย่อยตามน้ำหนัก",
      },
      simple_average: {
        label: "ค่าเฉลี่ยอย่างง่าย",
        hint: "ค่าเฉลี่ยของ KPI ย่อยแบบไม่ถ่วงน้ำหนัก",
      },
      percent_of_total: {
        label: "เปอร์เซ็นต์ของผลรวม",
        hint: "ผลรวมความก้าวหน้าของ KPI ย่อย ÷ ผลรวมเป้าหมาย × 100",
      },
      ratio_of_total: {
        label: "อัตราส่วนของผลรวม",
        hint: "ผลรวมความก้าวหน้าของ KPI ย่อย ÷ ผลรวมเป้าหมาย",
      },
      combined_percent: {
        label: "เปอร์เซ็นต์รวม",
        hint: "ผลรวมตัวตั้งของ KPI ย่อย ÷ ผลรวมตัวหาร × 100",
      },
      combined_ratio: {
        label: "อัตราส่วนรวม",
        hint: "ผลรวมตัวตั้งของ KPI ย่อย ÷ ผลรวมตัวหาร",
      },
      custom_formula: {
        label: "สูตรกำหนดเอง",
        hint: "คำนวณจากสูตรที่เชื่อมโยง",
      },
    },
    calcPooled: {
      percent_of_total:
        "คำนวณในบันทึกผลการดำเนินงานเป็น ผลรวมความก้าวหน้าของ KPI ย่อย ÷ ผลรวมเป้าหมายของ KPI ย่อย × 100 สำหรับไตรมาสนั้น",
      ratio_of_total:
        "คำนวณในบันทึกผลการดำเนินงานเป็น ผลรวมความก้าวหน้าของ KPI ย่อย ÷ ผลรวมเป้าหมายของ KPI ย่อย สำหรับไตรมาสนั้น",
      combined_percent:
        "คำนวณในบันทึกผลการดำเนินงานเป็น ผลรวมตัวตั้งของ KPI ย่อย ÷ ผลรวมตัวหารของ KPI ย่อย × 100 สำหรับไตรมาสนั้น ใช้เมื่อ KPI ย่อยเป็นเปอร์เซ็นต์อยู่แล้ว",
      combined_ratio:
        "คำนวณในบันทึกผลการดำเนินงานเป็น ผลรวมตัวตั้งของ KPI ย่อย ÷ ผลรวมตัวหารของ KPI ย่อย สำหรับไตรมาสนั้น ใช้เมื่อ KPI ย่อยเป็นอัตราส่วนอยู่แล้ว",
    },
    period: {
      Q1: "ไตรมาส 1",
      Q2: "ไตรมาส 2",
      Q3: "ไตรมาส 3",
      Q4: "ไตรมาส 4",
      every_quarter: "ทุกไตรมาส",
    },
    quarterlyMode: {
      divide_equally: {
        label: "แบ่งเป้าหมายรายปีออกเป็นรายไตรมาส (ไตรมาสละ 25%)",
        hint: "สะสม — Q1 25%, Q2 50%, Q3 75%, Q4 100% ของเป้าหมายรายปี",
      },
      use_annual: {
        label: "ใช้เป้าหมายรายปีเป็นเป้าหมายของแต่ละไตรมาส",
        hint: "ทุกไตรมาสวัดเทียบกับเป้าหมายรายปีเต็ม",
      },
    },
  },
};

// Mirrors the `en` shape exactly (same keys, same nesting) but with plain
// string leaves — so `th` is compile-time checked for missing/extra keys.
type Localized<T> = {
  [K in keyof T]: T[K] extends string ? string : Localized<T[K]>;
};
type Dictionary = Localized<typeof en>;

const DICTIONARIES: Record<Locale, unknown> = { en, th };

/** Union of every dotted key path in the dictionary, e.g. "nav.items.dashboard". */
export type TranslationKey = DotPaths<typeof en>;

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

function lookup(source: unknown, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      source,
    );
  return typeof value === "string" ? value : undefined;
}

/**
 * Resolve a translation key for a locale. Framework-agnostic: used by the
 * client `useT()` hook and directly by server components. Falls back to the
 * default-locale string, then the raw key, and warns in dev on a miss so
 * not-yet-translated pages surface without breaking. Supports `{var}`
 * interpolation.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text =
    lookup(DICTIONARIES[locale], key) ??
    lookup(DICTIONARIES[DEFAULT_LOCALE], key);

  if (text === undefined) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] missing translation for key: ${key}`);
    }
    return key;
  }

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
    }
  }
  return text;
}
