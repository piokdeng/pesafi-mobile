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
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { getContacts, deleteContact } from '@/lib/api/client';
import type { Contact } from '@/lib/types';
import { truncateAddress } from '@/lib/currency';

export default function ContactsScreen() {
  const router = useRouter();
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
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.is_favorite && <Ionicons name="star" size={14} color={Colors.accent} />}
        </View>
        <Text style={styles.detail} numberOfLines={1}>
          {item.phone_number ?? truncateAddress(item.wallet_address)}
        </Text>
      </View>
      <Ionicons name="paper-plane-outline" size={20} color={Colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts"
          placeholderTextColor={Colors.mutedForeground}
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoad}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[...favorites, ...others]}
          keyExtractor={(c) => c.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListHeaderComponent={
            favorites.length > 0 ? (
              <Text style={styles.sectionLabel}>FAVORITES</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.mutedForeground} />
              <Text style={styles.emptyText}>No contacts yet</Text>
              <Text style={styles.emptySubtext}>Add contacts to send money faster</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.foreground },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 44,
  },
  searchInput: { flex: 1, color: Colors.foreground, fontSize: FontSize.base },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  sectionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.mutedForeground,
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
    backgroundColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.foreground },
  detail: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { color: Colors.foreground, fontWeight: FontWeight.medium, fontSize: FontSize.base },
  emptySubtext: { color: Colors.mutedForeground, fontSize: FontSize.sm },
});
