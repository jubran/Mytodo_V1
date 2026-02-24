import { Ionicons } from '@expo/vector-icons'; // مكتبة الأيقونات
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') Alert.alert('تنبيه', 'يرجى تفعيل الإشعارات من الإعدادات');
  };

  const saveData = async (tasks, smoke) => {
    await AsyncStorage.setItem('@personal_assistant_vfinal', JSON.stringify({ tasks, smoke }));
  };

  const loadData = async () => {
    const data = await AsyncStorage.getItem('@personal_assistant_vfinal');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.tasks) setTaskList(parsed.tasks);
      if (parsed.smoke) setLastSmokeTime(parsed.smoke);
    }
  };

 const recordSmoke = async () => {
    const now = Date.now();
    setLastSmokeTime(now);
    saveData(taskList, now);

    try {
      await Notifications.cancelAllScheduledNotificationsAsync(); 
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "تذكير التدخين 🚭",
          body: "مرت ساعة كاملة.. هل يمكنك الصمود ساعة أخرى؟ 💪",
        },
        trigger: { 
          seconds: 3600, // الثواني مباشرة بدون تحديد نوع
        },
      });
      Alert.alert("تم التسجيل", "سأقوم بتنبيهك بعد ساعة من الآن.");
    } catch (error) {
      Alert.alert("تنبيه", "تأكد من السماح بالإشعارات في الإعدادات.");
    }
  };


  // --- تذكير المحاضرات (الحل النهائي المضمون) ---
  const scheduleLectureAlarm = async (subject, time) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "موعد المحاضرة القادم 🎓",
          body: `تذكير: عندك محاضرة ${subject} الآن (${time})`,
        },
        trigger: { 
          seconds: 5, // سيظهر بعد 5 ثواني بالضبط للتجربة
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
    saveData(newList, lastSmokeTime);
    setTask('');
  };

  const lectures = [
    { day: 'الاثنين', subject: 'الدفاع عن الشبكات', time: '3:50م' },
    { day: 'الثلاثاء', subject: 'اساسيات التشفير', time: '3:50م' },
    { day: 'الثلاثاء', subject: 'التشريعات الاخلاقية', time: '6:50م' },
    { day: 'الاربعاء', subject: 'تصميم الامن السيبراني', time: '3:50م' },
    { day: 'الاربعاء', subject: 'انظمة تقنية المعلومات', time: '6:50م' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{paddingHorizontal: 20}}>
        
        {/* العنوان والخط العريض */}
        <View style={styles.headerArea}>
          <Text style={styles.mainTitle}>مساعدي الشخصي 🛡️</Text>
          <View style={styles.fullWidthLine} />
        </View>

        {/* قسم التدخين */}
        <View style={styles.smokeCard}>
          <Text style={styles.smokeTitle}>🚭 مؤقت التدخين</Text>
          <Text style={styles.smokeSub}>آخر مرة: {lastSmokeTime ? new Date(lastSmokeTime).toLocaleTimeString('ar-SA') : 'لم تسجل'}</Text>
          <TouchableOpacity style={styles.smokeBtn} onPress={recordSmoke}>
            <Text style={styles.smokeBtnText}>سجلت الآن</Text>
          </TouchableOpacity>
        </View>

        {/* قائمة المهام */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📌 المهام الحالية</Text>
          {taskList.map(item => (
            <View key={item.id} style={styles.taskRow}>
              <TouchableOpacity onPress={() => {
                const updated = taskList.filter(t => t.id !== item.id);
                setTaskList(updated);
                saveData(updated, lastSmokeTime);
              }}>
                <Ionicons name="trash-outline" size={22} color="#ff4757" />
              </TouchableOpacity>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={[styles.taskTag, {color: item.type === 'طارئة' ? '#d63031' : '#00b894'}]}>({item.type})</Text>
                <Text style={styles.taskName}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* الجدول الدراسي */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🎓 الجدول الدراسي</Text>
          {lectures.map((lec, i) => (
            <View key={i} style={styles.lectureRow}>
              <TouchableOpacity onPress={() => scheduleLectureAlarm(lec.subject, lec.time)}>
                <Ionicons name="notifications-outline" size={24} color="#001D4A" />
              </TouchableOpacity>
              <Text style={styles.lecTime}>{lec.time}</Text>
              <Text style={styles.lecSubject}>{lec.subject}</Text>
              <Text style={styles.lecDay}>{lec.day}</Text>
            </View>
          ))}
        </View>
        <View style={{height: 150}} />
      </ScrollView>

      {/* شريط الإدخال بتصميم الإرسال (Telegram Style) */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputArea}>
        <View style={styles.inputRow}>
          {/* زر الإرسال الجديد */}
          <TouchableOpacity style={styles.sendBtn} onPress={handleAddTask}>
            <Ionicons name="send" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeBtn, isUrgent && {backgroundColor: '#d63031'}]} 
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  headerArea: { marginTop: 65, alignItems: 'center', marginBottom: 25 },
  mainTitle: { fontSize: 30, fontWeight: 'bold', color: '#001D4A' },
  fullWidthLine: { width: '100%', height: 4, backgroundColor: '#001D4A', borderRadius: 10, marginTop: 10 },
  smokeCard: { backgroundColor: '#001D4A', padding: 20, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  smokeTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  smokeSub: { color: '#AAB', marginVertical: 8 },
  smokeBtn: { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 12 },
  smokeBtnText: { color: '#001D4A', fontWeight: 'bold' },
  sectionCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#001D4A', textAlign: 'right', marginBottom: 15 },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  taskName: { fontSize: 20, fontWeight: 'bold', color: '#2D3436' },
  taskTag: { fontSize: 14, marginRight: 8 },
  lectureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F9F9F9', alignItems: 'center' },
  lecSubject: { flex: 1, textAlign: 'right', paddingRight: 10, fontSize: 18, fontWeight: 'bold' },
  lecTime: { fontSize: 14, color: '#666', width: 70 },
  lecDay: { fontSize: 14, fontWeight: 'bold', width: 50, textAlign: 'right' },
  inputArea: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F1F3F5', padding: 12, borderRadius: 20, textAlign: 'right', marginLeft: 10, fontSize: 16 },
  sendBtn: { backgroundColor: '#001D4A', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '180deg' }] }, // لضبط اتجاه السهم للعربية
  typeBtn: { padding: 10, borderRadius: 15, backgroundColor: '#00b894', width: 65, alignItems: 'center', marginLeft: 10 },
  typeBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' }
});