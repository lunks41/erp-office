export enum OperationsStatus {
  All = "All",
  Pending = "Pending",
  Completed = "Completed",
  Cancelled = "Cancelled",
  CancelWithService = "Cancel With Service",
  Confirmed = "Confirmed",
}

export enum Task {
  PortExpenses = 1,
  LaunchServices = 2,
  EquipmentUsed = 3,
  CrewSignOn = 4,
  CrewSignOff = 5,
  CrewMiscellaneous = 6,
  MedicalAssistance = 7,
  ConsignmentImport = 8,
  ConsignmentExport = 9,
  ThirdParty = 10,
  FreshWater = 11,
  TechniciansSurveyors = 12,
  LandingItems = 13,
  OtherService = 14,
  AgencyRemuneration = 15,
}

// Helper function to get task name by task ID
export function getTaskName(taskId: number): string {
  const taskEntries = Object.entries(Task)
  const taskEntry = taskEntries.find(([, value]) => value === taskId)
  return taskEntry ? taskEntry[0] : "Unknown Task"
}

// Reverse mapping for easier lookup
export const TaskIdToName: Record<number, string> = {
  [Task.PortExpenses]: "Port Expenses",
  [Task.LaunchServices]: "Launch Services",
  [Task.EquipmentUsed]: "Equipment Used",
  [Task.CrewSignOn]: "Crew Sign On",
  [Task.CrewSignOff]: "Crew Sign Off",
  [Task.CrewMiscellaneous]: "Crew Miscellaneous",
  [Task.MedicalAssistance]: "Medical Assistance",
  [Task.ConsignmentImport]: "Consignment Import",
  [Task.ConsignmentExport]: "Consignment Export",
  [Task.ThirdParty]: "Third Party",
  [Task.FreshWater]: "Fresh Water",
  [Task.TechniciansSurveyors]: "Technicians Surveyors",
  [Task.LandingItems]: "Landing Items",
  [Task.OtherService]: "Other Service",
  [Task.AgencyRemuneration]: "Agency Remuneration",
}
