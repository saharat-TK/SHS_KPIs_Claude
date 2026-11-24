import type { Localized } from "./dictionaries";

// Data Sources section strings (list page, detail page, modals, toasts,
// validation messages). Kept apart from dictionaries.ts so that file stays
// readable; `dataSourcesTh` must mirror `dataSourcesEn` exactly (enforced by
// the Localized type). Spread into the main dictionary as `dataSources`.
export const dataSourcesEn = {
  title: "Data Sources",
  description:
    "Committee-owned raw data behind the KPI numbers. Each source defines its own columns; committees record rows against them.",
  newButton: "New Data Source",
  filterAria: "Filter by committee",
  allCommittees: "All committees",
  emptyTitle: "No data sources yet",
  emptyAdmin:
    "Create a data source, define its columns, then let its committee record raw data against them.",
  emptyMember:
    "No data source has been set up for this filter yet. An administrator creates them.",
  colName: "Name",
  colCommittee: "Committee",
  colGrain: "Grain",
  colColumns: "Columns",
  colEntries: "Entries",
  colLinkedKpis: "Linked KPIs",
  colLatestUpdate: "Latest Update",
  colStatus: "Status",
  noColumns: "none yet",
  grain: {
    quarterly: "Quarterly",
    annual: "Annual",
  },
  status: {
    active: "Active",
    archived: "Archived",
  },
  modal: {
    createTitle: "New Data Source",
    editTitle: "Edit Data Source",
    createSubtitle:
      "The owning committee records data here; you define which columns it collects on the next screen.",
    editSubtitle:
      "Update this data source's details. Its columns and recorded data are unaffected.",
    cancel: "Cancel",
    create: "Create",
    creating: "Creating…",
    save: "Save",
    saving: "Saving…",
    nameLabel: "Name",
    namePlaceholder: "e.g. Graduate employment survey",
    descriptionLabel: "Description",
    descriptionHint: "Optional — what this data is and where it comes from.",
    committeeLabel: "Owning committee",
    committeeHint: "Only this committee's members can record entries.",
    committeePlaceholder: "Select a committee…",
    grainLabel: "Period grain",
    grainHint:
      "Quarterly entries carry a year and quarter; annual entries carry only a year. This cannot be changed once data is recorded.",
    grainLockedHint:
      "Locked because entries have already been recorded against this source.",
    statusLabel: "Status",
    statusHint:
      "Archived sources stay visible but signal they are no longer collecting data.",
  },
} as const;

export const dataSourcesTh: Localized<typeof dataSourcesEn> = {
  title: "แหล่งข้อมูล",
  description:
    "ข้อมูลดิบที่คณะกรรมการเป็นเจ้าของ เบื้องหลังตัวเลข KPI แต่ละแหล่งข้อมูลกำหนดคอลัมน์ของตนเอง และคณะกรรมการบันทึกข้อมูลเป็นแถวตามคอลัมน์เหล่านั้น",
  newButton: "สร้างแหล่งข้อมูลใหม่",
  filterAria: "กรองตามคณะกรรมการ",
  allCommittees: "ทุกคณะกรรมการ",
  emptyTitle: "ยังไม่มีแหล่งข้อมูล",
  emptyAdmin:
    "สร้างแหล่งข้อมูล กำหนดคอลัมน์ แล้วให้คณะกรรมการที่เป็นเจ้าของบันทึกข้อมูลดิบตามคอลัมน์เหล่านั้น",
  emptyMember:
    "ยังไม่มีแหล่งข้อมูลตามตัวกรองนี้ ผู้ดูแลระบบเป็นผู้สร้างแหล่งข้อมูล",
  colName: "ชื่อ",
  colCommittee: "คณะกรรมการ",
  colGrain: "ความถี่",
  colColumns: "คอลัมน์",
  colEntries: "รายการข้อมูล",
  colLinkedKpis: "KPI ที่เชื่อมโยง",
  colLatestUpdate: "อัปเดตล่าสุด",
  colStatus: "สถานะ",
  noColumns: "ยังไม่มี",
  grain: {
    quarterly: "รายไตรมาส",
    annual: "รายปี",
  },
  status: {
    active: "ใช้งาน",
    archived: "เก็บถาวร",
  },
  modal: {
    createTitle: "สร้างแหล่งข้อมูลใหม่",
    editTitle: "แก้ไขแหล่งข้อมูล",
    createSubtitle:
      "คณะกรรมการเจ้าของแหล่งข้อมูลจะบันทึกข้อมูลที่นี่ คุณกำหนดคอลัมน์ที่จะเก็บข้อมูลในหน้าถัดไป",
    editSubtitle:
      "แก้ไขรายละเอียดของแหล่งข้อมูลนี้ คอลัมน์และข้อมูลที่บันทึกไว้จะไม่ได้รับผลกระทบ",
    cancel: "ยกเลิก",
    create: "สร้าง",
    creating: "กำลังสร้าง…",
    save: "บันทึก",
    saving: "กำลังบันทึก…",
    nameLabel: "ชื่อ",
    namePlaceholder: "เช่น แบบสำรวจการมีงานทำของบัณฑิต",
    descriptionLabel: "คำอธิบาย",
    descriptionHint: "ไม่บังคับ — ข้อมูลนี้คืออะไรและมาจากไหน",
    committeeLabel: "คณะกรรมการเจ้าของ",
    committeeHint: "เฉพาะสมาชิกของคณะกรรมการนี้เท่านั้นที่บันทึกข้อมูลได้",
    committeePlaceholder: "เลือกคณะกรรมการ…",
    grainLabel: "ความถี่ของข้อมูล",
    grainHint:
      "ข้อมูลรายไตรมาสระบุปีและไตรมาส ข้อมูลรายปีระบุเฉพาะปี ไม่สามารถเปลี่ยนได้หลังจากบันทึกข้อมูลแล้ว",
    grainLockedHint:
      "ถูกล็อกเนื่องจากมีการบันทึกข้อมูลในแหล่งข้อมูลนี้แล้ว",
    statusLabel: "สถานะ",
    statusHint:
      "แหล่งข้อมูลที่เก็บถาวรจะยังแสดงอยู่ แต่บ่งบอกว่าไม่มีการเก็บข้อมูลอีกต่อไป",
  },
};
