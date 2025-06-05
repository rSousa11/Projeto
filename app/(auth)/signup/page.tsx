//pagina do registo
import colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
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

    // Adiciona email à tabela `users`
    if (userId) {
      const { error: upsertError } = await supabase.from('users').upsert([
        {
          id: userId,
          name: name,
          email: email,
          role: 'user'
        }
      ]);

      if (upsertError) {
        console.error('Erro ao inserir na tabela users:', upsertError);
      } else {
        console.log('Utilizador guardado na tabela users.');
      }
  }

  setLoading(false);
  Alert.alert('Sucesso', 'Conta criada. Verifique o seu e-mail.');
  router.replace('/(auth)/signin/page');
}


  return (
    <View style={{ flex: 1, backgroundColor: '#0e5cb3' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            style={{ backgroundColor: 'transparent' }}
          >
            <View style={styles.topBackground}>
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name='arrow-back' size={24} color={colors.azulescuro} />
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
                  keyboardType="email-address"
                  autoCapitalize="none"
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );

}

const styles = StyleSheet.create({
  topBackground: {
    backgroundColor: '#0e5cb3',
    paddingTop: 100,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 20,
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 12,
    zIndex: 2,
  },
  logoText: {
    fontSize: 55,
    fontWeight: 'bold',
    color: colors.branco,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 20,
    color: '#d0d0d0',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    backgroundColor: colors.branco,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    color: colors.azulescuro,
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: colors.azulescuro,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 14,
    marginTop: 10,
    shadowColor: colors.azulescuro,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: colors.branco,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
