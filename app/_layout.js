import { Drawer } from 'expo-router/drawer';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{ drawerPosition: 'right', headerTitle: "مساعدي الشخصي 🛡️" }}>
        <Drawer.Screen name="index" options={{ drawerLabel: 'الرئيسية 🏠' }} />
        <Drawer.Screen name="news" options={{ drawerLabel: 'الأخبار التقنية 📰' }} />
        <Drawer.Screen name="ideas" options={{ drawerLabel: 'الأفكار', title: 'الأفكار' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}