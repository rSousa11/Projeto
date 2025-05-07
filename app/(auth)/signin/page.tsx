


import colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
    <View style={styles.container}>
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
          <Text style= {styles.label}>Email</Text>
          <TextInput 
            placeholder='Escreva o seu Email...'
            style= {styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text style= {styles.label}>Password</Text>
          <TextInput 
            placeholder='Escreva a sua password...'
            style= {styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Pressable style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>
            {loading ? 'A carregar...': 'Entrar'}
          </Text>
        </Pressable>

        <Link href='/(auth)/signup/page' style={styles.link}>
          <Text>Ainda não tem conta? Registe-se</Text>
        </Link>
      </View>
    </View>
  )
  
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    paddingTop: '100%',
    backgroundColor: colors.azulescuro
  },
  header:{
    paddingLeft:14,
    paddingRight:14,
    
  },
  logoText:{
    fontSize: 50,
    fontWeight: 'bold',
    color: colors.branco,
    marginBottom:10,
  },
  slogan:{
    fontSize: 38,
    color: colors.branco,
    marginBottom: 34,
  },
  form:{
    flex:1,
    backgroundColor: colors.branco,
    borderTopLeftRadius:16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingLeft:14,
    paddingRight:14,
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
  link:{
    marginTop:16,
    textAlign:'center',
  },


});