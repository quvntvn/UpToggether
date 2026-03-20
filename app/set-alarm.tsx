import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { requestPermissions, scheduleAlarm } from "./services/alarm";

export default function SetAlarm() {
  const [time, setTime] = useState(new Date());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set your wake-up time</Text>

      <DateTimePicker
        value={time}
        mode="time"
        is24Hour={true}
        display="spinner"
        onChange={(event, selectedDate) => {
          if (selectedDate) setTime(selectedDate);
        }}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Save Alarm</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            try {
              await requestPermissions();
              await scheduleAlarm(time);
              alert("Alarm scheduled!");
            } catch (e) {
              alert("Permission needed for alarms");
            }
          }}
        ></TouchableOpacity>
      </TouchableOpacity>

      <Text style={styles.timePreview}>
        Alarm set for {time.getHours()}:
        {String(time.getMinutes()).padStart(2, "0")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 20,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#FFD54A",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    fontWeight: "700",
    color: "#0F172A",
    fontSize: 16,
  },
  timePreview: {
    color: "#CBD5E1",
    marginTop: 20,
    fontSize: 16,
  },
});
