import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Modalize } from 'react-native-modalize';


const extrairVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w\-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const Repertorio = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  const modalCriarRef = useRef<Modalize>(null);

  const [tituloNovo, setTituloNovo] = useState('');
  const [autorNovo, setAutorNovo] = useState('');
  const [linkNovo, setLinkNovo] = useState('');


  const modalDetalhesRef = useRef<Modalize>(null);
  const modalEditarRef = useRef<Modalize>(null);
  const [pdfSelecionado, setPdfSelecionado] = useState<any | null>(null);

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
    const { data, error } = await supabase
      .from('pdfs_info')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPdfs(data || []);
    setLoadingPdfs(false);
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleOpenPDF = async (url: string) => {
    try {
      const nomeFicheiro = url.split('/').pop() || 'ficheiro.pdf';
      const destino = FileSystem.documentDirectory + nomeFicheiro;
      const download = await FileSystem.downloadAsync(url, destino);
      await Sharing.shareAsync(download.uri);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o ficheiro.');
    }
  };

  const handleOpenVideo = (link: string) => {
    if (link) Linking.openURL(link);
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

  const abrirModalDetalhes = (item: any) => {
    modalEditarRef.current?.close();
    setPdfSelecionado(item);
    modalDetalhesRef.current?.open();
  };

  const abrirModalEditar = (item: any) => {
    setIdParaEditar(item.id);
    setTituloParaEditar(item.titulo);
    setLinkParaEditar(item.link);

    setTimeout(() => {
      modalEditarRef.current?.open();
    }, 300);
  };


    if (!session || !session.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>A carregar sessão...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <View style={{ padding: 20, flex: 1 }}>
        
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0e5cb3' }}>
            📚 Repertório
          </Text>

          <TouchableOpacity
            onPress={() => modalCriarRef.current?.open()}
            style={{
              backgroundColor: '#0e5cb3',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}> + Novo</Text>
          </TouchableOpacity>
        </View>


        <TextInput
          placeholder="Pesquisar PDF..."
          placeholderTextColor="#ccc"
          value={termoPesquisa}
          onChangeText={setTermoPesquisa}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 12,
            marginTop: 20,
            color: 'black',
            backgroundColor: 'white',
          }}
        />

        {loadingPdfs ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={pdfs.filter(item =>
              (item.titulo || item.nome).toLowerCase().includes(termoPesquisa.toLowerCase())
            )}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => abrirModalDetalhes(item)}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderColor: '#ccc',
                }}
              >
                <Text style={{ fontSize: 16, color: '#0e5cb3' }}>
                  {item.titulo || item.nome}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* MODAL DETALHES */}
      <Modalize
        ref={modalDetalhesRef}
        adjustToContentHeight={false}
        snapPoint={500}
        handleStyle={{ backgroundColor: '#ccc' }}
        modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        withReactModal
        onClosed={() => setPdfSelecionado(null)}
      >
        <View style={{ padding: 24, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => modalDetalhesRef.current?.close()}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: '#ddd',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>✕</Text>
          </TouchableOpacity>

          {pdfSelecionado && (
            <>
              <View style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {pdfSelecionado.titulo || pdfSelecionado.nome}
                </Text>
              </View>

              {extrairVideoId(pdfSelecionado.link || '') && (
                <TouchableOpacity onPress={() => handleOpenVideo(pdfSelecionado.link)}>
                  <Image
                    source={{
                      uri: `https://img.youtube.com/vi/${extrairVideoId(pdfSelecionado.link)}/hqdefault.jpg`,
                    }}
                    style={{
                      width: 260,
                      height: 150,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  />
                  <Text style={{ color: '#0e5cb3', marginTop: 4 }}>Ver Vídeo</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handleOpenPDF(pdfSelecionado.url)}
                style={{
                  backgroundColor: '#0e5cb3',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 16,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white' }}>Abrir PDF</Text>
              </TouchableOpacity>

              {role === 'admin' && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      modalDetalhesRef.current?.close();
                      abrirModalEditar(pdfSelecionado);
                    }}
                    style={{
                      backgroundColor: 'orange',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      modalDetalhesRef.current?.close();
                      handleDeletePDF(pdfSelecionado.id, pdfSelecionado.nome);
                    }}
                    style={{
                      backgroundColor: 'red',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Remover</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </Modalize>

      {/* MODAL EDITAR */}
      <Modalize
        ref={modalEditarRef}
        adjustToContentHeight={false}
        snapPoint={400}
        handleStyle={{ backgroundColor: '#ccc' }}
        modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        withReactModal
        onClosed={() => {
          setIdParaEditar(null);
          setTituloParaEditar('');
          setLinkParaEditar('');
        }}
      >
        <View style={{ padding: 24 }}>
          <TouchableOpacity
            onPress={() => modalEditarRef.current?.close()}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: '#ddd',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>✕</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
            Editar PDF
          </Text>

          <TextInput
            placeholder="Novo título"
            value={tituloParaEditar}
            onChangeText={setTituloParaEditar}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              padding: 10,
              marginBottom: 12,
            }}
          />

          <TextInput
            placeholder="Novo link YouTube"
            value={linkParaEditar}
            onChangeText={setLinkParaEditar}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              padding: 10,
              marginBottom: 20,
            }}
          />

          <TouchableOpacity
            onPress={async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'application/pdf',
                  copyToCacheDirectory: true,
                });

                if (result.canceled || !result.assets || result.assets.length === 0) return;

                const file = result.assets[0];
                const fileName = `${Date.now()}_${file.name}`;

                const response = await fetch(file.uri);
                const blob = await response.blob();

                const { error: uploadError } = await supabase.storage
                  .from('repertorio')
                  .upload(`pdfs/${fileName}`, blob);

                if (uploadError) {
                  Alert.alert('Erro', 'Erro ao enviar o PDF.');
                  return;
                }

                const { data: urlData } = supabase.storage
                  .from('repertorio')
                  .getPublicUrl(`pdfs/${fileName}`);

                const publicUrl = urlData.publicUrl;

                await supabase
                  .from('pdfs_info')
                  .update({
                    titulo: tituloParaEditar.trim() || null,
                    link: linkParaEditar.trim() || null,
                    nome: fileName,
                    url: publicUrl,
                  })
                  .eq('id', idParaEditar);

                modalEditarRef.current?.close();
                fetchPDFs();
              } catch (error) {
                console.error('Erro ao substituir PDF:', error);
                Alert.alert('Erro inesperado', 'Não foi possível substituir o ficheiro.');
              }
            }}
            style={{
              backgroundColor: '#0e5cb3',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white' }}>Substituir PDF</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      <Modalize
          ref={modalCriarRef}
          adjustToContentHeight = {false}
          snapPoint={700}
          handleStyle={{ backgroundColor: '#ccc' }}
          modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          withReactModal
          onClosed={() => {
            setTituloNovo('');
            setAutorNovo('');
            setLinkNovo('');
          }}
        >
          <View style={{ padding: 24 }}>
            <TouchableOpacity
              onPress={() => modalCriarRef.current?.close()}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: '#ddd',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 16 }}>✕</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
              Adicionar nova obra
            </Text>

            <TextInput
              placeholder="Título da obra"
              placeholderTextColor={'#ccc'}
              value={tituloNovo}
              onChangeText={setTituloNovo}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',               
                borderRadius: 6,
                padding: 10,
                marginBottom: 12,
              }}
            />

            <TextInput
              placeholder="Autor"
              placeholderTextColor={'#ccc'}
              value={autorNovo}
              onChangeText={setAutorNovo}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
                padding: 10,
                marginBottom: 12,
              }}
            />

            <TextInput
              placeholder="Link do YouTube (opcional)"
              placeholderTextColor={'#ccc'}
              value={linkNovo}
              onChangeText={setLinkNovo}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
                padding: 10,
                marginBottom: 20,
              }}
            />

            <TouchableOpacity
              onPress={async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: 'application/pdf',
                    copyToCacheDirectory: true,
                  });

                  if (result.canceled || !result.assets || result.assets.length === 0) return;

                  const file = result.assets[0];
                  const fileName = `${Date.now()}_${file.name}`;

                  const response = await fetch(file.uri);
                  const blob = await response.blob();

                  const { error: uploadError } = await supabase.storage
                    .from('repertorio')
                    .upload(`pdfs/${fileName}`, blob);

                  if (uploadError) {
                    Alert.alert('Erro', 'Erro ao enviar o PDF.');
                    return;
                  }

                  const { data: urlData } = supabase.storage
                    .from('repertorio')
                    .getPublicUrl(`pdfs/${fileName}`);

                  const publicUrl = urlData.publicUrl;

                  await supabase
                    .from('pdfs_info')
                    .insert({
                      titulo: tituloNovo.trim(),
                      autor: autorNovo.trim(),
                      link: linkNovo.trim() || null,
                      nome: fileName,
                      url: publicUrl,
                      user_id: session.user.id,
                    });

                  modalCriarRef.current?.close();
                  fetchPDFs();
                } catch (error) {
                  console.error('Erro ao adicionar obra:', error);
                  Alert.alert('Erro', 'Não foi possível adicionar a obra.');
                }
              }}
              style={{
                backgroundColor: '#0e5cb3',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white' }}>Carregar PDF e guardar</Text>
            </TouchableOpacity>
          </View>
        </Modalize>

    </SafeAreaView>
  );
};

export default Repertorio;

