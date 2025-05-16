import { Tabs } from "expo-router";
import { Image, ImageBackground, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        resizeMode="cover"
        style={{
          marginTop: 31,
          width: 120,
          height: 82,
          borderRadius: 9999,
          overflow: "hidden",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={icon}
          style={{
            width: 25,
            height: 25,
            tintColor: "black",
          }}
        />
        <Text
          style={{
            color: "black",
            fontSize: 18,
            fontWeight: "600",
            marginLeft: 3,
          }}
        >
          {title}
        </Text>
      </ImageBackground>
    );
  }

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Image
        source={icon}
        style={{
          width: 25,
          height: 25,
          tintColor: "white",
          marginTop: 31,
        }}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0F0D23',
          borderRadius: 50,
          marginHorizontal: 10,
          marginBottom: 50,
          height: 70,
          position: 'absolute',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#0F0D23',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      })}

      >
        <Tabs.Screen
          name="index"
          options={{
            title: "index",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.home} title="Home" />
            ),
          }}
        />

        <Tabs.Screen
          name="repertorio"
          options={{
            title: "Repertório",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.musica} title="Repertório" />
            ),
          }}
        />

        <Tabs.Screen
          name="calendario"
          options={{
            title: "Calendário",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.calendario} title="Calendário" />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.perfil} title="Perfil" />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
