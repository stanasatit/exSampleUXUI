import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../constants/theme';

const splashImage = require('../../assets/images/splashscreen.png');
const logoImage = require('../../assets/images/logo.png');

export function SplashScreen() {
  return (
    <ImageBackground
      resizeMode="cover"
      source={splashImage}
      style={styles.container}
    >
      <View style={styles.brandBlock}>
        <Image resizeMode="contain" source={logoImage} style={styles.logo} />
      </View>

      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '24%',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  loader: {
    alignItems: 'center',
    paddingBottom: 96,
  },
  loaderText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 14,
  },
  logo: {
    height: 220,
    width: 220,
  },
});
