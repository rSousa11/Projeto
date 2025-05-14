import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const normalizarNomeFicheiro = (nomeOriginal: string): string => {
  return nomeOriginal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_+/g, '_');
};

const extrairVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w\-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getPublicUrl = (fileName: string): string => {
  return `https://nkorqkyiytalpxyjgbjq.supabase.co/storage/v1/object/public/repertorio/pdfs/${fileName}`;
};

const Repertorio = () => {
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [tituloPDF, setTituloPDF] = useState('');
  const [linkYoutube, setLinkYoutube] = useState('');
  const [ficheiroPDF, setFicheiroPDF] = useState<any>(null);

  const [modalEditar, setModalEditar] = useState(false);
  const [idParaEditar, setIdParaEditar] = useState<number | null>(null);
  const [linkParaEditar, setLinkParaEditar] = useState('');
  const [tituloParaEditar, setTituloParaEditar] = useState('');

  useEffect(() => {
    const loadSessionAndRole = async () => {
      const { data } = await supabase.auth.getSession();
      const sessao = data?.session;
      setSession(sessao ?? null);

      if (sessao?.user) {
        const { data: perfil } = await supabase
          .from('users')
          .select('role')
          .eq('id', sessao.user.id)
          .single();
        setRole(perfil?.role ?? null);
      }
    };

    loadSessionAndRole();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const fetchPDFs = async () => {
    setLoadingPdfs(true);
    const { data, error } = await supabase.from('pdfs_info').select('*').order('created_at', { ascending: false });
    if (!error) setPdfs(data || []);
    setLoadingPdfs(false);
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleEscolherPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setFicheiroPDF(result.assets[0]);
    }
  };

  const fecharModal = () => {
    setModalVisible(false);
    setTituloPDF('');
    setLinkYoutube('');
    setFicheiroPDF(null);
  };

  const handleUploadPDF = async () => {
    if (!ficheiroPDF) {
      Alert.alert('Erro', 'Seleciona um ficheiro PDF.');
      return;
    }

    const videoId = extrairVideoId(linkYoutube);
    if (linkYoutube.trim() && !videoId) {
      Alert.alert('Link do YouTube inválido');
      return;
    }

    try {
      setUploading(true);
      const fileName = `${Date.now()}-${normalizarNomeFicheiro(ficheiroPDF.name)}`;
      const filePath = `pdfs/${fileName}`;

      const response = await fetch(ficheiroPDF.uri);
      const blob = await response.blob();

      if (!blob.size) {
        Alert.alert('Erro', 'O ficheiro está vazio. Tente novamente.');
        return;
      }

      const { error } = await supabase.storage.from('repertorio').upload(filePath, blob, {
        contentType: 'application/pdf',
      });

      if (error) throw error;

      const publicUrl = getPublicUrl(fileName);

      await supabase.from('pdfs_info').insert([{
        nome: fileName,
        link: linkYoutube.trim() || null,
        titulo: tituloPDF.trim() || ficheiroPDF.name,
        url: publicUrl,
        user_id: session?.user.id,
      }]);

      Alert.alert('Sucesso', 'PDF carregado com sucesso!');
      fecharModal();
      fetchPDFs();
    } catch (err) {
      console.error('Erro ao carregar ficheiro:', err);
      Alert.alert('Erro', 'Falha no upload do ficheiro.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePDF = async (id: number, nome: string) => {
    Alert.alert('Apagar', 'Queres apagar este PDF?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await supabase.storage.from('repertorio').remove([`pdfs/${nome}`]);
          await supabase.from('pdfs_info').delete().eq('id', id);
          fetchPDFs();
        },
      },
    ]);
  };

  const abrirModalEditar = (id: number, link: string = '', titulo: string = '') => {
    setIdParaEditar(id);
    setLinkParaEditar(link);
    setTituloParaEditar(titulo);
    setModalEditar(true);
  };

  const confirmarEdicao = async () => {
    if (!idParaEditar) return;

    const videoId = extrairVideoId(linkParaEditar);
    if (linkParaEditar.trim() && !videoId) {
      Alert.alert('Link do YouTube inválido');
      return;
    }

    await supabase.from('pdfs_info')
      .update({
        link: linkParaEditar.trim() || null,
        titulo: tituloParaEditar.trim() || null,
      })
      .eq('id', idParaEditar);

    setModalEditar(false);
    fetchPDFs();
  };

  const handleOpenPDF = async (url: string) => {
    try {
      const nomeFicheiro = url.split('/').pop() || 'ficheiro.pdf';
      const destino = FileSystem.documentDirectory + nomeFicheiro;

      const download = await FileSystem.downloadAsync(url, destino);
      await Sharing.shareAsync(download.uri);
    } catch (error) {
      console.error('Erro ao descarregar ou partilhar PDF:', error);
      Alert.alert('Erro', 'Não foi possível abrir o ficheiro PDF.');
    }
  };

  const handleOpenVideo = (link: string) => {
    if (link) Linking.openURL(link);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>📚 Repositório de PDFs</Text>

        {role === 'admin' && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#007bff',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Criar Novo</Text>
          </TouchableOpacity>
        )}

        {loadingPdfs ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={pdfs}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const videoId = extrairVideoId(item.link || '');
              const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

              return (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleOpenPDF(item.url)} style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{
                        fontSize: 16,
                        textDecorationLine: 'underline',
                        color: '#2980b9',
                      }}>
                        {item.titulo || item.nome}
                      </Text>
                    </TouchableOpacity>

                    {thumbnail && (
                      <TouchableOpacity onPress={() => handleOpenVideo(item.link)}>
                        <Image source={{ uri: thumbnail }} style={{
                          width: 100, height: 60,
                          borderRadius: 6, borderWidth: 1, borderColor: '#ccc',
                        }} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {role === 'admin' && (
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 12,
                      marginTop: 10,
                    }}>
                      <TouchableOpacity
                        onPress={() => abrirModalEditar(item.id, item.link, item.titulo)}
                        style={{
                          backgroundColor: '#f1c40f',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: 'white' }}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePDF(item.id, item.nome)}
                        style={{
                          backgroundColor: '#e74c3c',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: 'white' }}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* MODAL CRIAR NOVO */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 20,
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
                Novo PDF
              </Text>

              <TextInput
                placeholder="Título"
                value={tituloPDF}
                onChangeText={setTituloPDF}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 10 }}
              />

              <TextInput
                placeholder="Link do YouTube (opcional)"
                value={linkYoutube}
                onChangeText={setLinkYoutube}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 10 }}
              />

              <TouchableOpacity
                onPress={handleEscolherPDF}
                style={{
                  backgroundColor: '#2980b9',
                  padding: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: 'white' }}>{ficheiroPDF ? ficheiroPDF.name : 'Selecionar PDF'}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setTituloPDF('');
                    setLinkYoutube('');
                    setFicheiroPDF(null);
                  }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ccc', borderRadius: 6,
                  }}
                >
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUploadPDF}
                  disabled={uploading}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: uploading ? '#95a5a6' : '#007bff',
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: 'white' }}>{uploading ? 'A enviar...' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL EDITAR */}
        <Modal visible={modalEditar} transparent animationType="slide">
          <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 20,
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
                Editar título e link
              </Text>

              <TextInput
                placeholder="Novo título"
                value={tituloParaEditar}
                onChangeText={setTituloParaEditar}
                style={{
                  borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 12,
                }}
              />

              <TextInput
                placeholder="Novo link YouTube"
                value={linkParaEditar}
                onChangeText={setLinkParaEditar}
                style={{
                  borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 12,
                }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setModalEditar(false)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ccc', borderRadius: 6,
                  }}
                >
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmarEdicao}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#27ae60', borderRadius: 6,
                  }}
                >
                  <Text style={{ color: 'white' }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Repertorio;
