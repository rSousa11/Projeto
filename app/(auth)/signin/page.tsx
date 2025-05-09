import colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
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

    setLoading(false);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.branco }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.branco }}
        >
          <View style={styles.container}>
            <View style={styles.topBackground}>
              
              <Image 
                source={require('@/assets/images/bg.png')}
                resizeMode="cover"
                style={styles.image}
              />

              <View style={styles.header}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.branco,
  },
  topBackground: {
    backgroundColor: colors.azulescuro,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.branco,
    marginTop: 24,
  },
  slogan: {
    fontSize: 24,
    color: colors.branco,
    fontWeight: '300',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    backgroundColor: colors.branco,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    color: colors.preto,
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.azul,
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
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  link: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.preto,
    fontSize: 14,
  },
  linkAction: {
    color: colors.azul,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});
