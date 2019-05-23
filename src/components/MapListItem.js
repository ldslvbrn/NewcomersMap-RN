import React, { PureComponent } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, } from 'react-native';
import * as theme from '../assets/themes/default.json';

export default class MapListItem extends PureComponent {
    constructor(props) {
        super(props);
        this._onPress = this._onPress.bind(this);
    }

    render() {
        return (
            <TouchableOpacity onPress={this._onPress}>
                <View style={styles.container}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
                        <Text style={styles.labelTitle}>Title:</Text>
                        <Text style={styles.title} numberOfLines={1}>{this.props.title}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 6, alignItems: 'flex-start' }}>
                            <Text style={styles.labelLocation}>Location:</Text>
                            <Text style={styles.location} numberOfLines={1}>
                                {this.props.location}
                            </Text>
                        </View>
                        <View style={{
                            flex: 1,
                            alignSelf: 'flex-end',
                            alignItems: 'flex-start',
                            paddingRight: 5,
                            padddingLeft: 5,
                        }}>
                            <Text style={styles.labelMarkers}>Markers:</Text>
                            <Text style={styles.markers}>{this.props.totalMarkers}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    _onPress = () => this.props.onPress(this.props.id);
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        width: '97%',
        margin: 4,
        marginLeft: 5,
        marginRight: 5,
        padding: 8,
        borderRadius: 10,
        justifyContent: 'center',
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: theme.color.dark,
        borderWidth: 1,
    },
    title: {
        textAlign: 'center',
        fontSize: 18,
        color: theme.color.dark,
    },
    markers: {
        textAlign: 'right',
        fontSize: 18,
        color: theme.color.light,
    },
    location: {
        textAlign: 'left',
        fontSize: 18,
        color: theme.color.light,
    },
    labelTitle: {
        textAlign: 'center',
        fontSize: 12,
        color: theme.color.text,
    },
    labelMarkers: {
        textAlign: 'right',
        fontSize: 12,
        color: theme.color.text,
    },
    labelLocation: {
        textAlign: 'left',
        fontSize: 12,
        color: theme.color.text,
    },
});