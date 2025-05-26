import { iconesInstrumentos, instrumentosLista } from '@/constants/instrumentos';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Modalize } from 'react-native-modalize';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  instrumento?: string;
};

export default function Profile() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [instrumento, setInstrumento] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const modalRef = useRef<Modalize>(null);
  const editarPerfilRef = useRef<Modalize>(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      if (parent) {
        parent.setOptions({
          tabBarStyle: modalOpen || editarPerfilOpen ? { display: 'none' } : undefined,
        });
      }
    }, [modalOpen, editarPerfilOpen])
  );

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'A app precisa de acesso às fotos.');
      }
    })();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      setUserInfo({
        id: user.id,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        role: user.user_metadata?.role || '',
        image: user.user_metadata?.image || '',
        instrumento: user.user_metadata?.instrumento || '',
      });
      setInstrumento(user.user_metadata?.instrumento || '');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível obter os dados do utilizador.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Terminar sessão', 'Tens a certeza que queres sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      await uploadImage(image.uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const contentType = blob.type;
      const filename = `${user.id}_${Date.now()}.jpg`;
      const filePath = filename; 


      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert("Erro", "Erro ao enviar imagem para o Supabase.");
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicURL = urlData?.publicUrl;
      console.log("Public URL:", publicURL);


      if (!publicURL) {
        Alert.alert("Erro", "Não foi possível obter o URL da imagem.");
        return;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, image: publicURL },
      });

      if (metadataError) {
        Alert.alert("Erro", "Erro ao atualizar os dados do utilizador.");
      } else {
        setUserInfo((prev) => prev ? { ...prev, image: publicURL } : null);
        await fetchUserInfo(); // força atualização completa

        Alert.alert("Sucesso", "Foto de perfil atualizada!");
      }
    } catch (err: any) {
      Alert.alert("Erro inesperado", err.message || "Erro ao atualizar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSelecionarInstrumento = async (inst: string) => {
    setInstrumento(inst);
    modalRef.current?.close();

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    await supabase.auth.updateUser({
      data: { ...user.user_metadata, instrumento: inst },
    });

    setUserInfo((prev) => (prev ? { ...prev, instrumento: inst } : null));
  };

  const handleGuardarAlteracoes = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user || !userInfo) return;

    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        name: userInfo.name,
        instrumento: instrumento,
      },
    });

    Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    editarPerfilRef.current?.close();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <Animatable.View animation="fadeInUp" duration={1000} style={{ padding: 1, flex: 1 }}>
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} layout={SlideInUp} style={styles.logoutButtonContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={25} color="#ff6b6b" />
          </TouchableOpacity>
        </Animated.View>

        <Modalize
          ref={editarPerfilRef}
          adjustToContentHeight={false}
          snapPoint={500}
          closeOnOverlayTap
          onOpen={() => setEditarPerfilOpen(true)}
          onClosed={() => setEditarPerfilOpen(false)}
          modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}
          withReactModal
        >
          <TouchableOpacity onPress={() => editarPerfilRef.current?.close()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Editar Perfil</Text>
          <Text style={{ marginBottom: 4 }}>Nome:</Text>
          <TextInput
            value={userInfo?.name}
            onChangeText={(text) => setUserInfo((prev) => (prev ? { ...prev, name: text } : null))}
            style={styles.input}
          />

          <TouchableOpacity onPress={handleGuardarAlteracoes} style={[styles.button, { backgroundColor: '#0e5cb3' }]}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Guardar alterações</Text>
          </TouchableOpacity>
        </Modalize>

        <Modalize
          ref={modalRef}
          adjustToContentHeight
          closeOnOverlayTap={false}
          panGestureEnabled={false}
          withReactModal
          handleStyle={{ backgroundColor: '#ccc' }}
          modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          scrollViewProps={{ bounces: false }}
          onOpen={() => setModalOpen(true)}
          onClosed={() => setModalOpen(false)}
        >
          <View style={{ padding: 24 }}>
            <TouchableOpacity onPress={() => modalRef.current?.close()} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              Seleciona o teu instrumento
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {instrumentosLista.map((inst) => {
                const icon = iconesInstrumentos[inst] || { name: 'music-note', color: '#adb5bd' };
                const isSelected = instrumento === inst;

                return (
                  <TouchableOpacity
                    key={inst}
                    onPress={() => handleSelecionarInstrumento(inst)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#dee2e6',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons
                        name={icon.name}
                        color={icon.color}
                        size={20}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={{ fontSize: 16 }}>{inst}</Text>
                    </View>
                    {isSelected && <MaterialCommunityIcons name="check" size={18} color="#40c057" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modalize>

        <Animated.View entering={FadeIn.duration(400)} layout={SlideInUp} style={{ alignItems: 'center', paddingTop: 50 }}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            
            <View>
              
              <Image
                source={
                  userInfo?.image && userInfo.image.startsWith('http')
                    ? { uri: userInfo.image }
                    : require('@/assets/images/default-avatar.png')
                }
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  borderWidth: 2,
                  borderColor: '#dee2e6',
                }}
              />
              {uploading && (
                <ActivityIndicator
                  style={{ position: 'absolute', top: 45, left: 45 }}
                  size="large"
                  color="#495057"
                />
              )}
            </View>
          </TouchableOpacity>
          <Text style={{ marginTop: 12, color: '#6c757d', fontSize: 14 }}>
            {uploading ? 'A atualizar...' : 'Toque para mudar a foto de perfil'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(100)} layout={SlideInUp.delay(100)} style={{ flex: 1, alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '600', color: '#212529', marginBottom: 8 }}>
            {userInfo?.name}
          </Text>
          <Text style={{ fontSize: 16, color: '#495057', marginBottom: 12 }}>
            {userInfo?.email}
          </Text>

          <TouchableOpacity
            onPress={() => editarPerfilRef.current?.open()}
            style={[styles.button, { backgroundColor: '#0e5cb3', marginBottom: 20 }]}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Editar perfil</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#ced4da',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#fff',
              }}
            >
              {instrumento && (
                <MaterialCommunityIcons
                  name={iconesInstrumentos[instrumento]?.name || 'music-note'}
                  size={20}
                  color={iconesInstrumentos[instrumento]?.color || '#495057'}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={{ fontSize: 16, color: instrumento ? '#212529' : '#adb5bd' }}>
                {instrumento || 'Escolhe um instrumento...'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => modalRef.current?.open()}
              style={{
                marginLeft: 10,
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#e9ecef',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#495057" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animatable.View>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  logoutButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'center',
    justifyContent: 'center',
  },
});
