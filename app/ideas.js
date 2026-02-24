import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function IdeasScreen() {
  const [idea, setIdea] = useState('');
  const [ideasList, setIdeasList] = useState([]);

  // تحميل الأفكار المحفوظة عند فتح التطبيق
  useEffect(() => {
    loadIdeas();
  }, []);

  const saveIdeas = async (updatedList) => {
    try {
      await AsyncStorage.setItem('@my_ideas', JSON.stringify(updatedList));
    } catch (e) {
      console.log("خطأ في حفظ الأفكار");
    }
  };

  const loadIdeas = async () => {
    try {
      const savedIdeas = await AsyncStorage.getItem('@my_ideas');
      if (savedIdeas !== null) {
        setIdeasList(JSON.parse(savedIdeas));
      }
    } catch (e) {
      console.log("خطأ في تحميل الأفكار");
    }
  };

  const addIdea = () => {
    if (idea.trim().length > 0) {
      const newList = [{ id: Date.now().toString(), text: idea }, ...ideasList];
      setIdeasList(newList);
      saveIdeas(newList);
      setIdea(''); // مسح الحقل بعد الإضافة
    }
  };

  const deleteIdea = (id) => {
    const newList = ideasList.filter((item) => item.id !== id);
    setIdeasList(newList);
    saveIdeas(newList);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.headerTitle}>مخزن الأفكار 💡</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اكتب فكرتك العظيمة هنا..."
          value={idea}
          onChangeText={setIdea}
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={addIdea}>
          <Ionicons name="add-circle" size={50} color="#001D4A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={ideasList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.ideaCard}>
            <Text style={styles.ideaText}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteIdea(item.id)}>
              <Ionicons name="trash-outline" size={24} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9', padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#001D4A', textAlign: 'right', marginBottom: 20, marginTop: 40 },
  inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  input: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 15, 
    padding: 15, 
    textAlign: 'right', 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60
  },
  addButton: { marginRight: 10 },
  ideaCard: { 
    backgroundColor: '#FFF', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 10, 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  ideaText: { fontSize: 16, color: '#2D3436', flex: 1, textAlign: 'right', marginLeft: 10 }
});