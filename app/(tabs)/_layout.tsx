// Layout de las pestañas principales de la app.
// La barra de navegación inferior está oculta (tabBarStyle: display none)
// porque la navegación se maneja con botones propios dentro de cada pantalla.
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
