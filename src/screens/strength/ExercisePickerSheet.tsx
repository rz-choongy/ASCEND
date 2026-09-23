import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDaysAgo, formatWeight } from '../../domain/strengthProgress';
import type { ExerciseCategoryRow, ExerciseRow } from '../../domain/types';
import {
  ChevronLeftIcon,
  Chip,
  DialogHost,
  MoreIcon,
  SearchIcon,
  StarIcon,
  font,
  radius,
  spacing,
  useTheme,
} from '../../ui';
import type { ThemeColors } from '../../ui/tokens/colors';
import type { Typography } from '../../ui/tokens/typography';

export type ExerciseUsage = {
  lastSet: { weight: number; reps: number };
  lastAt: number;
};

type Filter = 'all' | 'favorites' | string;

type Props = {
  visible: boolean;
  exercises: ExerciseRow[];
  categories: ExerciseCategoryRow[];
  /** Keyed by exercise id. */
  usage: Map<string, ExerciseUsage>;
  /** Sets logged per exercise id in the session that's open. */
  sessionSets: Map<string, number>;
  onPick: (exerciseId: string) => void;
  onCreate: (name: string, categoryId: string | null) => void;
  onToggleFavorite: (exerciseId: string) => void;
  onSetCategory: (exerciseId: string, categoryId: string | null) => void;
  /** Returns an error to show under the name field, or null when saved. */
  onRename: (exerciseId: string, name: string) => string | null;
  /** The parent confirms first -- deleting takes the exercise's logged sets with it. */
  onDelete: (exerciseId: string) => void;
  onManageCategories: () => void;
  onClose: () => void;
};

const RECENT_SHOWN = 5;

/**
 * Choosing an exercise when there are too many for a row of chips: search
 * (which doubles as "add"), favourites and recent first, then everything A-Z,
 * with category filters. Long-press or ⋯ on a row to file it under a category.
 */
export const ExercisePickerSheet = ({
  visible,
  exercises,
  categories,
  usage,
  sessionSets,
  onPick,
  onCreate,
  onToggleFavorite,
  onSetCategory,
  onRename,
  onDelete,
  onManageCategories,
  onClose,
}: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  // Every opening starts fresh: no stale search or half-finished edit.
  useEffect(() => {
    if (visible) {
      setQuery('');
      setEditingId(null);
      // The category behind the filter may have been deleted while the sheet was closed.
      setFilter((current) =>
        current === 'all' || current === 'favorites' || categories.some((c) => c.id === current) ? current : 'all'
      );
    }
    // Only on open: re-running on every category change would reset the view mid-use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const q = query.trim().toLowerCase();
  const alphabetical = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [exercises]
  );
  const inFilter = (e: ExerciseRow) =>
    filter === 'all' ? true : filter === 'favorites' ? e.favorite === 1 : e.category_id === filter;

  const matches = alphabetical.filter((e) => inFilter(e) && (!q || e.name.toLowerCase().includes(q)));
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === q);
  const browsing = !q && filter === 'all';
  const favorites = browsing ? alphabetical.filter((e) => e.favorite === 1) : [];
  const recent = browsing
    ? exercises
        .filter((e) => usage.has(e.id) && e.favorite !== 1)
        .sort((a, b) => (usage.get(b.id)?.lastAt ?? 0) - (usage.get(a.id)?.lastAt ?? 0))
        .slice(0, RECENT_SHOWN)
    : [];
  const newCategoryId = filter !== 'all' && filter !== 'favorites' ? filter : null;
  const editing = editingId ? exercises.find((e) => e.id === editingId) ?? null : null;

  // Seed the name field whenever a different exercise is opened for editing.
  useEffect(() => {
    setDraftName(editing?.name ?? '');
    setRenameError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // Leaving the edit view unmounts the name field before it can blur, so every
  // exit path saves a pending rename first.
  const leaveEditing = () => {
    saveName();
    setEditingId(null);
  };
  const closeSheet = () => {
    if (editing) saveName();
    onClose();
  };
  const manageCategories = () => {
    if (editing) saveName();
    onManageCategories();
  };

  const saveName = () => {
    if (!editing) return;
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === editing.name) {
      setDraftName(editing.name);
      setRenameError(null);
      return;
    }
    setRenameError(onRename(editing.id, trimmed));
  };

  const subtitle = (e: ExerciseRow): string => {
    const parts: string[] = [];
    if (e.category_id && categoryName.has(e.category_id)) parts.push(categoryName.get(e.category_id) as string);
    const used = usage.get(e.id);
    if (used) {
      const w = used.lastSet.weight === 0 ? 'BW' : `${formatWeight(used.lastSet.weight)} kg`;
      parts.push(`${w} × ${used.lastSet.reps} · ${formatDaysAgo(used.lastAt)}`);
    } else {
      parts.push('Not logged yet');
    }
    return parts.join(' · ');
  };

  const row = (e: ExerciseRow, index: number) => {
    const sets = sessionSets.get(e.id) ?? 0;
    const favorite = e.favorite === 1;
    return (
      <Pressable
        key={e.id}
        onPress={() => onPick(e.id)}
        onLongPress={() => setEditingId(e.id)}
        style={({ pressed }) => [styles.row, index > 0 ? styles.rowDivided : null, pressed ? styles.rowPressed : null]}
        accessibilityRole="button"
        accessibilityLabel={`${e.name}. ${subtitle(e)}`}
      >
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {e.name}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {subtitle(e)}
          </Text>
        </View>
        {sets > 0 ? (
          <View style={styles.todayTag}>
            <Text style={styles.todayTagText}>
              {sets} {sets === 1 ? 'set' : 'sets'} today
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => onToggleFavorite(e.id)}
          hitSlop={8}
          style={styles.rowIcon}
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Remove ${e.name} from favourites` : `Add ${e.name} to favourites`}
        >
          <StarIcon size={19} color={favorite ? colors.accent : colors.textMuted} filled={favorite} />
        </Pressable>
        <Pressable
          onPress={() => setEditingId(e.id)}
          hitSlop={8}
          style={styles.rowIcon}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${e.name}`}
        >
          <MoreIcon size={18} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  };

  const section = (title: string, list: ExerciseRow[]) =>
    list.length > 0 ? (
      <View style={styles.section} key={title}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View>{list.map(row)}</View>
      </View>
    ) : null;

  const filterChip = (id: Filter, label: string) => (
    <Chip key={id} label={label} selected={filter === id} onPress={() => setFilter(id)} />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={editing ? leaveEditing : onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} accessibilityLabel="Close exercise list" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.grabber} />

          {editing ? (
            <>
              <View style={styles.headerRow}>
                <Pressable onPress={leaveEditing} hitSlop={10} style={styles.back} accessibilityRole="button">
                  <ChevronLeftIcon size={18} color={colors.textPrimary} />
                  <Text style={styles.backText}>Exercises</Text>
                </Pressable>
              </View>
              <View style={styles.nameField}>
                <Text style={styles.sectionTitle}>Name</Text>
                <TextInput
                  value={draftName}
                  onChangeText={(text) => {
                    setDraftName(text);
                    setRenameError(null);
                  }}
                  onBlur={saveName}
                  onSubmitEditing={saveName}
                  returnKeyType="done"
                  style={styles.nameInput}
                  accessibilityLabel="Exercise name"
                />
                {renameError ? <Text style={styles.renameError}>{renameError}</Text> : null}
              </View>

              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryWrap}>
                <Chip
                  label="None"
                  selected={editing.category_id === null}
                  onPress={() => onSetCategory(editing.id, null)}
                />
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    selected={editing.category_id === c.id}
                    onPress={() => onSetCategory(editing.id, c.id)}
                  />
                ))}
                <Chip label="Manage…" onPress={manageCategories} style={styles.manageChip} />
              </View>

              <View style={styles.favoriteRow}>
                <Text style={styles.favoriteLabel}>Favourite</Text>
                <Switch
                  value={editing.favorite === 1}
                  onValueChange={() => onToggleFavorite(editing.id)}
                  trackColor={{ false: colors.fill, true: colors.accent }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Favourite"
                />
              </View>

              <Pressable
                onPress={() => onDelete(editing.id)}
                style={({ pressed }) => [styles.deleteButton, pressed ? styles.rowPressed : null]}
                accessibilityRole="button"
              >
                <Text style={styles.deleteText}>Delete exercise</Text>
                <Text style={styles.deleteHint}>Also deletes every set logged for it</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Exercise</Text>
                <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
                  <Text style={styles.cancel}>Cancel</Text>
                </Pressable>
              </View>

              <View style={styles.search}>
                <SearchIcon size={16} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search or add an exercise"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  autoCorrect={false}
                  returnKeyType="done"
                  accessibilityLabel="Search exercises"
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filters}
                contentContainerStyle={styles.filterRow}
                keyboardShouldPersistTaps="handled"
              >
                {filterChip('all', 'All')}
                {filterChip('favorites', '★ Favourites')}
                {categories.map((c) => filterChip(c.id, c.name))}
                <Chip label="Manage…" onPress={manageCategories} style={styles.manageChip} />
              </ScrollView>

              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}>
                {q && !exactMatch ? (
                  <Pressable
                    onPress={() => onCreate(query.trim(), newCategoryId)}
                    style={({ pressed }) => [styles.addRow, pressed ? styles.rowPressed : null]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.addText} numberOfLines={1}>
                      + Add “{query.trim()}”
                      {newCategoryId ? ` to ${categoryName.get(newCategoryId)}` : ''}
                    </Text>
                  </Pressable>
                ) : null}

                {section('Favourites', favorites)}
                {section('Recent', recent)}
                {section(
                  q ? 'Matches' : filter === 'all' ? 'All exercises' : filter === 'favorites' ? 'Favourites' : categoryName.get(filter) ?? 'Exercises',
                  matches
                )}
                {matches.length === 0 && !q ? (
                  <Text style={styles.empty}>
                    {filter === 'favorites'
                      ? 'Tap the star on an exercise to keep it here.'
                      : 'Nothing in this category yet. Search to add one, or long-press an exercise to file it here.'}
                  </Text>
                ) : null}
              </ScrollView>
            </>
          )}
        </View>
        {/* Delete confirmations open from inside this sheet, so they draw in here. */}
        {visible ? <DialogHost inline /> : null}
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    sheet: {
      height: '92%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      gap: spacing.s,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.borderSoft,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 36,
    },
    title: {
      ...typography.title,
    },
    cancel: {
      ...font('medium'),
      fontSize: 15,
      color: colors.textSecondary,
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.s,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
    },
    searchInput: {
      ...font('regular'),
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    // Bleeds to the sheet edges so the chips scroll under the gutter.
    filters: {
      flexGrow: 0,
      marginHorizontal: -spacing.sm,
    },
    filterRow: {
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    manageChip: {
      borderStyle: 'dashed',
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
    section: {
      gap: spacing.xxs,
    },
    sectionTitle: {
      ...typography.section,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 56,
      paddingHorizontal: spacing.xxs,
    },
    rowDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowPressed: {
      backgroundColor: colors.fillSoft,
    },
    rowText: {
      flex: 1,
      gap: 1,
    },
    rowTitle: {
      ...typography.body,
    },
    rowSub: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    rowIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.accentMuted,
    },
    todayTagText: {
      ...font('medium'),
      fontSize: 11,
      color: colors.accent,
      fontVariant: ['tabular-nums'],
    },
    addRow: {
      minHeight: 52,
      justifyContent: 'center',
      paddingHorizontal: spacing.s,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    addText: {
      ...font('medium'),
      fontSize: 16,
      color: colors.accent,
    },
    empty: {
      ...typography.bodyMuted,
      paddingHorizontal: spacing.xxs,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      minHeight: 36,
    },
    backText: {
      ...font('medium'),
      fontSize: 15,
      color: colors.textPrimary,
    },
    nameField: {
      gap: spacing.xxs,
    },
    // Underlined like the logger's typed values, so it reads as editable in place.
    nameInput: {
      ...typography.title,
      paddingVertical: spacing.xxs,
      borderBottomWidth: 2,
      borderBottomColor: colors.action,
    },
    renameError: {
      ...font('regular'),
      fontSize: 13,
      color: colors.danger,
    },
    deleteButton: {
      marginTop: 'auto',
      minHeight: 56,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
      gap: 1,
    },
    deleteText: {
      ...font('semibold'),
      fontSize: 15,
      color: colors.danger,
    },
    deleteHint: {
      ...font('regular'),
      fontSize: 12,
      color: colors.textSecondary,
    },
    categoryWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    favoriteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      marginTop: spacing.xs,
    },
    favoriteLabel: {
      ...typography.body,
    },
  });
