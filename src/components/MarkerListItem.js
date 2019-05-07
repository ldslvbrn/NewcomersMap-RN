import React, { PureComponent } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, } from 'react-native';
import * as theme from '../assets/themes/default.json';

export default class MarkerListItem extends PureComponent {
    constructor(props) {
        super(props);
        this._onPress = this._onPress.bind(this);
    }

    render() {
        return (
            <TouchableOpacity onPress={this._onPress}>
                <View style={styles.container}>
                <Text style={styles.title}>{this.props.title}</Text>
                <Text style={styles.location}>{this.props.location}</Text>
            </View>
            </TouchableOpacity>
        );
    }

    _onPress() { this.props.onPress(this.props.title); }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        width: '97%',
        marginLeft: 7,
        margin: 3,
        padding: 4,
        paddingLeft: 7,
        paddingRight: 7,
        borderRadius: 10,
        justifyContent: "center",
        // alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: theme.color.dark,
        borderWidth: 1,
    },
    title: {
        textAlign: 'center',
        fontSize: 18,
        color: theme.color.dark,
        textAlign: 'center',
    },
    location: {
        textAlign: 'left',
        fontSize: 14,
        color: theme.color.textcolor,
        textAlign: 'left'
    },
});