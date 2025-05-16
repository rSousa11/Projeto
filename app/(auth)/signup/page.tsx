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

    console.log('Utilizador criado, aguarda confirmação por e-mail.');


    setLoading(false);
    Alert.alert('Sucesso', 'Conta criada. Verifique o seu e-mail.');
    router.replace('/(auth)/signin/page');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.azulescuro }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 34,
    paddingBottom: 24,
    backgroundColor: colors.azulescuro
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.branco,
    marginBottom: 4,
  },
  slogan: {
    fontSize: 32,
    color: colors.branco,
    fontWeight: '300',
    marginBottom: 34,
  },
  form: {
    flex: 1,
    backgroundColor: colors.branco,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  label: {
    color: colors.preto,
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.azulclaro,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    elevation: 2, 
  },
  button: {
    backgroundColor: colors.azulescuro,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 12,
    marginTop: 10,
    elevation: 3,
  },
  buttonText: {
    color: colors.branco,
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 8,
    borderRadius: 10,
  }
});
