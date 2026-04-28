import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors as colors, Spacing as spacing, Typography as typography, Shadows as shadows, BorderRadius as borderRadius } from '../theme';
import { Card } from '../components/Card';

interface SettingItem {
  id: string;
  label: string;
  icon: string;
  value?: string | boolean;
  type?: 'toggle' | 'action';
}

export const ProfileScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Mock user data
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    phone: '+1 (555) 123-4567',
    major: 'Computer Science',
    year: 'Junior',
    gpa: 3.45,
    avatar: '👎',
  };

  const settings: SettingItem[] = [
    {
      id: '1',
      label: 'Notifications',
      icon: 'bell',
      value: notificationsEnabled,
      type: 'toggle',
    },
    {
      id: '2',
      label: 'Dark Mode',
      icon: 'moon',
      value: darkMode,
      type: 'toggle',
    },
    {
      id: '3',
      label: 'Study Goals',
      icon: 'target',
      value: 'View & Edit',
      type: 'action',
    },
    {
      id: '4',
      label: 'Connected Apps',
      icon: 'link',
      value: '2 connected',
      type: 'action',
    },
    {
      id: '5',
      label: 'Privacy Settings',
      icon: 'lock',
      value: 'Manage',
      type: 'action',
    },
    {
      id: '6',
      label: 'About',
      icon: 'information',
      value: 'v1.0.0',
      type: 'action',
    },
  ];

  const achievements = [
    { id: '1', icon: '🎓', title: 'Scholar', desc: 'Maintained 3.5+ GPA' },
    { id: '2', icon: '📚', title: 'Bookworm', desc: 'Completed 50+ tasks' },
    { id: '3', icon: '⏰', title: 'Punctual', desc: '0 late submissions' },
    { id: '4', icon: '🔥', title: 'On Fire', desc: '7-day streak' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileCard, shadows.md]}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{user.avatar}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileMajor}>{user.major} • {user.year}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GPA</Text>
              <Text style={styles.statValue}>{user.gpa.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Courses</Text>
              <Text style={styles.statValue}>6</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tasks</Text>
              <Text style={styles.statValue}>14</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons
              name="pencil"
              size={16}
              color={colors.background}
            />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <Card key={achievement.id} style={styles.achievementCard}>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDesc}>{achievement.desc}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {settings.map((setting) => {
            const isToggle = setting.type === 'toggle';
            const isNotificationSetting = setting.id === '1';
            const isDarkModeSetting = setting.id === '2';

            return (
              <Card key={setting.id} style={styles.settingCard}>
                <View style={styles.settingContent}>
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIconContainer}>
                      <MaterialCommunityIcons
                        name={setting.icon as any}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                  </View>

                  {isToggle ? (
                    <Switch
                      value={
                        isNotificationSetting
                          ? notificationsEnabled
                          : darkMode
                      }
                      onValueChange={(val) => {
                        if (isNotificationSetting) {
                          setNotificationsEnabled(val);
                        } else {
                          setDarkMode(val);
                        }
                      }}
                      trackColor={{
                        false: colors.border,
                        true: colors.primaryLight,
                      }}
                      thumbColor={notificationsEnabled || darkMode ? colors.primary : colors.textMuted}
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      <Text style={styles.settingValue}>{setting.value}</Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textMuted}
                      />
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <Card style={styles.contactCard}>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons
                name="email"
                size={20}
                color={colors.primary}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{user.email}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.contactCard}>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color={colors.primary}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{user.phone}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Card style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerButton}>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={colors.danger}
              />
              <Text style={styles.dangerButtonText}>Logout</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerButton}>
              <MaterialCommunityIcons
                name="delete"
                size={20}
                color={colors.danger}
              />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Academic Aide v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ for students</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileContent: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileMajor: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: typography.fontSizeSM,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSizeXS,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  editButtonText: {
    color: colors.background,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  achievementsGrid: {
    gap: spacing.md,
  },
  achievementCard: {
    marginBottom: spacing.md,
  },
  achievementContent: {
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  achievementTitle: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  achievementDesc: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  settingCard: {
    marginBottom: spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
  },
  contactCard: {
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: typography.fontSizeXS,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  contactValue: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
  },
  dangerCard: {
    marginBottom: spacing.md,
    backgroundColor: `${colors.danger}10`,
    borderColor: `${colors.danger}30`,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dangerButtonText: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.danger,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
  },
  footerSubtext: {
    fontSize: typography.fontSizeXS,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
