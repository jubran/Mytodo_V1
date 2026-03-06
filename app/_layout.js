import { Drawer } from 'expo-router/drawer';
import { Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{
        drawerPosition: 'right',
        headerTitleAlign: 'center',
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>🛡️</Text>
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 6, marginRight: 8 }}>v.1.1</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#001D4A' }}>مساعدي الشخصي</Text>
          </View>
        )
      }}>
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'الصفحة الرئيسية 🏠', title: 'الصفحة الرئيسية' }} />
        <Drawer.Screen name="ideas" options={{ drawerLabel: 'الأفكار 💡', title: 'الأفكار' }} />
        <Drawer.Screen name="action_plans" options={{ drawerLabel: 'خطط العمل 📈', title: 'خطط العمل' }} />
        <Drawer.Screen name="obligations" options={{ drawerLabel: 'الالتزامات 💳', title: 'الالتزامات' }} />
        <Drawer.Screen name="news" options={{ drawerLabel: 'الأخبار التقنية 📰', title: 'الأخبار التقنية' }} />
        <Drawer.Screen name="modal" options={{ drawerLabel: 'نافذة', drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}