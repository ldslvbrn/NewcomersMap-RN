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

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import { YellowBox } from 'react-native';
import _ from 'lodash';

/* Yellowbow warning bug. RN and JS Firebase SDK clash
 * https://github.com/facebook/react-native/issues/12981 
 */
YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

AppRegistry.registerComponent(appName, () => App);
