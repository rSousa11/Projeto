import colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); 

  async function handleSignUp() {
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (signUpError) {
      Alert.alert('Erro', signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    console.log('Novo utilizador:', userId);

    if (userId) {
      const { error: upsertError } = await supabase.from('users').upsert([
        {
          id: userId,
          name: name,
          role: 'user'
        }
      ]);

      if (upsertError) {
        console.error('Erro ao inserir no users:', upsertError);
        Alert.alert('Erro ao criar perfil', upsertError.message);
      } else {
        console.log('Perfil criado com sucesso');
      }
    }

    setLoading(false);
    Alert.alert('Sucesso', 'Conta criada. Verifique o seu e-mail.');
    router.replace('/(auth)/signin/page');
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.branco }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name='arrow-back' size={24} color={colors.branco} />
            </Pressable>

            <Text style={styles.logoText}>
              We<Text style={{ color: colors.azulbebe }}>Segno</Text>
            </Text>
            <Text style={styles.slogan}>Criar Conta</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Nome</Text>
              <TextInput 
                placeholder='Escreva o seu Nome...'
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor="#a0a0a0"
              />
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                placeholder='Escreva o seu Email...'
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#a0a0a0"
              />
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                placeholder='Escreva a sua password...'
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#a0a0a0"
              />
            </View>

            <Pressable style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>
                {loading ? 'A carregar...' : 'Registar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 34,
    backgroundColor: colors.azulescuro
  },
  header: {
    paddingLeft: 14,
    paddingRight: 14,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.branco,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 38,
    color: colors.branco,
    marginBottom: 34,
  },
  form: {
    flex: 1,
    backgroundColor: colors.branco,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingLeft: 14,
    paddingRight: 14,
  },
  label: {
    color: colors.preto,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.azulclaro,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
  },
  button: {
    backgroundColor: colors.azulescuro,
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 8,
  },
  buttonText: {
    color: colors.branco,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  }
});
