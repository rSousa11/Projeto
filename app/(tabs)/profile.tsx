import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

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

 const uploadImage = async (imageUri: string) => {
  try {
    setUploading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert("Erro", "Utilizador não autenticado.");
      return;
    }

    // Extrair extensão e forçar lowercase
    let fileExt = imageUri.split('.').pop()?.toLowerCase();

    // Lista de extensões aceites
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!fileExt || !allowedExts.includes(fileExt)) {
      Alert.alert('Erro', 'Tipo de imagem não suportado. Use JPG, PNG, GIF ou WEBP.');
      setUploading(false);
      return;
    }

    // Mapear a extensão para o mime type correto
    const mimeTypesMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    const mimeType = mimeTypesMap[fileExt] || 'image/jpeg';

    const fileName = `${user.id}.${fileExt}`;
    const filePath = fileName

    // Apagar ficheiro anterior (ignorar erros)
    await supabase.storage.from('avatars').remove([filePath]);

    // Upload diretamente pelo URI local
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, imageUri, {
        cacheControl: '3600',
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      Alert.alert('Erro ao carregar imagem', uploadError.message);
      return;
    }

    // Obter URL público
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    // Atualizar a tabela users com o link da imagem
    const { error: updateError } = await supabase
      .from('users')
      .update({ image: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      Alert.alert('Erro ao atualizar perfil', updateError.message);
      return;
    }

    setUserInfo((prev: any) => ({ ...prev, image: publicUrl }));
    console.log("Imagem atualizada com sucesso:", publicUrl);

  } catch (err: any) {
    Alert.alert('Erro', err.message);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ alignItems: 'center', paddingTop: 50 }}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
          <Image
            source={
              userInfo.image
                ? { uri: userInfo.image }
                : require('@/assets/images/default-avatar.png')
            }
            style={{
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 2,
              borderColor: '#dee2e6',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
          />
        </TouchableOpacity>
        <Text style={{ marginTop: 12, color: '#6c757d', fontSize: 14 }}>
          {uploading ? 'A atualizar...' : 'Toque para mudar a foto de perfil'}
        </Text>
      </View>

      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '600',
          color: '#212529',
          marginBottom: 8,
        }}>
          Olá, {userInfo.nome}
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#495057',
          marginBottom: 24,
        }}>
          Tipo de utilizador: {userInfo.role}
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#ff6b6b',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
            Terminar sessão
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
