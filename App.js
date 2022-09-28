import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { theme } from "./colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";

const STORAGE_KEY = "@toDos";

export default function App() {
  const [text, setText] = useState("");
  const [toDos, setToDos] = useState({});
  const [editingToDo, setEditingToDo] = useState(0);
  const [editValue, setEditValue] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    loadToDos();
    AsyncStorage.getItem("TAB", (error, result) => {
      const savedTab = JSON.parse(result);
      setTabIndex(savedTab.tabIndex);
    });
  }, []);

  const onPressTab = useCallback((index) => {
    setTabIndex(index);
    AsyncStorage.setItem("TAB", JSON.stringify({ tabIndex: index }));
  }, []);

  const onChangeText = (payload) => setText(payload);
  const onChangeToDo = useCallback((payload) => setEditValue(payload), []);

  const saveToDos = async (toSave) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  };

  const loadToDos = async () => {
    try {
      const s = await AsyncStorage.getItem(STORAGE_KEY);
      if (s) {
        setToDos(JSON.parse(s));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addToDo = async () => {
    if (text === "") {
      return;
    }
    const newToDos = { ...toDos, [Date.now()]: { text, tabIndex, status: 0 } };
    setToDos(newToDos);
    await saveToDos(newToDos);
    setText("");
  };

  const putToDo = useCallback(
    async (key) => {
      if (editValue === "") {
        return;
      }
      const newToDos = { ...toDos };
      newToDos[key].text = editValue;
      setToDos(newToDos);
      await saveToDos(newToDos);
      setEditValue("");
    },
    [editValue]
  );

  const deleteToDo = useCallback(
    (key) => {
      if (Platform.OS === "web") {
        const ok = confirm("Do you want to delete this To Do?");
        if (ok) {
          const newToDos = { ...toDos };
          delete newToDos[key];
          setToDos(newToDos);
          saveToDos(newToDos);
        }
      } else {
        try {
          Alert.alert("Delete To Do", "Are you sure?", [
            {
              text: "Cancel",
            },
            {
              text: "I'm Sure",
              style: "destructive",
              onPress: async () => {
                const newToDos = { ...toDos };
                delete newToDos[key];
                setToDos(newToDos);
                await saveToDos(newToDos);
              },
            },
          ]);
          return;
        } catch (error) {
          console.log(error);
        }
      }
    },
    [toDos]
  );

  const editToDo = useCallback(
    (key) => {
      if (editingToDo) {
        putToDo(key);
        setEditingToDo(0);
      } else if (editingToDo === 0) {
        setEditingToDo(key);
      }
    },
    [editingToDo, editValue]
  );

  const completeToDo = useCallback(
    (key) => {
      console.log(toDos);
      if (toDos[key].status === 0) {
        try {
          Alert.alert("Complete To Do", "Are you sure?", [
            {
              text: "Cancel",
            },
            {
              text: "Success",
              style: "destructive",
              onPress: async () => {
                const newToDos = { ...toDos };
                newToDos[key].status = 1;
                setToDos(newToDos);
                await saveToDos(newToDos);
              },
            },
          ]);
          return;
        } catch (error) {
          console.log(error);
        }
      } else if (toDos[key].status === 1) {
        try {
          Alert.alert("Incomplete To Do", "Are you sure?", [
            {
              text: "Cancel",
            },
            {
              text: "Not yet",
              style: "destructive",
              onPress: async () => {
                const newToDos = { ...toDos };
                newToDos[key].status = 0;
                setToDos(newToDos);
                await saveToDos(newToDos);
              },
            },
          ]);
          return;
        } catch (error) {
          console.log(error);
        }
      }
    },
    [toDos]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onPressTab(0)}>
            <Text
              style={{
                ...styles.btnText,
                color: tabIndex === 0 ? "white" : theme.grey,
              }}
            >
              Work
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onPressTab(1)}>
            <Text
              style={{
                ...styles.btnText,
                color: tabIndex === 1 ? "white" : theme.grey,
              }}
            >
              Travel
            </Text>
          </TouchableOpacity>
        </View>
        <View>
          <TextInput
            onSubmitEditing={addToDo}
            onChangeText={onChangeText}
            value={text}
            placeholder={
              tabIndex === 0 ? "Add a To Do" : "Where do you want to go?"
            }
            style={styles.input}
          />
          <ScrollView>
            {Object.keys(toDos).map((key) =>
              toDos[key].tabIndex === tabIndex ? (
                <View style={styles.toDo} key={key}>
                  {editingToDo === key ? (
                    <View
                      style={{
                        borderWidth: 1,
                        paddingHorizontal: 2,
                        borderColor: theme.grey,
                      }}
                    >
                      <TextInput
                        placeholder={toDos[key].text}
                        value={editValue}
                        onChangeText={onChangeToDo}
                        placeholderTextColor={"white"}
                        style={{ color: "white" }}
                      />
                    </View>
                  ) : (
                    <View>
                      <Text
                        style={[
                          { ...styles.toDoText },
                          toDos[key].status === 1 && {
                            textDecorationLine: "line-through",
                          },
                        ]}
                      >
                        {toDos[key].text}
                      </Text>
                    </View>
                  )}

                  <View style={styles.toDoOptions}>
                    <TouchableOpacity
                      onPress={() => completeToDo(key)}
                      style={styles.toDoOption}
                    >
                      <FontAwesome
                        name="check-square"
                        size={18}
                        color={toDos[key].status === 1 ? "white" : theme.grey}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => editToDo(key)}
                      style={styles.toDoOption}
                    >
                      <FontAwesome
                        name="edit"
                        size={18}
                        color={editingToDo === key ? "white" : theme.grey}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteToDo(key)}
                      style={styles.toDoOption}
                    >
                      <FontAwesome name="trash" size={18} color={theme.grey} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    merginTop: 100,
  },
  btnText: {
    fontSize: 38,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 20,
    fontSize: 18,
  },
  toDo: {
    backgroundColor: theme.toDoBg,
    marginBottom: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toDoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  toDoOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  toDoOption: {
    marginLeft: 10,
  },
});
