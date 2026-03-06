import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import 'react-native-gesture-handler';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [task, setTask] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [lastSmokeTime, setLastSmokeTime] = useState(null);

  const defaultLectures = [
    { id: '1', day: 'الاثنين', subject: 'الدفاع عن الشبكات', time: '3:50م' },
    { id: '2', day: 'الثلاثاء', subject: 'اساسيات التشفير', time: '3:50م' },
    { id: '3', day: 'الثلاثاء', subject: 'التشريعات الاخلاقية', time: '6:50م' },
    { id: '4', day: 'الاربعاء', subject: 'تصميم الامن السيبراني', time: '3:50م' },
    { id: '5', day: 'الاربعاء', subject: 'انظمة تقنية المعلومات', time: '6:50م' },
  ];
  const [lectures, setLectures] = useState(defaultLectures);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [newLecture, setNewLecture] = useState({ subject: '', time: '', day: '' });

  // Timer States
  const TIMER_DURATION = 3600; // 60 minutes
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [smokeCount, setSmokeCount] = useState(0);

  // visibility and action plans states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isActionPlansOpen, setIsActionPlansOpen] = useState(false);
  const [inProgressPlans, setInProgressPlans] = useState([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // Timer finished
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);

      const newCount = smokeCount + 1;
      setSmokeCount(newCount);
      setLastSmokeTime(Date.now());

      saveData(taskList, Date.now(), newCount);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') Alert.alert('تنبيه', 'يرجى تفعيل الإشعارات من الإعدادات');
    }
  };

  const saveData = async (tasks, smokeDate, count, lecs) => {
    await AsyncStorage.setItem('@personal_assistant_vfinal', JSON.stringify({
      tasks,
      smoke: smokeDate,
      smokeCount: count,
      lastDate: new Date().toLocaleDateString('en-US'),
      lectures: lecs || lectures
    }));
  };

  const loadData = async () => {
    const data = await AsyncStorage.getItem('@personal_assistant_vfinal');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.tasks) setTaskList(parsed.tasks);
      if (parsed.smoke) setLastSmokeTime(parsed.smoke);
      if (parsed.lectures) setLectures(parsed.lectures);

      const today = new Date().toLocaleDateString('en-US');
      if (parsed.lastDate === today) {
        if (parsed.smokeCount !== undefined) setSmokeCount(parsed.smokeCount);
      } else {
        setSmokeCount(0); // Reset for a new day
      }
    }

    // جلب خطط العمل لعرض (تحت الإنجاز)
    const storedPlans = await AsyncStorage.getItem('@action_plans');
    if (storedPlans) {
      const parsedPlans = JSON.parse(storedPlans);
      setInProgressPlans(parsedPlans.filter(p => p.status === 'تحت الإنجاز'));
    }
  };

  const toggleTimer = async () => {
    if (isTimerRunning) {
      // Pause
      setIsTimerRunning(false);
      if (Platform.OS !== 'web') {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) { }
      }
    } else {
      // Start
      if (smokeCount >= 20) {
        Alert.alert("تنبيه", "لقد وصلت للحد الأقصى للتكرار اليومي (20 مرة).");
        return;
      }
      setIsTimerRunning(true);
      if (Platform.OS !== 'web') {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "تذكير التدخين 🚭",
              body: "انتهت الـ 60 دقيقة! وقت الاستراحة.",
              sound: true,
            },
            trigger: {
              seconds: timeLeft,
            },
          });
        } catch (error) {
          Alert.alert("تنبيه", "تأكد من السماح بالإشعارات في الإعدادات.");
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- تذكير المحاضرات (الحل النهائي المضمون) ---
  const scheduleLectureAlarm = async (subject, time) => {
    if (Platform.OS === 'web') {
      Alert.alert("تنبيه", "تذكير المحاضرات غير مدعوم على المتصفح.");
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "موعد المحاضرة القادم 🎓",
          body: `تذكير: عندك محاضرة ${subject} الآن (${time})`,
        },
        trigger: {
          seconds: 5,
        },
      });
      Alert.alert("تم التفعيل", `سيصلك تنبيه لمحاضرة ${subject} بعد 5 ثواني`);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddTask = () => {
    if (!task.trim()) return;
    const newList = [{ id: Date.now().toString(), text: task, type: isUrgent ? 'طارئة' : 'عادية' }, ...taskList];
    setTaskList(newList);
    saveData(newList, lastSmokeTime, smokeCount, lectures);
    setTask('');
  };

  const handleAddLecture = () => {
    if (!newLecture.subject.trim() || !newLecture.time.trim() || !newLecture.day.trim()) {
      Alert.alert("تنبيه", "الرجاء تعبئة جميع حقول المحاضرة");
      return;
    }
    const newLec = { id: Date.now().toString(), ...newLecture };
    const updatedLectures = [...lectures, newLec];
    setLectures(updatedLectures);
    saveData(taskList, lastSmokeTime, smokeCount, updatedLectures);
    setNewLecture({ subject: '', time: '', day: '' });
    setShowAddLecture(false);
  };

  const handleDeleteLecture = (id) => {
    const updated = lectures.filter(l => l.id !== id);
    setLectures(updated);
    saveData(taskList, lastSmokeTime, smokeCount, updated);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>

        {/* قسم التدخين */}
        <View style={styles.smokeCard}>
          <Text style={styles.smokeTitle}>مؤقت التدخين 🚭</Text>
          <Text style={styles.smokeTimerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.smokeSub}>
            التكرار اليومي: {smokeCount}/20
          </Text>

          <TouchableOpacity
            style={[styles.smokeBtn, isTimerRunning && { backgroundColor: '#ff7675' }]}
            onPress={toggleTimer}
          >
            <Text style={[styles.smokeBtnText, isTimerRunning && { color: '#FFF' }]}>
              {isTimerRunning ? 'إيقاف مؤقت' : 'بدء'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* الجدول الدراسي (قابل للإظهار والإخفاء) */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => setIsScheduleOpen(!isScheduleOpen)}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <Text style={styles.sectionTitleWithoutMargin}>🎓 الجدول الدراسي</Text>
            </View>
            <Ionicons name={isScheduleOpen ? "chevron-up" : "chevron-down"} size={24} color="#001D4A" />
          </TouchableOpacity>

          {isScheduleOpen && (
            <View style={{ marginTop: 15 }}>
              {lectures.map((lec) => (
                <View key={lec.id} style={styles.lectureRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => handleDeleteLecture(lec.id)} style={{ marginRight: 15 }}>
                      <Ionicons name="trash-outline" size={22} color="#ff4757" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => scheduleLectureAlarm(lec.subject, lec.time)}>
                      <Ionicons name="notifications-outline" size={24} color="#001D4A" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lecTime}>{lec.time}</Text>
                  <Text style={styles.lecSubject} numberOfLines={1}>{lec.subject}</Text>
                  <Text style={styles.lecDay}>{lec.day}</Text>
                </View>
              ))}

              {showAddLecture && (
                <View style={styles.addLecForm}>
                  <TextInput style={styles.lecInput} placeholder="المادة (مثال: رياضيات)" value={newLecture.subject} onChangeText={(t) => setNewLecture({ ...newLecture, subject: t })} textAlign="right" />
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <TextInput style={[styles.lecInput, { flex: 1, marginLeft: 10 }]} placeholder="الوقت (مثال: 10:00ص)" value={newLecture.time} onChangeText={(t) => setNewLecture({ ...newLecture, time: t })} textAlign="right" />
                    <TextInput style={[styles.lecInput, { flex: 1 }]} placeholder="اليوم (مثال: الأحد)" value={newLecture.day} onChangeText={(t) => setNewLecture({ ...newLecture, day: t })} textAlign="right" />
                  </View>
                  <TouchableOpacity style={styles.saveLecBtn} onPress={handleAddLecture}>
                    <Text style={styles.saveLecBtnText}>حفظ المحاضرة</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={() => setShowAddLecture(!showAddLecture)} style={styles.addLecBtnWrapper}>
                <View style={styles.addLecBtnBottom}>
                  <Text style={styles.addLecBtnTextBottom}>{showAddLecture ? 'إغلاق' : 'إضافة محاضرة'}</Text>
                  <Ionicons name={showAddLecture ? "close-circle" : "add-circle"} size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* خطط العمل تحت الإنجاز (قابل للإظهار والإخفاء) */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => setIsActionPlansOpen(!isActionPlansOpen)}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <Text style={styles.sectionTitleWithoutMargin}>📈 خطط العمل العاجلة</Text>
            </View>
            <Ionicons name={isActionPlansOpen ? "chevron-up" : "chevron-down"} size={24} color="#001D4A" />
          </TouchableOpacity>

          {isActionPlansOpen && (
            <View style={{ marginTop: 15 }}>
              {inProgressPlans.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#888', marginVertical: 10 }}>لا توجد خطط (تحت الإنجاز) حالياً.</Text>
              ) : (
                inProgressPlans.map(plan => (
                  <View key={plan.id} style={styles.planProgressCard}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.planProgressTitle}>{plan.title}</Text>
                      <Text style={styles.badgeInProgress}>{plan.status}</Text>
                    </View>
                    <Text style={styles.planProgressLabel}>طريقة الخطة:</Text>
                    <Text style={styles.planProgressText} numberOfLines={2}>{plan.method}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* قائمة المهام */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📌 المهام الحالية</Text>
          {taskList.map(item => (
            <View key={item.id} style={styles.taskRow}>
              <TouchableOpacity onPress={() => {
                const updated = taskList.filter(t => t.id !== item.id);
                setTaskList(updated);
                saveData(updated, lastSmokeTime, smokeCount, lectures);
              }}>
                <Ionicons name="trash-outline" size={22} color="#ff4757" />
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-end', marginLeft: 10 }}>
                <Text style={[styles.taskTag, { color: item.type === 'طارئة' ? '#d63031' : '#00b894' }]}>({item.type})</Text>
                <Text style={styles.taskName}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* شريط الإدخال بتصميم الإرسال */}
      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.sendBtn} onPress={handleAddTask}>
            <Ionicons name="send" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, isUrgent && { backgroundColor: '#d63031' }]}
            onPress={() => setIsUrgent(!isUrgent)}
          >
            <Text style={styles.typeBtnText}>{isUrgent ? 'طارئة' : 'عادية'}</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="اكتب مهمة جديدة..."
            value={task}
            onChangeText={setTask}
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  smokeCard: { backgroundColor: '#001D4A', padding: 20, borderRadius: 25, alignItems: 'center', marginBottom: 20, marginTop: 25 },
  smokeTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  smokeTimerText: { color: '#FFF', fontSize: 40, fontWeight: 'bold', marginVertical: 10 },
  smokeSub: { color: '#AAB', marginVertical: 4 },
  smokeBtn: { backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20, marginTop: 10 },
  smokeBtnText: { color: '#001D4A', fontWeight: 'bold', fontSize: 16 },
  sectionCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#001D4A', textAlign: 'right', marginBottom: 15 },
  sectionTitleWithoutMargin: { fontSize: 18, fontWeight: 'bold', color: '#001D4A', textAlign: 'right' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  taskName: { fontSize: 20, fontWeight: 'bold', color: '#2D3436', flexShrink: 1, textAlign: 'right' },
  taskTag: { fontSize: 14, marginRight: 8 },
  lectureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F9F9F9', alignItems: 'center' },
  lecSubject: { flex: 1, textAlign: 'right', paddingHorizontal: 10, fontSize: 16, fontWeight: 'bold' },
  lecTime: { fontSize: 14, color: '#666', width: 65, textAlign: 'center' },
  lecDay: { fontSize: 14, fontWeight: 'bold', width: 60, textAlign: 'right' },
  addLecForm: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 15, marginBottom: 15, marginTop: 15 },
  addLecBtnWrapper: { marginTop: 15, alignItems: 'center' },
  addLecBtnBottom: { backgroundColor: '#001D4A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, width: '100%' },
  addLecBtnTextBottom: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
  lecInput: { backgroundColor: '#FFF', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  saveLecBtn: { backgroundColor: '#00b894', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveLecBtnText: { color: '#FFF', fontWeight: 'bold' },
  inputArea: { width: '100%', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F1F3F5', padding: 12, borderRadius: 20, textAlign: 'right', marginLeft: 10, fontSize: 16 },
  sendBtn: { backgroundColor: '#001D4A', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '180deg' }] },
  typeBtn: { padding: 10, borderRadius: 15, backgroundColor: '#00b894', width: 65, alignItems: 'center', marginLeft: 10 },
  typeBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // أنماط خطط العمل في الصفحة الرئيسية
  planProgressCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderRightWidth: 4,
    borderRightColor: '#fdcb6e',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  planProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    flex: 1,
    textAlign: 'right'
  },
  badgeInProgress: {
    backgroundColor: '#fdcb6e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10
  },
  planProgressLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'right',
    marginTop: 5
  },
  planProgressText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  }
});