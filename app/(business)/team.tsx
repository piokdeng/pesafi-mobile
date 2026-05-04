import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTeamMembers, inviteTeamMember } from '@/lib/api/business';
import type { TeamMember, TeamRole } from '@/lib/types';

const ROLES: Array<{ key: TeamRole; label: string; description: string; icon: string }> = [
  { key: 'admin', label: 'Admin', description: 'Full access except billing', icon: 'shield-checkmark' },
  { key: 'finance', label: 'Finance', description: 'Payments, invoices & payroll', icon: 'cash' },
  { key: 'viewer', label: 'Viewer', description: 'View-only access', icon: 'eye' },
];

export default function TeamScreen() {
  const { colors } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    getTeamMembers().then(setMembers).finally(() => setLoading(false));
  }, []);

  const roleColor = (role: TeamRole) => {
    switch (role) {
      case 'owner': return colors.warning;
      case 'admin': return colors.info;
      case 'finance': return colors.primary;
      case 'viewer': return colors.mutedForeground;
    }
  };

  const roleIcon = (role: TeamRole): any => {
    switch (role) {
      case 'owner': return 'star';
      case 'admin': return 'shield-checkmark';
      case 'finance': return 'cash';
      case 'viewer': return 'eye';
    }
  };

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail) {
      Alert.alert('Required', 'Please enter name and email.'); return;
    }
    if (!inviteEmail.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.'); return;
    }
    setInviting(true);
    try {
      const member = await inviteTeamMember({ name: inviteName, email: inviteEmail, role: inviteRole });
      setMembers(prev => [...prev, member]);
      setShowInvite(false);
      setInviteName(''); setInviteEmail(''); setInviteRole('viewer');
      Alert.alert('Invite sent!', `${inviteName} will receive an email invite to join your team.`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (member: TeamMember) => {
    if (member.role === 'owner') { Alert.alert('Cannot remove', 'The owner cannot be removed.'); return; }
    Alert.alert(
      `Remove ${member.name}?`,
      'They will lose access to your business account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setMembers(prev => prev.filter(m => m.id !== member.id)),
        },
      ]
    );
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Team</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowInvite(true)}
        >
          <Ionicons name="person-add" size={16} color="#08101D" />
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Role guide */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ROLES</Text>
            <Card style={{ marginBottom: Spacing.xl }}>
              {ROLES.map((role, i) => (
                <View key={role.key}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.roleRow}>
                    <View style={[styles.roleIcon, { backgroundColor: roleColor(role.key as TeamRole) + '20' }]}>
                      <Ionicons name={role.icon as any} size={16} color={roleColor(role.key as TeamRole)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleLabel, { color: colors.foreground }]}>{role.label}</Text>
                      <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{role.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>

            {/* Active members */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE MEMBERS</Text>
            {activeMembers.map((m) => (
              <Card key={m.id} style={{ marginBottom: Spacing.sm }}>
                <View style={styles.memberRow}>
                  <View style={[styles.avatar, { backgroundColor: roleColor(m.role) + '25' }]}>
                    <Text style={[styles.avatarText, { color: roleColor(m.role) }]}>
                      {m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: colors.foreground }]}>{m.name}</Text>
                    <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>{m.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor(m.role) + '20' }]}>
                      <Ionicons name={roleIcon(m.role)} size={11} color={roleColor(m.role)} />
                      <Text style={[styles.roleBadgeText, { color: roleColor(m.role) }]}>{m.role.toUpperCase()}</Text>
                    </View>
                    {m.role !== 'owner' && (
                      <TouchableOpacity onPress={() => handleRemove(m)} hitSlop={8}>
                        <Text style={[styles.removeText, { color: colors.destructive }]}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            ))}

            {/* Pending invites */}
            {pendingMembers.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>PENDING INVITES</Text>
                {pendingMembers.map((m) => (
                  <Card key={m.id} style={{ marginBottom: Spacing.sm }}>
                    <View style={styles.memberRow}>
                      <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                        <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.memberName, { color: colors.foreground }]}>{m.name}</Text>
                        <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>{m.email}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={[styles.roleBadge, { backgroundColor: colors.warningBg }]}>
                          <Text style={[styles.roleBadgeText, { color: colors.warning }]}>PENDING</Text>
                        </View>
                        <TouchableOpacity onPress={() => setMembers(prev => prev.filter(mm => mm.id !== m.id))} hitSlop={8}>
                          <Text style={[styles.removeText, { color: colors.mutedForeground }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {members.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={56} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Just you for now</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Invite your accountant, finance team, or co-founder.</Text>
                <Button title="Invite team member" onPress={() => setShowInvite(true)} />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowInvite(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>Invite member</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Card style={{ marginBottom: Spacing.lg }}>
              <View style={{ gap: Spacing.md }}>
                <Input label="Full name" value={inviteName} onChangeText={setInviteName} placeholder="Jane Achieng" autoCapitalize="words" />
                <Input label="Email" value={inviteEmail} onChangeText={setInviteEmail} placeholder="jane@example.com" keyboardType="email-address" autoCapitalize="none" />
              </View>
            </Card>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SELECT ROLE</Text>
            {ROLES.map(role => {
              const active = inviteRole === role.key;
              return (
                <TouchableOpacity
                  key={role.key}
                  onPress={() => setInviteRole(role.key)}
                  activeOpacity={0.8}
                >
                  <Card style={[
                    { marginBottom: Spacing.sm },
                    active && { borderWidth: 1.5, borderColor: colors.primary },
                  ]}>
                    <View style={styles.roleSelectRow}>
                      <View style={[styles.roleIcon, { backgroundColor: roleColor(role.key) + '20' }]}>
                        <Ionicons name={role.icon as any} size={18} color={roleColor(role.key)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleLabel, { color: colors.foreground }]}>{role.label}</Text>
                        <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{role.description}</Text>
                      </View>
                      <View style={[styles.radioOuter, { borderColor: active ? colors.primary : colors.border }]}>
                        {active && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}

            <View style={{ height: Spacing.lg }} />
            <Button
              title={`Send invite as ${inviteRole}`}
              onPress={handleInvite}
              loading={inviting}
              disabled={!inviteName || !inviteEmail}
              fullWidth
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.sm, marginTop: 2 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full },
  inviteBtnText: { color: '#08101D', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginBottom: Spacing.sm },
  divider: { height: 1, marginVertical: Spacing.sm },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 4 },
  roleSelectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  roleIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  roleLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  roleDesc: { fontSize: FontSize.xs, marginTop: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  memberName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  memberEmail: { fontSize: FontSize.xs, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  roleBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  removeText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySubtitle: { fontSize: FontSize.base, textAlign: 'center', maxWidth: 280 },
});
