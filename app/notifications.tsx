import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useNotifications, Notification, NotificationType } from '@/lib/notifications';
import { Card } from '@/components/ui/Card';

const ICONS: Record<NotificationType, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  deposit: 'add-circle',
  receipt: 'arrow-down',
  fx: 'swap-horizontal',
  send: 'paper-plane',
  withdrawal: 'arrow-up-circle',
  system: 'information-circle',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notifications, markRead, markAllRead, clear, unreadCount } = useNotifications();

  const handleTap = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.meta?.txId) router.push(`/tx/${n.meta.txId}` as any);
  };

  const handleClear = () => {
    if (notifications.length === 0) return;
    Alert.alert('Clear all notifications?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => clear() },
    ]);
  };

  const colorForType = (t: NotificationType): string => {
    switch (t) {
      case 'deposit': return colors.deposit;
      case 'receipt': return colors.receive;
      case 'send': return colors.send;
      case 'withdrawal': return colors.withdraw;
      case 'fx': return colors.fx;
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <TouchableOpacity onPress={handleClear} hitSlop={10}>
          <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {notifications.length > 0 && unreadCount > 0 && (
        <TouchableOpacity
          onPress={markAllRead}
          style={[styles.markAllBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>No notifications</Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
              Deposits, receipts, and FX alerts will show up here.
            </Text>
          </View>
        ) : (
          notifications.map((n) => {
            const c = colorForType(n.type);
            return (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.75}
                onPress={() => handleTap(n)}
                style={[
                  styles.row,
                  {
                    backgroundColor: n.read ? colors.card : colors.cardElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: c + '20' }]}>
                  <Ionicons name={ICONS[n.type]} size={20} color={c} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.nTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {!n.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.nBody, { color: colors.foregroundSubtle }]} numberOfLines={2}>
                    {n.body}
                  </Text>
                  <Text style={[styles.nTime, { color: colors.mutedForeground }]}>
                    {relativeTime(n.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  markAllBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  markAllText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scroll: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  emptySubtext: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
  row: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, flex: 1 },
  nBody: { fontSize: FontSize.sm, lineHeight: 18, marginTop: 2 },
  nTime: { fontSize: FontSize.xs, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
