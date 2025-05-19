import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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

  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [respostaAtual, setRespostaAtual] = useState<string | null>(null);
  const [showPresencaModal, setShowPresencaModal] = useState(false);

  const eventosDoDia = eventosLista.filter(ev => ev.data?.slice(0, 10) === selectedDate);

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

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar role:', error.message);
      return;
    }

    if (data?.role === 'admin') {
      setIsAdmin(true);
    }
  };

  const fetchEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('eventos').select('*');

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const marcados: Record<string, any> = {};
    data.forEach(ev => {
      marcados[ev.data?.slice(0, 10)] = {
        marked: true,
        dotColor: 'blue'
      };
    });

    setEventosMarcados(marcados);
    setEventosLista(data);
    setLoading(false);
  };

  const adicionarEvento = async () => {
    if (!titulo || !selectedDate) return;

    const { error } = await supabase.from('eventos').insert([{ titulo, data: selectedDate }]);

    if (!error) {
      setTitulo('');
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
            const { error } = await supabase.from('eventos').delete().eq('id', id);
            if (!error) {
              fetchEventos();
              Alert.alert('Sucesso', 'Evento removido com sucesso');
            }
          }
        }
      ]
    );
  };

  const iniciarEdicao = (evento: any) => {
    setTitulo(evento.titulo);
    setSelectedDate(evento.data?.slice(0, 10));
    setEventoEmEdicao(evento);
    setShowEditModal(true);
  };

  const guardarEdicao = async () => {
    if (!titulo || !selectedDate || !eventoEmEdicao) return;

    const { error } = await supabase
      .from('eventos')
      .update({ titulo, data: selectedDate })
      .eq('id', eventoEmEdicao.id);

    if (!error) {
      setShowEditModal(false);
      setEventoEmEdicao(null);
      setTitulo('');
      fetchEventos();
    }
  };

  const abrirModalPresenca = async (evento: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('presencas')
      .select('resposta')
      .eq('user_id', user.id)
      .eq('evento_id', evento.id)
      .maybeSingle();

    setEventoSelecionado(evento);
    setRespostaAtual(data?.resposta ?? null);
    setShowPresencaModal(true);
  };
  const ModalButtons = ({ onCancel, onConfirm, confirmText }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
    <TouchableOpacity onPress={onCancel} style={{ marginRight: 10 }}>
      <Text style={{ color: '#555' }}>Cancelar</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onConfirm}>
      <Text style={{ color: '#1e90ff', fontWeight: 'bold' }}>{confirmText}</Text>
    </TouchableOpacity>
  </View>
);

  const guardarRespostaPresenca = async (resposta: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !eventoSelecionado) return;

    const { data: existente } = await supabase
      .from('presencas')
      .select('id')
      .eq('user_id', user.id)
      .eq('evento_id', eventoSelecionado.id)
      .maybeSingle();

    if (existente) {
      await supabase
        .from('presencas')
        .update({ resposta })
        .eq('id', existente.id);
    } else {
      await supabase
        .from('presencas')
        .insert([{ user_id: user.id, evento_id: eventoSelecionado.id, resposta }]);
    }

    setRespostaAtual(resposta);
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        extraScrollHeight={40}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <Calendar
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={{
            ...eventosMarcados,
            [selectedDate]: {
              ...(eventosMarcados[selectedDate] || {}),
              selected: true,
              selectedColor: '#1e90ff'
            }
          }}
          theme={{
            backgroundColor: '#fff',
            calendarBackground: '#fff',
            textSectionTitleColor: '#999',
            selectedDayBackgroundColor: '#1e90ff',
            selectedDayTextColor: '#fff',
            todayTextColor: '#1e90ff',
            dayTextColor: '#000',
            textDisabledColor: '#ccc',
            arrowColor: '#000',
            monthTextColor: '#000',
            textMonthFontWeight: 'bold',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />

        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 16, color: '#555' }}>
          Data selecionada: {selectedDate || 'Nenhuma'}
        </Text>

        {selectedDate && (
          <>
            <Text style={{ fontSize: 20, marginTop: 20, fontWeight: 'bold', color: '#1e90ff' }}>
              Eventos neste dia:
            </Text>
            {eventosDoDia.length === 0 ? (
              <Text style={{ marginTop: 5, color: '#aaa' }}>Nenhum evento.</Text>
            ) : (
              eventosDoDia.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: '#ddd',
                  }}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => abrirModalPresenca(item)}
                  >
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                      {item.titulo}
                    </Text>
                  </TouchableOpacity>

                  {isAdmin && (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        onPress={() => iniciarEdicao(item)}
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: '#1e90ff',
                          borderRadius: 6,
                          marginRight: 6,
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removerEvento(item.id)}
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: '#cc0000',
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>X</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {isAdmin && selectedDate && (
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#1e90ff',
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 30,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              + Adicionar Evento
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAwareScrollView>

      {/* Modal de edição */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Evento</Text>
            <TextInput
              placeholder="Nome do evento"
              placeholderTextColor="#aaa"
              value={titulo}
              onChangeText={setTitulo}
              style={styles.input}

            />
            <ModalButtons
              onCancel={() => setShowEditModal(false)}
              onConfirm={guardarEdicao}
              confirmText="Guardar"
            />
          </View>
        </View>
      </Modal>

      {/* Modal adicionar evento */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Adicionar Evento</Text>
            <TextInput
              placeholder="Nome do evento"
              placeholderTextColor="#aaa"
              value={titulo}
              onChangeText={setTitulo}
              style={styles.input}

            />
            <ModalButtons
              onCancel={() => setShowAddModal(false)}
              onConfirm={adicionarEvento}
              confirmText="Criar"
            />
          </View>
        </View>
      </Modal>

      {/* Modal de presença */}
      <Modal visible={showPresencaModal} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Vai estar presente em "{eventoSelecionado?.titulo}"?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => guardarRespostaPresenca('sim')}
                style={respostaAtual === 'sim' ? styles.confirmBtn : styles.neutralBtn}
              >
                <Text style={respostaAtual === 'sim' ? styles.whiteText : styles.blackText}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => guardarRespostaPresenca('nao')}
                style={respostaAtual === 'nao' ? styles.cancelBtn : styles.neutralBtn}
              >
                <Text style={respostaAtual === 'nao' ? styles.whiteText : styles.blackText}>Não</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowPresencaModal(false)} style={{ marginTop: 20, alignSelf: 'flex-end' }}>
              <Text style={{ color: '#555' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f5f5f5',
    color: '#000',
  },
  confirmBtn: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#cc0000',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  neutralBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  blackText: { color: '#000', fontWeight: 'bold' },
});

export default Calendario;
