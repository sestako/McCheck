export type RootStackParamList = {
  Login: undefined;
  ActiveEvents: undefined;
  EventDetail: { activityId: number };
  GuestList: { activityId: number; activityName: string };
  ScanTickets: { activityId: number; activityName: string };
  Profile: undefined;
};
