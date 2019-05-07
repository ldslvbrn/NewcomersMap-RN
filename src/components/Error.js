import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import * as theme from '../assets/themes/default.json';

export default class Error extends Component {
    constructor() {
        super();
        this.state = { message: this.props.navigation.getParam }
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Error!</Text>
                <Text style={styles.text}>
                    {this.state.message.toString()}
                </Text>
            </View>
        );
    }
}

export const showError = (text) => {
    this.props.navigation.dispatch(StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({
            routeName: 'MapListScreen',
            params: { message: text }
        })],
    }));
}

const styles = StyleSheet.create({
    container: {
        height: "60%",
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.color.backgroundColor,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        color: theme.color.text,
        margin: 30,
    },
    text: {
        textAlign: 'center',
        color: theme.color.text,
        marginBottom: 5,
    },
});