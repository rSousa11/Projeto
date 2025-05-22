import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as Clipboard from 'expo-clipboard';
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

  const [nomePdfNovo, setNomePdfNovo] = useState('');
  const [urlPdfNovo, setUrlPdfNovo] = useState('');


  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  const modalCriarRef = useRef<Modalize>(null);

  const [tituloNovo, setTituloNovo] = useState('');
  const [autorNovo, setAutorNovo] = useState('');
  const [linkNovo, setLinkNovo] = useState('');
  const [autorParaEditar, setAutorParaEditar] = useState('');
  const [nomeAtual, setNomeAtual] = useState('');
  const [urlAtual, setUrlAtual] = useState('');

  const [avaliacoes, setAvaliacoes] = useState<Record<string, number>>({});

 


  const modalAvaliarRef = useRef<Modalize>(null);
  const [pdfParaAvaliar, setPdfParaAvaliar] = useState<any | null>(null);

  const [classificacaoTemp, setClassificacaoTemp] = useState<number | null>(null);


  const [estado, setEstado] = useState(false);

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
  
  
  const abrirModalAvaliar = (item: any) => {
    setPdfParaAvaliar(item);
    setClassificacaoTemp(avaliacoes[item.id] || null);
    setTimeout(() => {
      modalAvaliarRef.current?.open();
    }, 200);
  };


  const abrirModalDetalhes = (item: any) => {
    modalEditarRef.current?.close();
    setPdfSelecionado(item);

    // Espera um pouco para garantir que o estado foi atualizado
    setTimeout(() => {
      modalDetalhesRef.current?.open();
    }, 100); // 100ms é suficiente para o React atualizar o estado
  };


  const abrirModalEditar = (item: any) => {
    setIdParaEditar(item.id);
    setTituloParaEditar(item.titulo);
    setAutorParaEditar(item.autor || '');
    setLinkParaEditar(item.link);
    setNomeAtual(item.nome);     // novo
    setUrlAtual(item.url);       // novo

    

    setTimeout(() => {
      modalEditarRef.current?.open();
    }, 300);
  };


  useEffect(() => {
    if (session?.user) {
      fetchAvaliacoes();
    }
  }, [session]);

  if (!session || !session.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>A carregar sessão...</Text>
      </SafeAreaView>
    );
  }

  const fetchAvaliacoes = async () => {
    const { data, error } = await supabase
      .from('avaliacoes_obras')
      .select('pdf_id, classificacao')
      .eq('user_id', session.user.id);

    if (!error && data) {
      const map: Record<string, number> = {};

      data.forEach(({ pdf_id, classificacao }) => {
        map[pdf_id] = classificacao;
      });
      setAvaliacoes(map);
    }
  };

  const avaliarObra = async (pdf_id: number, classificacao: number) => {
    try {
      const { error } = await supabase
        .from('avaliacoes_obras')
        .upsert(
          [
            {
              user_id: session?.user.id,
              pdf_id,
              classificacao,
            },
          ],
          {
            onConflict: 'user_id, pdf_id', 
          }
        );

      if (error) {
        console.error('Erro no upsert:', error);
        Alert.alert('Erro', 'Não foi possível guardar a avaliação.');
      } else {
        setAvaliacoes((prev) => ({ ...prev, [pdf_id]: classificacao }));
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    }
  };

  
  






  



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <View style={{ padding: 20, flex: 1 }}>
        
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0e5cb3' }}>
            📚 Repertório
          </Text>

          {role === 'admin' && (
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
          )}
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
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 21, fontWeight: 'bold', color: '#0e5cb3' }}>
                    {item.titulo || item.nome}
                  </Text>
                  {item.autor ? (
                    <Text style={{ fontSize: 14, color: '#555', marginTop:5 }}>{item.autor}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => abrirModalAvaliar(item)}
                  style={{
                    marginLeft: 8,
                    backgroundColor: '#f1f1f1',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#e1a100', fontSize: 16 }}>
                    ⭐ {avaliacoes[item.id] || 0}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}

          />
        )}
      </View>



      {/* MODAL DETALHES */}
      {pdfSelecionado && (
        <Modalize
          ref={modalDetalhesRef}
          adjustToContentHeight={false}
          snapPoint={500}
          handleStyle={{ backgroundColor: '#ccc' }}
          modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          withReactModal
          onClosed={() => setPdfSelecionado(null)}
        >
          <View style={{ padding: 24, paddingTop: 32 }}>
            {/* Cabeçalho com título, autor e botão fechar */}
            <View
              style={{
                backgroundColor: '#f1f1f1',
                padding: 16,
                borderRadius: 12,
                marginBottom: 20,
                marginRight:-10,
                marginLeft:-10,
                position: 'relative',
              }}
            >
              {/* Botão fechar */}
              <TouchableOpacity
                onPress={() => modalDetalhesRef.current?.close()}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  backgroundColor: '#ddd',
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  zIndex: 1,
                }}
              >
                <Text style={{ fontSize: 16 }}>✕</Text>
              </TouchableOpacity>

              {/* Título e autor */}
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0e5cb3', paddingRight: 32 }}>
                {pdfSelecionado.titulo || pdfSelecionado.nome}
              </Text>
              {pdfSelecionado.autor ? (
                <Text style={{ fontSize: 16, color: '#333', marginTop: 4 }}>
                  {pdfSelecionado.autor}
                </Text>
              ) : null}
            </View>

            {/* Vídeo (se existir) */}
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
                    alignSelf: 'center',
                  }}
                />
                <Text style={{ color: '#0e5cb3', textAlign: 'center', marginBottom: 16 }}>
                  Ver Vídeo
                </Text>
              </TouchableOpacity>
            )}

            {/* Botão para abrir o PDF */}
            <TouchableOpacity
              onPress={() => handleOpenPDF(pdfSelecionado.url)}
              style={{
                backgroundColor: '#0e5cb3',
                padding: 12,
                borderRadius: 8,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white' }}>Abrir PDF</Text>
            </TouchableOpacity>

            {/* Botões de admin */}
            {role === 'admin' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, justifyContent: 'center' }}>
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
          </View>
        </Modalize>
      )}





      {/* MODAL EDITAR */}
      <Modalize
        ref={modalEditarRef}
        adjustToContentHeight={false}
        snapPoint={600}
        handleStyle={{ backgroundColor: '#ccc' }}
        modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        withReactModal
        onClosed={() => {
          setIdParaEditar(null);
          setTituloParaEditar('');
          setLinkParaEditar('');
          setNomeAtual('');
          setUrlAtual('');

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
            placeholderTextColor={'#ccc'}
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
            placeholder="Novo autor"
            placeholderTextColor={'#ccc'}
            value={autorParaEditar}
            onChangeText={setAutorParaEditar}
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
            placeholderTextColor={'#ccc'}
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

          <View
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              padding: 10,
              marginBottom: 20,
              backgroundColor: '#f1f1f1',
            }}
          >
            <Text style={{ color: '#555' }}>
              PDF atual: {nomeAtual ? nomeAtual : 'Nenhum ficheiro carregado'}
            </Text>
          </View>


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
                  Alert.alert('Erro', 'Erro ao enviar o novo PDF.');
                  return;
                }

                // Apaga o ficheiro anterior, se existir
                if (nomeAtual) {
                  await supabase.storage.from('repertorio').remove([`pdfs/${nomeAtual}`]);
                }

                const { data: urlData } = supabase.storage
                  .from('repertorio')
                  .getPublicUrl(`pdfs/${fileName}`);

                setNomeAtual(fileName);
                setUrlAtual(urlData.publicUrl);

                Alert.alert('Sucesso', 'Novo PDF carregado. Não te esqueças de guardar as alterações.');
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
              marginBottom: 12,
            }}
          >
            <Text style={{ color: 'white' }}>Inserir novo PDF</Text>
          </TouchableOpacity>

          



           

          <TouchableOpacity
            onPress={async () => {
              if (!tituloParaEditar || !tituloParaEditar.trim()) {
                Alert.alert('Erro', 'O título não pode estar vazio.');
                return;
              }

              try {
                await supabase
                  .from('pdfs_info')
                  .update({
                    titulo: tituloParaEditar.trim(),
                    link: linkParaEditar ? linkParaEditar.trim() : null,
                    nome: nomeAtual,
                    autor: autorParaEditar.trim(),
                    url: urlAtual,
                  })
                  .eq('id', idParaEditar);

                modalEditarRef.current?.close();
                fetchPDFs();
              } catch (error) {
                console.error('Erro ao guardar alterações:', error);
                Alert.alert('Erro', 'Não foi possível guardar as alterações.');
              }
            }}
            style={{
              backgroundColor: 'green',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: 'white' }}>Guardar Alterações</Text>
          </TouchableOpacity>


        </View>
      </Modalize>
      
      {/* MODAL criar novo */}
      {role === 'admin' && (
        <Modalize
          ref={modalCriarRef}
          adjustToContentHeight={false}
          snapPoint={700}
          handleStyle={{ backgroundColor: '#ccc' }}
          modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          withReactModal
          onClosed={() => {
            setTituloNovo('');
            setAutorNovo('');
            setLinkNovo('');
            setNomePdfNovo('');
            setUrlPdfNovo('');
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

            {/* Campo do link + botão Colar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TextInput
                placeholder="Link do YouTube (opcional)"
                placeholderTextColor={'#ccc'}
                value={linkNovo}
                onChangeText={setLinkNovo}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 6,
                  padding: 10,
                  marginRight: 8,
                }}
              />
              <TouchableOpacity
                onPress={async () => {
                  const texto = await Clipboard.getStringAsync();
                  setLinkNovo(texto);
                }}
                style={{
                  backgroundColor: '#0e5cb3',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 14 }}>Colar</Text>
              </TouchableOpacity>
            </View>

            {/* Botão para inserir PDF */}
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

                  setNomePdfNovo(fileName);
                  setUrlPdfNovo(urlData.publicUrl);

                  Alert.alert('Sucesso', 'PDF carregado. Agora podes guardar os dados.');
                } catch (error) {
                  console.error('Erro ao enviar PDF:', error);
                  Alert.alert('Erro', 'Não foi possível enviar o ficheiro.');
                }
              }}
              style={{
                backgroundColor: '#0e5cb3',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ color: 'white' }}>Inserir PDF</Text>
            </TouchableOpacity>

            {/* Pré-visualização do nome do PDF */}
            {nomePdfNovo ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 6,
                  padding: 10,
                  marginBottom: 12,
                  backgroundColor: '#f1f1f1',
                }}
              >
                <Text style={{ color: '#555' }}>PDF inserido: {nomePdfNovo}</Text>
              </View>
            ) : null}

            {/* Botão para guardar */}
            <TouchableOpacity
              onPress={async () => {
                if (!tituloNovo.trim() || !nomePdfNovo || !urlPdfNovo) {
                  Alert.alert('Erro', 'Preenche o título e carrega um PDF.');
                  return;
                }

                try {
                  await supabase.from('pdfs_info').insert({
                    titulo: tituloNovo.trim(),
                    autor: autorNovo.trim(),
                    link: linkNovo.trim() || null,
                    nome: nomePdfNovo,
                    url: urlPdfNovo,
                    user_id: session.user.id,
                  });

                  modalCriarRef.current?.close();
                  fetchPDFs();
                } catch (error) {
                  console.error('Erro ao guardar obra:', error);
                  Alert.alert('Erro', 'Não foi possível guardar a obra.');
                }
              }}
              style={{
                backgroundColor: 'green',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: 'white' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </Modalize>
      )}


      {/* MODAL avaliar*/}
      <Modalize
        ref={modalAvaliarRef}
        adjustToContentHeight = {false}
        snapPoint={350}
        modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        withReactModal
        onClosed={() => {
          setPdfParaAvaliar(null);
          setClassificacaoTemp(null);
        }}
      >
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 21, fontWeight: 'bold', marginBottom: 16 }}>
            Avaliar Obra
          </Text>

          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            {pdfParaAvaliar?.titulo || pdfParaAvaliar?.nome}
          </Text>

          {/* Legenda */}
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center', marginLeft:-5 }}>
            1 = Mau . 2 = Fraco . 3 = Médio . 4 = Bom . 5 = Excelente
          </Text>

          {/* Estrelas com seleção */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((estrela) => {
              const selecionado = classificacaoTemp === estrela;

              return (
                <TouchableOpacity
                  key={estrela}
                  onPress={() => setClassificacaoTemp(estrela)}
                  style={{
                    backgroundColor: selecionado ? '#e1a100' : '#f1f1f1',
                    padding: 12,
                    borderRadius: 12,
                    width: 52,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20, color: selecionado ? 'white' : '#e1a100' }}>
                    ⭐
                  </Text>
                  <Text style={{ fontSize: 14, color: selecionado ? 'white' : '#333' }}>
                    {estrela}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botão Confirmar */}
          <TouchableOpacity
            disabled={!classificacaoTemp}
            onPress={async () => {
              if (pdfParaAvaliar && classificacaoTemp) {
                await avaliarObra(pdfParaAvaliar.id, classificacaoTemp);
                modalAvaliarRef.current?.close();
              }
            }}
            style={{
              backgroundColor: classificacaoTemp ? 'green' : '#ccc',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white' }}>Confirmar Avaliação</Text>
          </TouchableOpacity>
        </View>
      </Modalize>




    </SafeAreaView>
  );
};

export default Repertorio;

