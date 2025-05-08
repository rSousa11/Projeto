import { Tabs } from "expo-router";
import { Image, ImageBackground, Text, View } from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        resizeMode="cover"
        style={{
          marginTop:31,
          width: 120,
          height: 70,
          borderRadius: 9999,
          overflow: 'hidden',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
      }}
      >
        <Image source={icon} style={{ width: 25, height: 25, tintColor: 'black', marginTop:0 }} />
        <Text style={{ color: 'black', fontSize: 18, fontWeight: '600', marginLeft: 3 }}>
          {title}
        </Text>
      </ImageBackground>
    );
  }

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Image source={icon} style={{ width: 25, height: 25, tintColor: 'white', marginTop:31 }} />
    </View>
  );
}


export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
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
      }}
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
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} title="Search" />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="Save" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}