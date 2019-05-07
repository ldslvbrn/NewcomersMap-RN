/* * * * * * * * * * * * * * * * * * * * * * * * *
 *        Newcomers Map React-Native App         *
 *                                               *
 *  Created by Ladislav Baran                    *
 *  https://github.com/ldslvbrn/NewcomersMap-RN  *
 *  ladislav.baran@outlook.com                   *
 *                                               *
 *  @MIT Licence, 2019                           *
 * * * * * * * * * * * * * * * * * * * * * * * * *
 */

import React from 'react';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import * as theme from './src/assets/themes/default.json';

/* import { Home, SignIn, MapList, Error } from "./src/components/*"; */
import Home from "./src/components/Home";
import MapList from "./src/components/MapList";
import Error from "./src/components/Error";
import MapDisplay from "./src/components/MapDisplay";

const AppNavigator = createStackNavigator({
  HomeScreen: Home,
  MapListScreen: MapList,
  ErrorScreen: Error,
  MapScreen: MapDisplay,
}, {
    initialRouteName: 'HomeScreen',
    defaultNavigationOptions: {
      title: "Newcomers Map",
      headerStyle: {
        backgroundColor: theme.color.light,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold'
      },
    }
  },
);

const AppContainer = createAppContainer(AppNavigator);

export default class App extends React.Component {
  render() {
    return <AppContainer />;
  }
}