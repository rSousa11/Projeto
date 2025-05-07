
import colors from '@/constants/colors';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {

  return(
    <View style={styles.container}>
      <ActivityIndicator size={44} color={colors.azul}/>
    </View>
  )
  
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor: colors.azulescuro,
    justifyContent: 'center',
    alignItems:'center',
  },
  
});