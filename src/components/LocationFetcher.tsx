import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const LocationFetcher = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const getPermission = async () => {
      try {
        const permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_ALWAYS
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

        const result = await request(permission);

        if (result === RESULTS.GRANTED) {
          getLocation();
        } else {
          setErrorMsg('Location permission denied');
          setLoading(false);
        }
      } catch (err) {
        setErrorMsg('Permission error');
        setLoading(false);
      }
    };

    getPermission();
  }, []);

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLoading(false);
      },
      error => {
        setErrorMsg(error.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <View>
      {location ? (
        <Text>
          Latitude: {location.latitude}{'\n'}Longitude: {location.longitude}
        </Text>
      ) : (
        <Text>{errorMsg || 'Unable to fetch location.'}</Text>
      )}
      <Button title="Retry" onPress={getLocation} />
    </View>
  );
};

export default LocationFetcher;
