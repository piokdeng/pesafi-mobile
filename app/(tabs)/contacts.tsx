import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getContacts, deleteContact } from '@/lib/api/client';
import type { Contact } from '@/lib/types';
import { truncateAddress } from '@/lib/currency';

export default function ContactsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setContacts(await getContacts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (c: Contact) => {
    Alert.alert('Delete contact', `Remove ${c.name} from your contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteContact(c.id);
          setContacts((prev) => prev.filter((x) => x.id !== c.id));
        },
      },
    ]);
  };

  const visibleContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone_number ?? '').toLowerCase().includes(q) ||
        (c.wallet_address ?? '').toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const favorites = visibleContacts.filter((c) => c.is_favorite);
  const others = visibleContacts.filter((c) => !c.is_favorite);

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.row}
      onLongPress={() => handleDelete(item)}
      onPress={() => router.push('/send')}
    >
      <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
          {item.is_favorite && <Ionicons name="star" size={14} color={colors.accent} />}
        </View>
        <Text style={[styles.detail, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.phone_number ?? truncateAddress(item.wallet_address)}
        </Text>
      </View>
      <Ionicons name="paper-plane-outline" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Contacts</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoad}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[...favorites, ...others]}
          keyExtractor={(c) => c.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          ListHeaderComponent={
            favorites.length > 0 ? (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FAVORITES</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>No contacts yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>Add contacts to send money faster</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: FontSize.base },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  sectionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontWeight: FontWeight.bold, fontSize: FontSize.base },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  detail: { fontSize: FontSize.sm, marginTop: 2 },
  divider: { height: 1, marginLeft: 60 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { fontWeight: FontWeight.medium, fontSize: FontSize.base },
  emptySubtext: { fontSize: FontSize.sm },
});
