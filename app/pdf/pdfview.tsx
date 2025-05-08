import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function VisualizadorPDF() {
  const { nome } = useLocalSearchParams();

  if (!nome || typeof nome !== 'string') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Ficheiro não encontrado.</Text>
      </View>
    );
  }

  const encoded = encodeURIComponent(nome);
  const rawUrl = `https://nkorqkyiytalpxyjgbjq.supabase.co/storage/v1/object/public/repertorio/pdfs/${encoded}`;
  const url = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(rawUrl)}`;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" style={{ flex: 1 }} />}
      />
    </View>
  );
}
