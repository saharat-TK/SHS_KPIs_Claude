import { seedDataSource } from "./data-source-seed-utils.mjs";

const EXPECTED_COLUMNS = {
  name_of_research_unit_group_center: { dataType: "text", isRequired: true },
  type: { dataType: "select", isRequired: true, options: ["Unit", "Group", "Center"] },
  chair_person: { dataType: "faculty", isRequired: true },
  establishing_date: { dataType: "date", isRequired: true },
  purposes: { dataType: "text", isRequired: true },
};

const ROWS = [
  { year: 2566, quarter: 1, values: { name_of_research_unit_group_center: "Community Health Innovation Unit", type: "Unit", chair_person: "fac-061", establishing_date: "2566-02-14", purposes: "Develop practical prevention and health-promotion tools with community partners." } },
  { year: 2566, quarter: 3, values: { name_of_research_unit_group_center: "Environmental Exposure Research Group", type: "Group", chair_person: "fac-062", establishing_date: "2566-08-07", purposes: "Study environmental risks and translate findings into local health-protection action." } },
  { year: 2567, quarter: 2, values: { name_of_research_unit_group_center: "Digital Health and Analytics Center", type: "Center", chair_person: "fac-063", establishing_date: "2567-05-18", purposes: "Advance responsible digital-health research, data analysis, and service innovation." } },
  { year: 2567, quarter: 4, values: { name_of_research_unit_group_center: "Healthy Aging Research Group", type: "Group", chair_person: "fac-064", establishing_date: "2567-11-09", purposes: "Improve healthy-aging outcomes through interdisciplinary research and community engagement." } },
  { year: 2568, quarter: 2, values: { name_of_research_unit_group_center: "Borderland Health Systems Unit", type: "Unit", chair_person: "fac-065", establishing_date: "2568-06-21", purposes: "Strengthen evidence on equitable care and referral systems in borderland communities." } },
];

await seedDataSource({
  sourceName: "Research units, groups, and centers.",
  displayName: "Research units, groups, and centers",
  expectedCount: 5,
  expectedColumns: EXPECTED_COLUMNS,
  rows: ROWS,
  notePrefix: "Seed: Research unit demo row ",
});
