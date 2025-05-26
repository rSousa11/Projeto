import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Modalize } from 'react-native-modalize';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';



const Calendario = () => {
  const [eventosMarcados, setEventosMarcados] = useState<Record<string, any>>({});
  const [eventosLista, setEventosLista] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [eventoEmEdicao, setEventoEmEdicao] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const modalizeRef = useRef<Modalize>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigation = useNavigation();

  const [presencasEventoSelecionado, setPresencasEventoSelecionado] = useState<any[]>([]);
  const [presencasUtilizador, setPresencasUtilizador] = useState<Record<string, string>>({});
  const [loadingPresencas, setLoadingPresencas] = useState(false);

  const [dataEvento, setDataEvento] = useState(new Date());
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  


  const eventosDoDia = eventosLista.filter(ev => ev.data?.slice(0, 10) === selectedDate);
  const hoje = new Date().toISOString().slice(0, 10);
  const eventosFuturos = eventosLista
    .filter(ev => ev.data?.slice(0, 10) > hoje)
    .sort((a, b) => a.data.localeCompare(b.data));


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

  useEffect(() => {
    verificarSeEAdmin();
    fetchEventos();

    const subscription = supabase
      .channel('public:eventos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, fetchEventos)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const verificarSeEAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.role === 'admin') setIsAdmin(true);
  };

  const fetchEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('eventos').select('*');

    if (!error && data) {
      const marcados: Record<string, any> = {};
      data.forEach(ev => {
        marcados[ev.data?.slice(0, 10)] = {
          marked: true,
          dots: [{ key: 'evento', color: 'red', selectedDotColor: 'red' }]
        };

      });
      setEventosMarcados(marcados);
      setEventosLista(data);
    }
    setLoading(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: respostas } = await supabase
        .from('presencas')
        .select('evento_id, resposta')
        .eq('user_id', user.id);

      const mapa: Record<string, string> = {};
      respostas?.forEach((r) => {
        mapa[r.evento_id] = r.resposta;
      });
      setPresencasUtilizador(mapa);
    }
  };

  const guardarPresencaInline = async (eventoId: string, resposta: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    const nome = perfil?.name ?? 'Sem nome';

    const existente = presencasUtilizador[eventoId];
    if (existente) {
      await supabase
        .from('presencas')
        .update({ resposta, user_name: nome })
        .eq('user_id', user.id)
        .eq('evento_id', eventoId);
    } else {
      await supabase.from('presencas').insert([{
        user_id: user.id,
        evento_id: eventoId,
        resposta,
        user_name: nome
      }]);
    }

    setPresencasUtilizador(prev => ({ ...prev, [eventoId]: resposta }));
  };

  const abrirModalDetalhes = async (eventoId: string) => {
    setLoadingPresencas(true);
    modalizeRef.current?.open();
    const { data } = await supabase
      .from('presencas')
      .select('user_name, resposta')
      .eq('evento_id', eventoId);
    setPresencasEventoSelecionado(data || []);
    setLoadingPresencas(false);
  };

  const adicionarEvento = async () => {
    if (!titulo || !dataEvento) return;
    const dataFormatada = dataEvento.toISOString().slice(0, 10);
    const { error } = await supabase.from('eventos').insert([{ titulo, data: dataFormatada }]);
    if (!error) {
      setTitulo('');
      setDataEvento(new Date());
      setShowAddModal(false);
      fetchEventos();
    }
  };


  const removerEvento = async (id: string) => {
    Alert.alert(
      'Confirmar remoção',
      'Tem a certeza que deseja remover este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('eventos').delete().eq('id', id);
            fetchEventos();
          }
        }
      ]
    );
  };
  const formatarData = (dataISO: string) => {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };



  const iniciarEdicao = (evento: any) => {
    setTitulo(evento.titulo);
    setSelectedDate(evento.data?.slice(0, 10));
    setEventoEmEdicao(evento);
    setShowEditModal(true);
  };

  const guardarEdicao = async () => {
    if (!titulo || !selectedDate || !eventoEmEdicao) return;
    await supabase
      .from('eventos')
      .update({ titulo, data: selectedDate })
      .eq('id', eventoEmEdicao.id);
    setShowEditModal(false);
    setEventoEmEdicao(null);
    setTitulo('');
    fetchEventos();
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Animatable.View
              animation="fadeInUp"
              duration={1000}
              style={{ padding: 1, flex: 1 }}
            >

        <KeyboardAwareScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 80,  }}
          extraScrollHeight={40}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0e5cb3' }}>
              Calendário FRC
            </Text>

            {isAdmin && (
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                  backgroundColor: '#0e5cb3',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>+ Evento</Text>
              </TouchableOpacity>
            )}
          </View>

          <ImageBackground
              source={require('../../assets/images/frc.png')}
              resizeMode="cover"
              style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}
            >
              {/* transparencia do logo da frc */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: 10 }}>
                
                
                <Calendar
                  markingType="multi-dot"
                  onDayPress={day => setSelectedDate(day.dateString)}
                  markedDates={{
                    ...eventosMarcados,
                    [selectedDate]: {
                      ...(eventosMarcados[selectedDate] || {}),
                      selected: true,
                      selectedColor: '#0e5cb3',
                    },
                  }}
                  style={{ backgroundColor: 'transparent' }}
                  theme={{
                    calendarBackground: 'transparent',
                    arrowColor: '#0e5cb3',
                    textSectionTitleColor: '#444',
                    dayTextColor: '#000',
                    todayTextColor: '#40afd2',
                    selectedDayTextColor: '#fff',
                    selectedDayBackgroundColor: '#0e5cb3',
                  }}
                />

              </View>
            </ImageBackground>



          <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 16, color: '#555' }}>
            Data selecionada: {selectedDate ? formatarData(selectedDate) : 'Nenhuma'}
          </Text>

          {selectedDate && (
            <>
              <Text style={{ fontSize: 20, marginTop: 20, fontWeight: 'bold', color: '#0e5cb3' }}>
                Eventos neste dia:
              </Text>
              {eventosDoDia.length === 0 ? (
                <Text style={{ marginTop: 5, color: '#aaa' }}>Nenhum evento.</Text>
              ) : (
                eventosDoDia.map((item) => (
                  <View key={item.id} style={styles.eventRow}>
                    <Text style={styles.eventTitle}>{item.titulo}</Text>

                    <View style={styles.eventActions}>
                      {/* Só mostrar botões de presença se o evento for hoje ou no futuro */}
                      {item.data?.slice(0, 10) >= hoje && (
                        <>
                          <TouchableOpacity
                            onPress={() => guardarPresencaInline(item.id, 'sim')}
                            style={[styles.presencaButton, {
                              backgroundColor: presencasUtilizador[item.id] === 'sim' ? 'green' : '#eee'
                            }]}
                          >
                            <Text style={{ color: presencasUtilizador[item.id] === 'sim' ? 'white' : 'black' }}>Vou ✔️</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => guardarPresencaInline(item.id, 'nao')}
                            style={[styles.presencaButton, {
                              backgroundColor: presencasUtilizador[item.id] === 'nao' ? 'red' : '#eee'
                            }]}
                          >
                            <Text style={{ color: presencasUtilizador[item.id] === 'nao' ? 'white' : 'black' }}>Não Vou ❌</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      <View style={{ alignItems: 'flex-end' }}>
                        <TouchableOpacity onPress={() => abrirModalDetalhes(item.id)}>
                          <Text style={{ fontSize: 14, color: '#40afd2' }}>Mais detalhes</Text>
                        </TouchableOpacity>

                        {isAdmin && (
                          <View style={{ flexDirection: 'row', marginTop: 5 }}>
                            <TouchableOpacity onPress={() => iniciarEdicao(item)}>
                              <Text style={{ fontSize: 14, color: 'orange', marginRight: 10 }}> Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removerEvento(item.id)}>
                              <Text style={{ fontSize: 14, color: 'red' }}> Remover</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))

              )}
            </>
          )}
          
          
          {eventosFuturos.length > 0 && (
            <View style={{ marginTop: 40 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0e5cb3', marginBottom: 10 }}>
                Próximos eventos
              </Text>

              {eventosFuturos.map((item) => (
                <View key={item.id} style={styles.eventRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{item.titulo}</Text>
                    <Text style={{ color: '#666' }}>
                      {formatarData(item.data?.slice(0, 10))}
                    </Text>

                  </View>

                  <TouchableOpacity onPress={() => abrirModalDetalhes(item.id)}>
                    <Text style={{ color: '#40afd2', fontSize: 14 }}>Mais detalhes</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}


          
        </KeyboardAwareScrollView>

        {/* Modal Editar Evento */}
        <Modal visible={showEditModal} animationType="slide" transparent>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Editar Evento</Text>
              <TextInput
                placeholder="Nome do evento"
                placeholderTextColor="#aaa"
                value={titulo}
                onChangeText={setTitulo}
                style={styles.inputStyle}
              />
              <ModalButtons
                onCancel={() => setShowEditModal(false)}
                onConfirm={guardarEdicao}
                confirmText="Guardar"
              />
            </View>
          </View>
        </Modal>

        {/* Modal Adicionar Evento */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Adicionar Evento</Text>

              <TextInput
                placeholder="Nome do evento"
                placeholderTextColor="#aaa"
                value={titulo}
                onChangeText={setTitulo}
                style={styles.inputStyle}
              />

              <TouchableOpacity
                  onPress={() => {
                    setTimeout(() => setMostrarDatePicker(true), 100);
                  }}
                  style={[styles.inputStyle, { marginTop: 10 }]}
                >
                  <Text style={{ color: '#000' }}>
                    {formatarData(dataEvento.toISOString().slice(0, 10))}
                  </Text>
                </TouchableOpacity>

                {mostrarDatePicker && (
                  <DateTimePicker
                    value={dataEvento}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setMostrarDatePicker(false);
                      if (selectedDate) setDataEvento(selectedDate);
                    }}
                  />
                )}


              <ModalButtons
                onCancel={() => setShowAddModal(false)}
                onConfirm={adicionarEvento}
                confirmText="Criar"
              />
            </View>
          </View>
        </Modal>



        {/* Modalize - Lista de presenças */}
        <Modalize
          ref={modalizeRef}
          snapPoint={500}
          adjustToContentHeight = {false}
          handleStyle={{ backgroundColor: '#ccc' }}
          modalStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          onOpen={() => setModalOpen(true)}
          onClosed={() => setModalOpen(false)}
          withReactModal
        >
          <View style={{ padding: 24 }}>
            <TouchableOpacity onPress={() => modalizeRef.current?.close()} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 50, textAlign: 'center', marginTop: 20 }}>
              Lista de presenças
            </Text>

            {loadingPresencas ? (
              <ActivityIndicator size="small" />
            ) : presencasEventoSelecionado.length === 0 ? (
              <Text style={{ color: '#999', textAlign: 'center' }}>Nenhuma presença registada.</Text>
            ) : (
              presencasEventoSelecionado.map((p, index) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>{p.user_name}</Text>
                  <Text style={{ color: p.resposta === 'sim' ? 'green' : 'red' }}>
                    {p.resposta === 'sim' ? 'Vai ✔️' : 'Não Vai ❌'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </Modalize>
      </Animatable.View>  
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputStyle: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f5f5f5',
    color: '#000',
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
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presencaButton: {
    padding: 6,
    borderRadius: 6,
  },
});

const ModalButtons = ({ onCancel, onConfirm, confirmText }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
    <TouchableOpacity onPress={onCancel} style={{ marginRight: 10 }}>
      <Text style={{ color: '#555' }}>Cancelar</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onConfirm}>
      <Text style={{ color: '#0e5cb3', fontWeight: 'bold' }}>{confirmText}</Text>
    </TouchableOpacity>
  </View>
);

export default Calendario;
