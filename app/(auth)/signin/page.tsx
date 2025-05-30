//pagina do login
import colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'react-native';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Erro', error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { user } = data;

      // Verifica se o utilizador já tem perfil
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: user.id,
            name: user.user_metadata?.name || 'Utilizador',
            email: user.email,
            role: 'user'
          }
        ]);

        if (insertError) {
          console.error('Erro ao criar perfil na tabela users:', insertError.message);
          Alert.alert('Erro', 'Não foi possível criar o perfil do utilizador.');
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    router.replace('/(tabs)');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0e5cb3' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1f3b70" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            style={{ backgroundColor: 'transparent' }}
          >
            <View style={styles.container}>
              <View style={styles.topBackground}>
                <View style={styles.header}>
                  <Text style={styles.welcome}>Bem-vindo à</Text>
                  <Text style={styles.logoText}>
                    We<Text style={{ color: colors.azulbebe }}>Segno</Text>
                  </Text>
                  <Text style={styles.slogan}>Juntos somos Muitos</Text>
                </View>
              </View>

              <View style={styles.form}>
                <View>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    placeholder="Escreva o seu Email..."
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#a0a0a0"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    placeholder="Escreva a sua password..."
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#a0a0a0"
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity onPress={handleSignIn} style={styles.button} activeOpacity={0.7}>
                  <Text style={styles.buttonText}>
                    {loading ? 'A carregar...' : 'Entrar'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.link}>
                  Ainda não tem conta?{' '}
                  <Link href="/(auth)/signup/page" asChild>
                    <Text style={styles.linkAction}>Regista-te</Text>
                  </Link>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.branco,
  },
  topBackground: {
    backgroundColor: '#0e5cb3',
    paddingBottom: 60, 
    paddingTop: 100,   
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcome: {
    fontSize: 24,
    color: '#cce0ff',
    fontWeight: '400',
    marginBottom: 8,
    letterSpacing: 1,
  },
  logoText: {
    fontSize: 55,
    fontWeight: 'bold',
    color: colors.branco,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 18,
    color: '#d0d0d0',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    marginTop: 16,
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
  link: {
    marginTop: 28,
    textAlign: 'center',
    color: '#555',
    fontSize: 15,
  },
  linkAction: {
    color: colors.azul,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});

