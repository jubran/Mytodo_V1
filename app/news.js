import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllNews = async () => {
    try {
      const sources = [
        { name: 'Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', icon: 'shield-checkmark' },
        { name: 'Dev.to', url: 'https://dev.to/feed', icon: 'code-slash' },
        { name: 'البوابة العربية', url: 'https://aitnews.com/category/security-news/feed/', icon: 'globe-outline' }
      ];

      // 1. جلب البيانات من كافة المصادر
      const allRequests = sources.map(async (src) => {
        try {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}`);
          const data = await response.json();
          return (data.items || []).map(item => ({ ...item, sourceName: src.name, sourceIcon: src.icon }));
        } catch (e) { return []; }
      });

      const results = await Promise.all(allRequests);
      const combined = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      // 2. ترجمة العناوين (أول 15 خبر للأداء السريع)
      const translated = await Promise.all(combined.slice(0, 15).map(async (item) => {
        // إذا كان المصدر عربي أو الرابط يحتوي على "aitnews" لا تترجم
        if (item.sourceName === 'البوابة العربية' || item.link.includes('aitnews')) {
          return item;
        }
        try {
          const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(item.title)}`;
          const res = await fetch(transUrl);
          const tData = await res.json();
          return { ...item, title: tData[0][0][0] || item.title };
        } catch (e) { return item; }
      }));

      setNews(translated);
    } catch (error) {
      console.log("Error fetching news:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllNews(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllNews();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#001D4A" />
        <Text style={{marginTop: 10, color: '#666'}}>جاري تحديث الأخبار وترجمتها...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>المركز الإخباري التقني 🛡️</Text>
      </View>

      <FlatList
        data={news}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.link)}>
            <View style={styles.cardHeader}>
              <Ionicons name={item.sourceIcon} size={18} color="#001D4A" />
              <Text style={styles.sourceTag}>{item.sourceName}</Text>
            </View>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.dateText}>{new Date(item.pubDate).toLocaleDateString('ar-SA')}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', paddingHorizontal: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginTop: 50, marginBottom: 20, alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#001D4A' },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  sourceTag: { fontSize: 12, color: '#001D4A', fontWeight: 'bold', marginRight: 5 },
  newsTitle: { fontSize: 16, color: '#2D3436', textAlign: 'right', lineHeight: 24, fontWeight: '500' },
  dateText: { fontSize: 11, color: '#95A5A6', marginTop: 10, textAlign: 'left' }
});