import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, TextInput, Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_REQ = (lvl) => Math.floor(100 * Math.pow(1.18, lvl - 1));
const DIFF = {
  trivial: { xp: 15, gold: 8, label: 'Trivial' },
  easy:    { xp: 30, gold: 15, label: 'Easy' },
  medium:  { xp: 55, gold: 30, label: 'Medium' },
  epic:    { xp: 100, gold: 60, label: 'Epic' },
};

const STORE = [
  { id: 'sword', name: 'Sunforged Greatsword', type: 'gear', cost: 140, icon: '🗡️', desc: '+10% XP & Gold' },
  { id: 'shield', name: 'Aegis Streak Shield', type: 'pot', cost: 55, icon: '🛡️', desc: 'Protects streaks on missed days' },
  { id: 'potion', name: 'Double XP Elixir (3x)', type: 'pot', cost: 85, icon: '🧪', desc: '2x XP for next 3 habits' },
  { id: 'dragon', name: 'Crimson Drake Pet', type: 'pet', cost: 120, icon: '🐉', desc: 'Equip Dragon companion' },
];

export default function App() {
  const [tab, setTab] = useState('quests');
  const [player, setPlayer] = useState({
    name: 'Shadow Vanguard', level: 1, xp: 0, gold: 180, gems: 15,
    avatar: '⚔️', pet: '🐉', shields: 2, doubleXp: 0, bossHp: 150, bossMax: 150
  });

  const [habits, setHabits] = useState([
    { id: '1', title: 'Morning Hydration (500ml)', diff: 'easy', icon: '💧', streak: 5, done: false },
    { id: '2', title: '30-Min Cardio / Gym Workout', diff: 'epic', icon: '🏋️', streak: 3, done: false },
    { id: '3', title: 'Deep Focus Sprint (No Phone)', diff: 'medium', icon: '💻', streak: 4, done: false },
    { id: '4', title: 'Read 15 Pages of a Book', diff: 'medium', icon: '📚', streak: 2, done: false },
  ]);

  const [customRewards, setCustomRewards] = useState([
    { id: 'c1', title: '1 Hour Video Games', cost: 80, icon: '🎮' },
    { id: 'c2', title: 'Coffee / Boba Treat', cost: 110, icon: '🧋' }
  ]);

  const [modal, setModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDiff, setNewDiff] = useState('easy');

  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem('@hq_p');
        const h = await AsyncStorage.getItem('@hq_h');
        if (p) setPlayer(JSON.parse(p));
        if (h) setHabits(JSON.parse(h));
      } catch (e) {}
    })();
  }, []);

  const save = async (nextP, nextH) => {
    try {
      if (nextP) await AsyncStorage.setItem('@hq_p', JSON.stringify(nextP));
      if (nextH) await AsyncStorage.setItem('@hq_h', JSON.stringify(nextH));
    } catch (e) {}
  };

  const toggle = (id) => {
    let nextP = { ...player };
    const nextH = habits.map(h => {
      if (h.id !== id) return h;
      const done = !h.done;
      const cfg = DIFF[h.diff] || DIFF.easy;
      let earnedXP = cfg.xp * (done && nextP.doubleXp > 0 ? 2 : 1);

      if (done) {
        if (nextP.doubleXp > 0) nextP.doubleXp -= 1;
        nextP.xp += earnedXP;
        nextP.gold += cfg.gold;
        nextP.bossHp = Math.max(0, nextP.bossHp - 25);

        while (nextP.xp >= XP_REQ(nextP.level)) {
          nextP.xp -= XP_REQ(nextP.level);
          nextP.level += 1;
          nextP.gold += 75;
          nextP.gems += 2;
          Alert.alert('👑 LEVEL UP!', `Reached Level ${nextP.level}! Earned +75 Gold & +2 Gems!`);
        }
      } else {
        nextP.xp = Math.max(0, nextP.xp - earnedXP);
        nextP.gold = Math.max(0, nextP.gold - cfg.gold);
      }
      return { ...h, done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) };
    });

    setPlayer(nextP);
    setHabits(nextH);
    save(nextP, nextH);
  };

  const buy = (item) => {
    if (player.gold < item.cost) {
      Alert.alert('Need Gold', `You need ${item.cost} Gold Coins.`);
      return;
    }
    const nextP = {
      ...player,
      gold: player.gold - item.cost,
      shields: item.id === 'shield' ? player.shields + 1 : player.shields,
      doubleXp: item.id === 'potion' ? player.doubleXp + 3 : player.doubleXp,
      pet: item.type === 'pet' ? item.icon : player.pet,
      avatar: item.type === 'gear' ? item.icon : player.avatar
    };
    setPlayer(nextP);
    save(nextP, null);
    Alert.alert('Purchased! 🎉', `Equipped ${item.name}!`);
  };

  const maxXP = XP_REQ(player.level);
  const xpPct = Math.min(100, Math.floor((player.xp / maxXP) * 100));
  const bossPct = Math.min(100, Math.floor((player.bossHp / player.bossMax) * 100));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Top HUD */}
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 26 }}>{player.avatar}</Text>
            <Text style={styles.pet}>{player.pet}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{player.name} • LV {player.level}</Text>
            <Text style={styles.sub}>🛡️ {player.shields} Shields • 🧪 {player.doubleXp} 2x Buffs</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.gold}>🪙 {player.gold}</Text>
            <Text style={styles.gem}>💎 {player.gems}</Text>
          </View>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${xpPct}%` }]} />
        </View>
        <Text style={styles.xpText}>{player.xp} / {maxXP} XP</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 14 }}>
        {tab === 'quests' && (
          <View>
            <View style={styles.bossCard}>
              <Text style={{ fontSize: 28, marginRight: 10 }}>👹</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bossTitle}>Daily Boss (Complete habits to strike!)</Text>
                <View style={styles.bossBarBg}>
                  <View style={[styles.bossBarFill, { width: `${bossPct}%` }]} />
                </View>
                <Text style={styles.bossSub}>HP: {player.bossHp} / {player.bossMax}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Daily Quests</Text>
              <TouchableOpacity style={styles.btn} onPress={() => setModal(true)}>
                <Text style={styles.btnTxt}>+ New Quest</Text>
              </TouchableOpacity>
            </View>

            {habits.map(h => {
              const cfg = DIFF[h.diff] || DIFF.easy;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.card, h.done && styles.cardDone]}
                  onPress={() => toggle(h.id)}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{h.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, h.done && styles.cardTitleDone]}>{h.title}</Text>
                    <Text style={styles.cardMeta}>{cfg.label} • +${cfg.xp}XP +${cfg.gold}🪙 • 🔥 {h.streak}d</Text>
                  </View>
                  <View style={[styles.check, h.done && styles.checkDone]}>
                    <Text style={{ color: '#000', fontWeight: 'bold' }}>{h.done ? '✓' : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {tab === 'store' && (
          <View>
            <Text style={[styles.sectionTitle, { marginVertical: 10 }]}>Grand Bazaar Store</Text>
            {STORE.map(i => (
              <View key={i.id} style={styles.card}>
                <Text style={{ fontSize: 26, marginRight: 12 }}>{i.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{i.name}</Text>
                  <Text style={styles.cardMeta}>{i.desc}</Text>
                </View>
                <TouchableOpacity style={styles.goldBtn} onPress={() => buy(i)}>
                  <Text style={styles.goldBtnTxt}>🪙 {i.cost}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => setTab('quests')}><Text style={styles.navTxt}>⚔️ Quests</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('store')}><Text style={styles.navTxt}>🏪 Storefront</Text></TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Add Habit Quest</Text>
            <TextInput
              style={styles.input}
              placeholder="Habit title..."
              placeholderTextColor="#64748b"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.secBtn}>
                <Text style={styles.secBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  if (!newTitle.trim()) return;
                  const nextH = [{ id: String(Date.now()), title: newTitle.trim(), diff: newDiff, icon: '⚡', streak: 0, done: false }, ...habits];
                  setHabits(nextH);
                  save(player, nextH);
                  setNewTitle('');
                  setModal(false);
                }}
              >
                <Text style={styles.btnTxt}>Save Quest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  hud: { backgroundColor: '#111827', margin: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#1f2937' },
  hudRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#030712', borderWidth: 2, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pet: { position: 'absolute', top: -6, left: -6, fontSize: 13 },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  gold: { color: '#fbbf24', fontWeight: '800', fontSize: 13 },
  gem: { color: '#38bdf8', fontWeight: '800', fontSize: 12, marginTop: 2 },
  barBg: { height: 8, backgroundColor: '#030712', borderRadius: 4, overflow: 'hidden', marginVertical: 6 },
  barFill: { height: '100%', backgroundColor: '#6366f1' },
  xpText: { color: '#94a3b8', fontSize: 10 },
  bossCard: { backgroundColor: '#1e1b4b', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#4338ca' },
  bossTitle: { color: '#fda4af', fontSize: 12, fontWeight: '800' },
  bossBarBg: { height: 6, backgroundColor: '#030712', borderRadius: 3, overflow: 'hidden', marginVertical: 4 },
  bossBarFill: { height: '100%', backgroundColor: '#f43f5e' },
  bossSub: { color: '#cbd5e1', fontSize: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#111827', padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  cardDone: { backgroundColor: '#064e3b', borderColor: '#10b981' },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#a7f3d0' },
  cardMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#475569', alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  goldBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  goldBtnTxt: { color: '#000', fontWeight: '800', fontSize: 12 },
  nav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, backgroundColor: '#030712', borderTopWidth: 1, borderColor: '#1f2937' },
  navTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111827', padding: 20, borderRadius: 20 },
  input: { backgroundColor: '#030712', color: '#fff', padding: 12, borderRadius: 10, marginVertical: 14, borderWidth: 1, borderColor: '#374151' },
  secBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  secBtnTxt: { color: '#94a3b8', fontWeight: 'bold' }
});
