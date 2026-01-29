import { IssuePriority, MilestoneStatus } from "@hcengineering/tracker";

/**
 * Convert numeric priority to string representation
 */
export function priorityToString(p: number): string {
	switch (p) {
		case IssuePriority.Urgent:
			return "urgent";
		case IssuePriority.High:
			return "high";
		case IssuePriority.Medium:
			return "medium";
		case IssuePriority.Low:
			return "low";
		case IssuePriority.NoPriority:
			return "none";
		default:
			return "medium";
	}
}

/**
 * Convert string priority to enum value
 */
export function stringToPriority(s: string): IssuePriority {
	const map: Record<string, IssuePriority> = {
		urgent: IssuePriority.Urgent,
		high: IssuePriority.High,
		medium: IssuePriority.Medium,
		low: IssuePriority.Low,
		none: IssuePriority.NoPriority,
	};
	return map[s] ?? IssuePriority.Medium;
}

/**
 * Convert numeric milestone status to string representation
 */
export function milestoneStatusToString(s: number): string {
	switch (s) {
		case MilestoneStatus.Planned:
			return "Planned";
		case MilestoneStatus.InProgress:
			return "InProgress";
		case MilestoneStatus.Completed:
			return "Completed";
		case MilestoneStatus.Canceled:
			return "Canceled";
		default:
			return "Planned";
	}
}

/**
 * Convert string milestone status to enum value
 */
export function stringToMilestoneStatus(s: string): MilestoneStatus {
	const map: Record<string, MilestoneStatus> = {
		planned: MilestoneStatus.Planned,
		inprogress: MilestoneStatus.InProgress,
		in_progress: MilestoneStatus.InProgress,
		completed: MilestoneStatus.Completed,
		canceled: MilestoneStatus.Canceled,
	};
	return map[s.toLowerCase()] ?? MilestoneStatus.Planned;
}
