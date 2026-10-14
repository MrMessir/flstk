export type UserRole = "user" | "admin";
export type UserPlan = "free" | "pro";

export type AppProfile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  plan: UserPlan;
  isBanned: boolean;
};

export function canUnlimitedDuels(profile: AppProfile): boolean {
  return profile.role === "admin" || profile.plan === "pro";
}
