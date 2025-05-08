import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ADMIN_ID = 'c1cfa565-8491-4c31-9ab2-e212458a1429'; // Substituir pelo teu ID

const normalizarNomeFicheiro = (nomeOriginal: string): string => {
  return nomeOriginal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_+/g, '_');
};

const Repertorio = () => {
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [pdfs, setPdfs] = useState<{ name: string }[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error(error);
      setSession(data?.session ?? null);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const fetchPDFs = async () => {
    setLoadingPdfs(true);
    const { data, error } = await supabase.storage.from('repertorio').list('pdfs', {
      limit: 100,
    });

    if (error) {
      console.error('Erro ao buscar PDFs:', error);
    } else {
      setPdfs(data || []);
    }

    setLoadingPdfs(false);
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleUploadPDF = async () => {
    if (!session || session.user.id !== ADMIN_ID) {
      Alert.alert('Apenas o administrador pode enviar PDFs.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (!result.assets || result.assets.length === 0) {
      Alert.alert('Nenhum ficheiro selecionado.');
      return;
    }

    try {
      setUploading(true);

      for (const file of result.assets) {
        const fileUri = file.uri;
        const fileName = file.name;

        if (!fileUri || !fileName) continue;

        const nomeNormalizado = normalizarNomeFicheiro(fileName);
        const filePath = `pdfs/${Date.now()}-${nomeNormalizado}`;

        const response = await fetch(fileUri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from('repertorio')
          .upload(filePath, blob, {
            contentType: 'application/pdf',
          });

        if (error) {
          console.error(`Erro ao enviar ${fileName}:`, error);
        } else {
          console.log(`Ficheiro ${fileName} enviado como ${filePath}`);
        }
      }

      Alert.alert('Sucesso', 'Ficheiros enviados com sucesso!');
      fetchPDFs();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro ao enviar ficheiros.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenPDF = async (name: string) => {
    const { data, error } = await supabase.storage
      .from('repertorio')
      .createSignedUrl(`pdfs/${name}`, 60);

    if (error || !data?.signedUrl) {
      Alert.alert('Erro', 'Não foi possível abrir o PDF.');
      return;
    }

    Linking.openURL(data.signedUrl);
  };

  const handleDeletePDF = async (name: string) => {
    if (!session || session.user.id !== ADMIN_ID) {
      Alert.alert('Apenas o administrador pode remover PDFs.');
      return;
    }

    Alert.alert(
      'Remover PDF',
      `Queres mesmo apagar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .storage
              .from('repertorio')
              .remove([`pdfs/${name}`]);

            if (error) {
              console.error('Erro ao apagar ficheiro:', error);
              Alert.alert('Erro', 'Não foi possível apagar o ficheiro.');
            } else {
              Alert.alert('Removido', 'Ficheiro apagado com sucesso.');
              fetchPDFs();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' }}>
           Repositório de Obras
        </Text>

        {uploading ? (
          <ActivityIndicator size="large" />
        ) : (
          session?.user?.id === ADMIN_ID && (
            <TouchableOpacity
              onPress={handleUploadPDF}
              style={{
                backgroundColor: '#3498db',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>+ Enviar novo PDF</Text>
            </TouchableOpacity>
          )
        )}

        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#34495e' }}>
          Obras disponíveis:
        </Text>

        {loadingPdfs ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={pdfs}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleOpenPDF(item.name)}
                >
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 16, color: '#2c3e50' }}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>

                {session?.user?.id === ADMIN_ID && (
                  <TouchableOpacity
                    onPress={() => handleDeletePDF(item.name)}
                    style={{
                      marginLeft: 12,
                      backgroundColor: '#e74c3c',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '500' }}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Repertorio;
