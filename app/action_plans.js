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

export default function ActionPlans() {
    const [plans, setPlans] = useState([]);
    const [title, setTitle] = useState('');
    const [method, setMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('لم تنجز'); // 'أنجزت', 'تحت الإنجاز', 'لم تنجز'
    const [editingId, setEditingId] = useState(null);

    // حالة التحكم بإظهار/إخفاء نموذج إضافة الخطة
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const storedPlans = await AsyncStorage.getItem('@action_plans');
            if (storedPlans) {
                setPlans(JSON.parse(storedPlans));
            }
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    };

    const savePlans = async (newPlans) => {
        try {
            await AsyncStorage.setItem('@action_plans', JSON.stringify(newPlans));
        } catch (error) {
            console.error('Error saving plans:', error);
        }
    };

    const handleSavePlan = () => {
        if (!title.trim() || !method.trim()) {
            Alert.alert('تنبيه', 'يرجى إدخال عنوان الخطة وطريقة الخطة على الأقل.');
            return;
        }

        let updatedPlans;
        if (editingId) {
            // تعديل
            updatedPlans = plans.map(plan =>
                plan.id === editingId
                    ? { ...plan, title, method, notes, status }
                    : plan
            );
            setEditingId(null);
        } else {
            // إضافة جديدة
            const newPlan = {
                id: Date.now().toString(),
                title,
                method,
                notes,
                status,
                createdAt: new Date().toLocaleDateString('en-US')
            };
            updatedPlans = [newPlan, ...plans];
        }

        setPlans(updatedPlans);
        savePlans(updatedPlans);
        resetForm();
    };

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setTitle(plan.title);
        setMethod(plan.method);
        setNotes(plan.notes || '');
        setStatus(plan.status || 'لم تنجز');
        setIsFormVisible(true); // لفتح النموذج تلقائياً عند طلب التعديل
    };

    const handleDelete = (id) => {
        Alert.alert(
            'تأكيد الحذف',
            'هل أنت متأكد من حذف هذه الخطة؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => {
                        const updatedPlans = plans.filter(plan => plan.id !== id);
                        setPlans(updatedPlans);
                        savePlans(updatedPlans);
                    }
                }
            ]
        );
    };

    const toggleStatus = (id) => {
        const updatedPlans = plans.map(plan => {
            if (plan.id === id) {
                let nextStatus;
                if (plan.status === 'لم تنجز') nextStatus = 'تحت الإنجاز';
                else if (plan.status === 'تحت الإنجاز') nextStatus = 'أنجزت';
                else nextStatus = 'لم تنجز';

                return { ...plan, status: nextStatus };
            }
            return plan;
        });
        setPlans(updatedPlans);
        savePlans(updatedPlans);
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setMethod('');
        setNotes('');
        setStatus('لم تنجز');
        setIsFormVisible(false); // إغلاق النموذج بعد الحفظ أو الإلغاء
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
                <Text style={styles.headerTitle}>إدارة خطط العمل 📈</Text>

                {/* زر إظهار/إخفاء نموذج الإضافة */}
                <TouchableOpacity
                    style={styles.toggleFormBtn}
                    onPress={() => {
                        if (isFormVisible && editingId) {
                            // إذا كان قيد التعديل وضغط إغلاق، نقوم بإلغاء التعديل
                            resetForm();
                        } else {
                            setIsFormVisible(!isFormVisible);
                        }
                    }}
                >
                    <Text style={styles.toggleFormText}>
                        {editingId
                            ? 'تعديل الخطة الحالية'
                            : isFormVisible ? 'إغلاق نافذة الإضافة' : 'إضافة خطة جديدة'
                        }
                    </Text>
                    <Ionicons
                        name={isFormVisible ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#001D4A"
                    />
                </TouchableOpacity>

                {/* نموذج الإدخال (يظهر ويختفي بناءً على الحالة) */}
                {isFormVisible && (
                    <View style={styles.formCard}>
                        <TextInput
                            style={styles.input}
                            placeholder="عنوان الخطة"
                            value={title}
                            onChangeText={setTitle}
                            textAlign="right"
                        />
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="طريقة الخطة"
                            value={method}
                            onChangeText={setMethod}
                            multiline
                            textAlign="right"
                        />
                        <TextInput
                            style={[styles.input, { height: 60 }]}
                            placeholder="ملاحظات (اختياري)"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            textAlign="right"
                        />

                        <View style={styles.statusContainer}>
                            <Text style={styles.statusLabel}>الحالة:</Text>
                            <View style={styles.statusOptions}>
                                <TouchableOpacity
                                    style={[styles.statusBtn, status === 'أنجزت' && styles.statusBtnActiveCompleted]}
                                    onPress={() => setStatus('أنجزت')}
                                >
                                    <Text style={[styles.statusBtnText, status === 'أنجزت' && styles.statusBtnTextActive]}>أنجزت</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.statusBtn, status === 'تحت الإنجاز' && styles.statusBtnActiveInProgress]}
                                    onPress={() => setStatus('تحت الإنجاز')}
                                >
                                    <Text style={[styles.statusBtnText, status === 'تحت الإنجاز' && styles.statusBtnTextActive]}>تحت الإنجاز</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.statusBtn, status === 'لم تنجز' && styles.statusBtnActiveIncomplete]}
                                    onPress={() => setStatus('لم تنجز')}
                                >
                                    <Text style={[styles.statusBtnText, status === 'لم تنجز' && styles.statusBtnTextActive]}>لم تنجز</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePlan}>
                                <Text style={styles.saveBtnText}>{editingId ? 'حفظ التعديلات' : 'إضافة الخطة'}</Text>
                            </TouchableOpacity>
                            {editingId && (
                                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                                    <Text style={styles.cancelBtnText}>إلغاء</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* قائمة الخطط */}
                <Text style={styles.listTitle}>الخطط الحالية</Text>
                {plans.length === 0 ? (
                    <Text style={styles.emptyText}>لا توجد خطط حالياً، ابدأ بإضافة خطتك الأولى!</Text>
                ) : (
                    plans.map(plan => (
                        <View key={plan.id} style={styles.planCard}>
                            <View style={styles.planHeader}>
                                <Text style={styles.planTitle}>{plan.title}</Text>
                                <TouchableOpacity onPress={() => toggleStatus(plan.id)}>
                                    <Text style={[
                                        styles.planBadge,
                                        plan.status === 'أنجزت' ? styles.badgeCompleted :
                                            plan.status === 'تحت الإنجاز' ? styles.badgeInProgress :
                                                styles.badgeIncomplete
                                    ]}>
                                        {plan.status}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.planLabel}>طريقة الخطة:</Text>
                            <Text style={styles.planText}>{plan.method}</Text>

                            {plan.notes ? (
                                <>
                                    <Text style={styles.planLabel}>ملاحظات:</Text>
                                    <Text style={styles.planNotes}>{plan.notes}</Text>
                                </>
                            ) : null}

                            <View style={styles.planActions}>
                                <TouchableOpacity onPress={() => handleEdit(plan)} style={styles.iconBtn}>
                                    <Ionicons name="pencil" size={20} color="#001D4A" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(plan.id)} style={styles.iconBtn}>
                                    <Ionicons name="trash" size={20} color="#ff4757" />
                                </TouchableOpacity>
                            </View>
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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#001D4A',
        textAlign: 'center',
        marginVertical: 10
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
        backgroundColor: '#F9FAFC',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    input: {
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlignVertical: 'top',
        textAlign: 'right'
    },
    statusContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    statusOptions: {
        flexDirection: 'row-reverse',
        gap: 5
    },
    statusBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#E0E0E0'
    },
    statusBtnActiveCompleted: {
        backgroundColor: '#00b894'
    },
    statusBtnActiveInProgress: {
        backgroundColor: '#fdcb6e' // لون برتقالي مصفر دلالة على أنها قيد التنفيذ
    },
    statusBtnActiveIncomplete: {
        backgroundColor: '#ff7675'
    },
    statusBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555'
    },
    statusBtnTextActive: {
        color: '#FFF'
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
    planCard: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderRightWidth: 4,
        borderRightColor: '#001D4A',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 }
    },
    planHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    planTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        flex: 1,
        textAlign: 'right'
    },
    planBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 10
    },
    badgeCompleted: {
        backgroundColor: '#00b894'
    },
    badgeInProgress: {
        backgroundColor: '#fdcb6e'
    },
    badgeIncomplete: {
        backgroundColor: '#ff7675'
    },
    planLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
        textAlign: 'right',
        marginTop: 5
    },
    planText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'right',
        marginBottom: 5
    },
    planNotes: {
        fontSize: 14,
        color: '#666',
        textAlign: 'right',
        backgroundColor: '#F9F9F9',
        padding: 8,
        borderRadius: 6,
        marginTop: 5
    },
    planActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 15,
        gap: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10
    },
    iconBtn: {
        padding: 5
    }
});
