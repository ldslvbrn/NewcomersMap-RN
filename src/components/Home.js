import React from "react";
import { View, Text, StyleSheet, PermissionsAndroid, ToastAndroid } from "react-native";
import { GoogleSignin, statusCodes, GoogleSigninButton } from 'react-native-google-signin';
import { StackActions, NavigationActions } from 'react-navigation';
import * as theme from '../assets/themes/default.json';
// import * as googleServices from '../../android/app/google-services.json';


export default class Home extends React.Component {
    static navigationOptions = { header: null };

    constructor() {
        super();
        this._signIn = this._signIn.bind(this);
        this._getCurrentUser = this._getCurrentUser.bind(this);
        this._navigateToDataList = this._navigateToDataList.bind(this);
        this._requestLocationPermission = this._requestLocationPermission.bind(this);
        this.state = {
            user: null,
            token: null,
            needsSignIn: false,
            isSigningInProgress: false,
        };
    }

    componentDidMount() {
        GoogleSignin.configure({
            //webClientId: googleServices.client.oauth_client[0].client_id
            webClientId: "323664508081-1vu22670ieg6lve35f5fjab6aflsqvpp.apps.googleusercontent.com",
            offlineAccess: false
        });
        this._requestLocationPermission();
        this._getCurrentUser()
    }

    render() {
        if (!this.state.needsSignIn) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Newcomers Maps</Text>
                    <Text style={styles.text}>Welcome!</Text>
                </View>
            );
        } else {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Newcomers Maps</Text>
                    <Text style={styles.text}>Please, login with your Google account.</Text>
                    <GoogleSigninButton
                        style={styles.signInButton}
                        size={GoogleSigninButton.Size.Standard}
                        color={GoogleSigninButton.Color.Light}
                        onPress={this._signIn}
                        disabled={this.state.isSigningInProgress}
                    />
                </View>
            );
        }
    }

    async _getCurrentUser() {
        const user = await GoogleSignin.getCurrentUser()
            .catch((err) => console.warn(err));
        if (user !== null && user !== undefined)  {
            await GoogleSignin.getTokens()
                .then((token) => setTimeout(() => this._navigateToDataList(token), 1500)                )
                .catch((err) => console.warn(err));
        } else setTimeout(() => this.setState({ needsSignIn: true }), 1500);
    }



    async _signIn() {
        this.setState({ isSigningInProgress: true });
        try {
            await GoogleSignin.hasPlayServices()
            const user = await GoogleSignin.signIn();
            if (user !== null && user !== undefined) {
                await GoogleSignin.getTokens()
                    .then((token) => this._navigateToDataList(token))
                    .catch((err) => console.warn(err));
            }
            else {
                this.setState({ isSigningInProgress: false });
                console.log("_signIn(): !!!");
            } 
        } catch (err) {
            console.warn(err);
            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
                this.setState({ isSigningInProgress: false });
                ToastAndroid.show("Authentication required", ToastAndroid.SHORT);
            }
        }
        
    }

    async _requestLocationPermission() {
        try {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
            ]).then((result) => {
                // Nope, you cannot iterate through the result
                if (result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]
                    && result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]
                    === PermissionsAndroid.RESULTS.GRANTED) {
                    this.setState({ locationPermission: true });
                }
                else if (result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]
                    || result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]
                    === PermissionsAndroid.RESULT) {
                    /* this.props.navigation.navigate('ErrorScreen', {
                        message: "Location permission is needed.",
                    }); */
                    ToastAndroid.show("Location permission is needed", ToastAndroid.SHORT)
                }
            });
        } catch (err) {
            console.warn(err);
        }
    }

    _navigateToDataList(user) {
        this.props.navigation.dispatch(StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({
                routeName: 'MapListScreen',
                params: { user: user }
            })],
        }));
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: theme.color.backgroundColor,
    },
    title: {
        fontSize: 20,
        marginTop: 160,
        textAlign: 'center',
        color: theme.color.light
    },
    text: {
        textAlign: 'center',
        color: theme.color.text,
        margin: 10,
    },
    signInButton: {
        alignItems: 'center',
        width: 115,
        height: 48,
        margin: 20
    },
});