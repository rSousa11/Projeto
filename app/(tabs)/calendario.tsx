import { supabase } from '@/lib/supabase'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Button, FlatList, Text, TextInput, View } from 'react-native'
import { Calendar } from 'react-native-calendars'

const Calendario = () => {
  const [eventosMarcados, setEventosMarcados] = useState({})
  const [eventosLista, setEventosLista] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)

  // Admin form state
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    verificarSeEAdmin()
    fetchEventos()

    // Subscrever alterações
    const subscription = supabase
      .channel('public:eventos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, fetchEventos)
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const verificarSeEAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles') // ou a tabela onde guardas roles
      .select('role')
      .eq('id', user.id)
      .single()

    if (data?.role === 'admin') {
      setIsAdmin(true)
    }
  }

  const fetchEventos = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('eventos').select('*')
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const marcados = {}
    data.forEach(ev => {
      marcados[ev.data] = {
        marked: true,
        dotColor: 'blue'
      }
    })

    setEventosMarcados(marcados)
    setEventosLista(data)
    setLoading(false)
  }

  const adicionarEvento = async () => {
    if (!titulo || !data) {
      Alert.alert('Erro', 'Preenche o título e a data (YYYY-MM-DD)')
      return
    }

    const { error } = await supabase.from('eventos').insert([
      { titulo, descricao, data }
    ])

    if (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o evento')
    } else {
      setTitulo('')
      setDescricao('')
      setData('')
    }
  }

  const removerEvento = async (id: string) => {
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (error) {
      Alert.alert('Erro', 'Não foi possível remover o evento')
    }
  }

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 50 }}>
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

      <Text style={{ marginTop: 20, textAlign: 'center' }}>
        Data selecionada: {selectedDate || 'Nenhuma'}
      </Text>

      {isAdmin && (
        <>
          <Text style={{ fontSize: 18, marginTop: 30, fontWeight: 'bold' }}>Adicionar Evento</Text>
          <TextInput placeholder="Título" value={titulo} onChangeText={setTitulo} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
          <TextInput placeholder="Descrição" value={descricao} onChangeText={setDescricao} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
          <TextInput placeholder="Data (YYYY-MM-DD)" value={data} onChangeText={setData} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
          <Button title="Adicionar Evento" onPress={adicionarEvento} />

          <Text style={{ fontSize: 18, marginTop: 30, fontWeight: 'bold' }}>Eventos Existentes</Text>
          <FlatList
            data={eventosLista}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 10 }}>
                <Text>{item.data} - {item.titulo}</Text>
                <Button title="Remover" onPress={() => removerEvento(item.id)} />
              </View>
            )}
          />
        </>
      )}
    </View>
  )
}

export default Calendario
