import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

interface CapturaFacialProps {
  onCapturar: (imagemBase64: string) => void;
  enviando?: boolean;
  textoBotao?: string;
}

/** Abre a câmera frontal e, ao tocar no botão, captura uma foto já como JPEG base64
 * (sem prefixo data URI) — equivalente nativo do componente CapturaFacial.tsx do GoValue web,
 * que usa getUserMedia + canvas; aqui é tudo resolvido pela própria expo-camera. */
export function CapturaFacial({ onCapturar, enviando = false, textoBotao = 'Capturar' }: CapturaFacialProps) {
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [capturando, setCapturando] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permissao) {
    return <ActivityIndicator />;
  }

  if (!permissao.granted) {
    return (
      <View style={styles.centro}>
        <Text style={styles.texto}>Precisamos da sua permissão pra usar a câmera.</Text>
        <Button onPress={solicitarPermissao} title="Permitir câmera" />
      </View>
    );
  }

  async function capturar() {
    if (!cameraRef.current) return;
    setCapturando(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (foto?.base64) onCapturar(foto.base64);
    } finally {
      setCapturando(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />
      <Button onPress={capturar} title={textoBotao} disabled={capturando || enviando} />
      {(capturando || enviando) && <ActivityIndicator style={styles.spinner} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  camera: { width: 280, height: 280, borderRadius: 140, overflow: 'hidden' },
  centro: { alignItems: 'center', gap: 12, padding: 16 },
  texto: { textAlign: 'center' },
  spinner: { marginTop: 4 },
});
