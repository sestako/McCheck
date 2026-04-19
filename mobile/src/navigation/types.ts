import type { NavigatorScreenParams } from '@react-navigation/native';

export type GuestListParams = { activityId: number; activityName: string };
export type ScanTicketsParams = { activityId: number; activityName: string };

/**
 * Single main stack — no bottom tab bar.
 *
 * `ActiveEvents` is the home; the Stitch event-hub / guest-list / scanner flows
 * push on top of it. `Settings` is presented as a modal via the profile avatar
 * button in the header (see `ui/HeaderProfileButton.tsx`), so it doesn't sit
 * inside the event flow stack.
 */
export type MainStackParamList = {
  ActiveEvents: undefined;
  EventDetail: { activityId: number };
  GuestList: GuestListParams;
  ScanTickets: ScanTicketsParams;
  Settings: undefined;
};

/**
 * Auth gate: login vs main shell.
 *
 * `PrivacyPolicy` and `Terms` live at the root (not inside `Main`) so the
 * footer links on the login screen can open them *before* the user signs in.
 * They stay reachable after sign-in too — `navigation.getParent()` routes
 * from any nested screen back up to the root stack.
 */
export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};
