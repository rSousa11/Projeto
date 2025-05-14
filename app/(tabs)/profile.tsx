import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Se atob não estiver disponível (em Android puro), define manualmente:
const atobPolyfill = (input: string) => {
  return global.atob
    ? global.atob(input)
    : Buffer.from(input, 'base64').toString('binary');
};

const Profile = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro a carregar perfil:', error);
        } else {
          setUserInfo(data);
        }
      }

      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = uri.startsWith('file://') ? uri : `file://${uri}`;

      const base64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Criar Blob a partir do base64 usando um Data URL
      const base64DataUrl = `data:image/${fileExt};base64,${base64}`;

      const blob = await (await fetch(base64DataUrl)).blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
        .data;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userInfo.id);

      if (updateError) throw updateError;

      setUserInfo({ ...userInfo, avatar_url: publicUrl });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!userInfo) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Não foi possível carregar os dados.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <TouchableOpacity onPress={handlePickImage}>
          <Image
            source={
              userInfo.avatar_url
                ? { uri: userInfo.avatar_url }
                : require('@/assets/images/default-avatar.png')
            }
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 2,
              borderColor: '#ccc',
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <Text style={{ marginTop: 10, color: '#888' }}>
          {uploading ? 'A atualizar...' : 'Toque para mudar foto'}
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Olá, {userInfo.nome}
        </Text>
        <Text style={{ fontSize: 16 }}>Tipo de utilizador: {userInfo.role}</Text>

        <View style={{ marginTop: 32 }}>
          <Button title="Terminar sessão" onPress={handleLogout} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
