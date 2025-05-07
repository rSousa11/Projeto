


import colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(){
    setLoading(true);

    const {data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password:password
    })

    if(error){
      Alert.alert('Error', error.message)
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace('/(panel)/profile/page')

  }

  return(
    <SafeAreaView style={{ flex: 1 }}>
      
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          
          <Image
            source={require("@/assets/images/onboarding.png")}
            resizeMode="cover"
            style={styles.image}
          />
          
          
          <View style={styles.header}>
            <Text style={styles.logoText}>
              We<Text style={{color: colors.azulbebe}}>Segno</Text>
            </Text>
            <Text style={styles.slogan}>
              Juntos somos Muitos
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor= "#030507"
                style={styles.input}
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#030507"
                style={styles.input}
              />
            </View>

            <TouchableOpacity onPress={handleSignIn} style={styles.button} activeOpacity={0.6}>
              <Text style={styles.buttonText}>
                {loading ? 'A carregar...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.link}>
              Ainda não tem conta?{' '}
              <Link href='/(auth)/signup/page' asChild>
                <Text style={styles.linkAction}>Regista-te</Text>
              </Link>
            </Text>

            
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
  
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    paddingTop: 0,
    backgroundColor: colors.azulescuro
  },
  header:{
    alignItems:'center',
    paddingLeft:14,
    paddingRight:14,
    
  },
  logoText:{
    fontSize: 60,
    fontWeight: 'bold',
    color: colors.branco,
    marginBottom:10,
    marginTop:50,
    alignItems:'center',
  },
  slogan:{
    fontSize: 25,
    color: colors.branco,
    marginBottom: 34,
    textAlign:'center',
  },
  form:{
    flex:1,
    backgroundColor: colors.branco,
    borderTopLeftRadius:16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingLeft:14,
    paddingRight:14,
    minHeight: '100%',
  },
  label:{
    color:colors.preto,
    marginBottom:4,
  },
  input:{
    borderWidth: 1,
    borderColor: colors.azul,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal:8,
    paddingTop:14,
    paddingBottom:14,
  },
  button:{
    backgroundColor: colors.azulescuro,
    paddingTop:14,
    paddingBottom:14,
    alignItems: 'center',
    justifyContent: 'center',
    width:'100%',
    borderRadius:8,
  },
  buttonText:{
    color:colors.branco,
    fontWeight:'bold',
  },
  
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover', // Enche o espaço e corta se necessário
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  link: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.preto,
  },

  linkAction: {
    color: colors.azul, // ou '#007bff' por exemplo
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  
  
  

});