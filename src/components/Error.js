import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import * as theme from '../assets/themes/default.json';

export default class Error extends Component {
    constructor(props) {
        super(props);
        const errorCode= this.props.navigation.getParam('errorCode', '' );
        this.state = { message: errorMessages[errorCode] };
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Error!</Text>
                <Text style={styles.text}>
                    {this.state.message}
                </Text>
            </View>
        );
    }
}

export const showError = (text) => {
    this.props.navigation.dispatch(StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({
            routeName: 'ErrorScreen',
            params: { message: text }
        })],
    }));
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.color.backgroundColor,
        paddingRight: 35,
        paddingLeft: 35,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        color: theme.color.text,
        margin: 20,
    },
    text: {
        textAlign: 'center',
        color: theme.color.text,
        marginBottom: 5,
    },
});

const errorMessages = {
    permissionError: "Location permission is required\n\n" +
        " In order to use the application, we need your location access permission" +
        "Navigate to the phone settings, allow the location permission and restart the app"
};