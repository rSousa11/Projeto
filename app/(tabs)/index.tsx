import { iconesInstrumentos } from '@/constants/instrumentos';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface UserItem {
  id: string;
  name: string;
  email: string;
  image?: string;
  instrumento?: string; 
}

export default function Home() {
  const [members, setMembers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const modalRef = useRef<Modalize>(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, image, instrumento') 
      .order('name', { ascending: true });

    if (error) {
      Alert.alert('Erro', 'Não foi possível obter a lista de membros.');
      console.error(error);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const openModal = (user: UserItem) => {
    setSelectedUser(user);
    modalRef.current?.open();
  };

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      if (parent) {
        parent.setOptions({
          tabBarStyle: modalOpen
            ? { display: 'none' }
            : {
                backgroundColor: '#0F0D23',
                borderRadius: 50,
                marginHorizontal: 10,
                marginBottom: 50,
                height: 70,
                position: 'absolute',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#0F0D23',
              },
        });
      }
    }, [modalOpen])
  );

  const renderItem = ({ item }: { item: UserItem }) => {
  const instrumentoInfo = item.instrumento
    ? iconesInstrumentos[item.instrumento] || { name: 'music-note', color: '#495057' }
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <Image
        source={{
          uri: item.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name),
        }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>

        {item.instrumento && instrumentoInfo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <MaterialCommunityIcons
              name={instrumentoInfo.name}
              size={18}
              color={instrumentoInfo.color}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.instrumento}>{item.instrumento}</Text>
          </View>
        )}

        
      </View>
    </TouchableOpacity>
  );
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membros Registados</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <Modalize
        ref={modalRef}
        adjustToContentHeight
        handleStyle={{ backgroundColor: '#ccc' }}
        modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        onOpen={() => setModalOpen(true)}
        onClosed={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        withReactModal
      >
        <View style={{ padding: 24, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => modalRef.current?.close()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Image
            source={{
              uri:
                selectedUser?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser?.name || '')}`,
            }}
            style={styles.modalAvatar}
          />
          <Text style={styles.modalName}>{selectedUser?.name}</Text>
          <Text style={styles.modalEmail}>{selectedUser?.email}</Text>

          {/* 👇 Mostra o instrumento se existir */}
          {selectedUser?.instrumento && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
              <MaterialCommunityIcons
                name={iconesInstrumentos[selectedUser.instrumento]?.name || 'music-note'}
                color={iconesInstrumentos[selectedUser.instrumento]?.color || '#495057'}
                size={24}
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 16, color: '#333' }}>
                {selectedUser.instrumento}
              </Text>
            </View>
          )}
        </View>
      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  instrumento: {
    fontSize: 14,
    color: '#444',
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: '#ddd',
    borderWidth: 2,
    borderColor: '#007bff',
  },
  modalName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
    marginTop: 24,
  },
  modalEmail: {
    fontSize: 16,
    color: '#666',
  },
});
