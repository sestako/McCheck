import type { NavigatorScreenParams } from '@react-navigation/native';

export type GuestListParams = { activityId: number; activityName: string };
export type ScanTicketsParams = { activityId: number; activityName: string };

/** Events tab: list → detail → guest list → scan (Stitch “Events” flow). */
export type EventStackParamList = {
  ActiveEvents: undefined;
  EventDetail: { activityId: number };
  GuestList: GuestListParams;
  ScanTickets: ScanTicketsParams;
};

/** Attendees tab: pick event → guest list → scan (Stitch bottom nav “Attendees”). */
export type AttendeesStackParamList = {
  AttendeesHome: undefined;
  GuestList: GuestListParams;
  ScanTickets: ScanTicketsParams;
};

/** Auth gate: login vs main shell. */
export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};

/** Stitch-style bottom shell: Events | Attendees | Settings. */
export type MainTabParamList = {
  Events: NavigatorScreenParams<EventStackParamList>;
  Attendees: NavigatorScreenParams<AttendeesStackParamList>;
  Settings: undefined;
};
