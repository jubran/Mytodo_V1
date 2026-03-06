import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert, KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

export default function Obligations() {
    const [obligations, setObligations] = useState([]);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        loadObligations();
    }, []);

    const loadObligations = async () => {
        try {
            const stored = await AsyncStorage.getItem('@obligations');
            if (stored) {
                setObligations(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading obligations:', error);
        }
    };

    const saveObligations = async (newObligations) => {
        try {
            await AsyncStorage.setItem('@obligations', JSON.stringify(newObligations));
        } catch (error) {
            console.error('Error saving obligations:', error);
        }
    };

    const handleSave = () => {
        if (!name.trim() || !amount.trim() || !dueDate.trim()) {
            Alert.alert('تنبيه', 'يرجى إدخال اسم الالتزام، المبلغ، وتاريخ الاستحقاق.');
            return;
        }

        // تحقق من أن المبلغ رقم
        if (isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح.');
            return;
        }

        const newObligation = {
            id: Date.now().toString(),
            name,
            amount: parseFloat(amount),
            dueDate
        };

        const updatedObligations = [newObligation, ...obligations];
        setObligations(updatedObligations);
        saveObligations(updatedObligations);
        resetForm();
    };

    const handleDelete = (id) => {
        Alert.alert(
            'تأكيد الحذف',
            'هل أنت متأكد من حذف هذا الالتزام؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => {
                        const updated = obligations.filter(ob => ob.id !== id);
                        setObligations(updated);
                        saveObligations(updated);
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setName('');
        setAmount('');
        setDueDate('');
        setIsFormVisible(false);
    };

    // حساب إجمالي الالتزامات
    const totalAmount = obligations.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>

                {/* قسم المجموع الكلي */}
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>إجمالي الالتزامات 💰</Text>
                    <Text style={styles.totalAmount}>{totalAmount.toLocaleString('en-US')} ريال</Text>
                </View>

                {/* زر إظهار/إخفاء نموذج الإضافة */}
                <TouchableOpacity
                    style={styles.toggleFormBtn}
                    onPress={() => setIsFormVisible(!isFormVisible)}
                >
                    <Text style={styles.toggleFormText}>
                        {isFormVisible ? 'إغلاق نافذة الإضافة' : 'إضافة التزام جديد'}
                    </Text>
                    <Ionicons
                        name={isFormVisible ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#001D4A"
                    />
                </TouchableOpacity>

                {/* نموذج الإدخال */}
                {isFormVisible && (
                    <View style={styles.formCard}>
                        <TextInput
                            style={[styles.input, { marginBottom: 15 }]}
                            placeholder="اسم الالتزام (مثال: إيجار الشقة)"
                            value={name}
                            onChangeText={setName}
                            textAlign="right"
                        />
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                            <TextInput
                                style={[styles.input, { width: '48%', marginBottom: 15 }]}
                                placeholder="المبلغ"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                textAlign="right"
                            />
                            <TextInput
                                style={[styles.input, { width: '48%', marginBottom: 15 }]}
                                placeholder="تاريخ الاستحقاق"
                                value={dueDate}
                                onChangeText={setDueDate}
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>إضافة الالتزام</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                                <Text style={styles.cancelBtnText}>إلغاء</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* قائمة الالتزامات */}
                <Text style={styles.listTitle}>الالتزامات الحالية</Text>
                {obligations.length === 0 ? (
                    <Text style={styles.emptyText}>لا توجد التزامات حالياً، بداية موفقة!</Text>
                ) : (
                    obligations.map(ob => (
                        <View key={ob.id} style={styles.obCard}>
                            <View style={styles.obDetails}>
                                <Text style={styles.obName}>{ob.name}</Text>
                                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 5 }}>
                                    <Text style={styles.obAmount}>{ob.amount.toLocaleString('en-US')} ريال</Text>
                                    <Text style={styles.obDate}>تاريخ الاستحقاق: {ob.dueDate}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(ob.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash" size={24} color="#ff7675" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7F9'
    },
    totalCard: {
        backgroundColor: '#001D4A',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    totalLabel: {
        fontSize: 18,
        color: '#AAB',
        marginBottom: 5,
        fontWeight: 'bold'
    },
    totalAmount: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFF'
    },
    toggleFormBtn: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    toggleFormText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#001D4A'
    },
    formCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    input: {
        backgroundColor: '#F9FAFC',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlign: 'right'
    },
    actionButtons: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        gap: 10
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#001D4A',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#ff7675',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    cancelBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#001D4A',
        textAlign: 'right',
        marginBottom: 10
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
        fontSize: 16
    },
    obCard: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderRightWidth: 4,
        borderRightColor: '#ff7675',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 }
    },
    obDetails: {
        flex: 1,
        marginRight: 10
    },
    obName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        textAlign: 'right'
    },
    obAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#001D4A'
    },
    obDate: {
        fontSize: 14,
        color: '#888'
    },
    deleteBtn: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#ffeaa7'
    }
});
