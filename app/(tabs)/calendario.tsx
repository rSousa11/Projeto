import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const [modoEdicao, setModoEdicao] = useState(false);
  const [eventoEmEdicao, setEventoEmEdicao] = useState<any>(null);

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
      .single();

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
    if (!titulo || !selectedDate) {
      Alert.alert('Erro', 'Preenche o nome do evento e seleciona uma data');
      return;
    }

    const { error } = await supabase.from('eventos').insert([
      { titulo, data: selectedDate }
    ]);

    if (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o evento');
    } else {
      setTitulo('');
      fetchEventos();
    }
  };

  const atualizarEvento = async () => {
    if (!titulo || !selectedDate || !eventoEmEdicao) {
      Alert.alert('Erro', 'Preenche todos os campos');
      return;
    }

    const { error } = await supabase
      .from('eventos')
      .update({ titulo, data: selectedDate })
      .eq('id', eventoEmEdicao.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o evento');
    } else {
      setTitulo('');
      setEventoEmEdicao(null);
      setModoEdicao(false);
      fetchEventos();
    }
  };

  const removerEvento = async (id: string) => {
    const { error } = await supabase.from('eventos').delete().eq('id', id);

    if (error) {
      console.error('Erro ao remover evento:', error.message);
      Alert.alert('Erro', 'Não foi possível remover o evento');
    } else {
      fetchEventos();
      Alert.alert('Sucesso', 'Evento removido com sucesso');
    }
  };

  const iniciarEdicao = (evento: any) => {
    setTitulo(evento.titulo);
    setSelectedDate(evento.data?.slice(0, 10));
    setEventoEmEdicao(evento);
    setModoEdicao(true);
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setEventoEmEdicao(null);
    setTitulo('');
  };

  const Botao = ({ title, onPress, color = '#1e90ff' }: { title: string; onPress: () => void; color?: string }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: color,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
              selectedColor: 'orange'
            }
          }}
        />

        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 16, color: '#333' }}>
          Data selecionada: {selectedDate || 'Nenhuma'}
        </Text>

        {selectedDate && (
          <>
            <Text style={{ fontSize: 20, marginTop: 20, fontWeight: 'bold', color: '#1e90ff' }}>
              Eventos neste dia:
            </Text>
            {eventosDoDia.length === 0 ? (
              <Text style={{ marginTop: 5 }}>Nenhum evento.</Text>
            ) : (
              eventosDoDia.map((item) => (
                <View key={item.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#ddd' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.titulo}</Text>
                  {isAdmin && (
                    <>
                      <Botao title="Editar" onPress={() => iniciarEdicao(item)} />
                      <Botao title="Remover" onPress={() => removerEvento(item.id)} color="#cc0000" />
                    </>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {isAdmin && selectedDate && (
          <>
            <Text style={{ fontSize: 20, marginTop: 30, fontWeight: 'bold', color: '#1e90ff' }}>
              {modoEdicao ? `Editar evento em ${selectedDate}` : `Adicionar evento em ${selectedDate}`}
            </Text>

            <TextInput
              placeholder="Nome do evento"
              placeholderTextColor="#aaa"
              value={titulo}
              onChangeText={setTitulo}
              style={{
                borderWidth: 1,
                borderColor: '#555',
                borderRadius: 8,
                padding: 10,
                marginTop: 10,
                marginBottom: 10,
                backgroundColor: '#1a1a1a',
                color: 'white',
              }}
            />

            <Botao
              title={modoEdicao ? 'Atualizar Evento' : 'Adicionar Evento'}
              onPress={modoEdicao ? atualizarEvento : adicionarEvento}
            />

            {modoEdicao && (
              <Botao title="Cancelar edição" onPress={cancelarEdicao} color="#999" />
            )}
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Calendario;
