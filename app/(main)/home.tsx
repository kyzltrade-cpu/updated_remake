import { router } from 'expo-router';
import { useEffect } from 'react';

export default function HomeScreen() {
  useEffect(() => {
    router.replace('/(main)/scan');
  }, []);
  return null;
}