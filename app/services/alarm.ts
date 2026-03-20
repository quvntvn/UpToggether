import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Notification permission not granted");
  }
}

export async function scheduleAlarm(date: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "UpTogether",
      body: "Wake up! Don’t wake up alone.",
      sound: true,
    },
    trigger: {
      type: "date",
      date,
    },
  });
}
