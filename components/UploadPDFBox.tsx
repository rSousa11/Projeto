import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0 || !bytes) return '0 bytes';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function UploadPDFBox({
  onUploadSuccess,
  userId,
  tituloPDF,
  linkYoutube
}: {
  onUploadSuccess: () => void;
  userId: string;
  tituloPDF: string;
  linkYoutube: string;
}) {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleSelectFile = async () => {
    setUploadError('');
    setUploadSuccess(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    if (!result.canceled && result.assets?.[0]) {
      setFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = `pdfs/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      if (!blob.size) throw new Error('Ficheiro vazio');

      const { error: uploadError } = await supabase.storage
        .from('repertorio')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
        });

      if (uploadError) throw uploadError;

      const publicUrl = `https://nkorqkyiytalpxyjgbjq.supabase.co/storage/v1/object/public/repertorio/pdfs/${fileName}`;

      await supabase.from('pdfs_info').insert([{
        nome: fileName,
        url: publicUrl,
        titulo: tituloPDF.trim() || file.name,
        link: linkYoutube.trim() || null,
        user_id: userId,
      }]);

      setUploadSuccess(true);
      setFile(null);
      onUploadSuccess();
    } catch (error: any) {
      console.error(error);
      setUploadError(error.message || 'Erro ao fazer upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadError('');
    setUploadSuccess(false);
  };

  return (
    <View style={{
      borderWidth: 2,
      borderColor: uploadSuccess ? '#2ecc71' : uploadError ? '#e74c3c' : '#ccc',
      borderRadius: 10,
      padding: 16,
      backgroundColor: '#fafafa',
    }}>
      {!file ? (
        <TouchableOpacity onPress={handleSelectFile} style={{ alignItems: 'center' }}>
          <Feather name="upload" size={28} color="#666" />
          <Text style={{ marginTop: 8 }}>Seleciona um ficheiro PDF</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Feather name="file-text" size={20} color="#333" />
            <Text numberOfLines={1} style={{ marginLeft: 8, flex: 1 }}>{file.name}</Text>
            <TouchableOpacity onPress={handleRemove}>
              <Feather name="x" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, color: '#999' }}>
            {formatBytes(file.size)}
          </Text>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
          ) : (
            <TouchableOpacity
              onPress={handleUpload}
              style={{
                marginTop: 12,
                backgroundColor: '#2980b9',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Enviar PDF</Text>
            </TouchableOpacity>
          )}

          {uploadSuccess && (
            <Text style={{ marginTop: 8, color: '#2ecc71' }}>✔ Upload realizado com sucesso!</Text>
          )}
          {uploadError && (
            <Text style={{ marginTop: 8, color: '#e74c3c' }}>⚠ {uploadError}</Text>
          )}
        </View>
      )}
    </View>
  );
}
