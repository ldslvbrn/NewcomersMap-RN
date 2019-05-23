import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image, FlatList,
    ActivityIndicator,
    Text
} from 'react-native';
import MapListItem from "./MapListItem";
import * as theme from '../assets/themes/default.json';
import FirebaseProvider from "../FirebaseProvider";
import * as Geocoder from "../GeocoderProvider";

export default class MapList extends Component {
    constructor(props) {
        super(props);
        this._renderItem = this._renderItem.bind(this);
        this._addItem = this._addItem.bind(this);
        this._renderListConditionaly = this._renderListConditionaly.bind(this);
        this._onPressItem = this._onPressItem.bind(this);
        this._onNavigateBack = this._onNavigateBack.bind(this);
        this._getAllMaps = this._getAllMaps.bind(this);
        this._dbProvider = null;
        this.state = {
            user: this.props.navigation.getParam('user', null),
            dataReady: false,
            userMaps: null,
            shownLocation: []
        };
    }

    componentDidMount() {
        this._dbProvider = new FirebaseProvider();
        this._dbProvider.authenticate(
            this.state.user.idToken, this._getAllMaps);
    }

    render() {
        return (this._renderListConditionaly());
    }

    _renderListConditionaly() {
        if (this.state.dataReady) {
            return (
                <View style={styles.container}>
                    <FlatList
                        style={{ flex: 1, width: '100%' }}
                        data={this.state.userMaps}
                        renderItem={this._renderItem}
                        keyExtractor={(item, index) => item.documentId}
                        on
                    />
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={this._addItem}
                    >
                        <Image
                            style={styles.image}
                            source={require('../assets/images/add_white_24.png')}
                        />
                    </TouchableOpacity>
                </View>
            );
        } else {
            return (
                <View style={styles.container}>
                    <Text>Loading your maps. . .</Text>
                    <ActivityIndicator size={80} color={theme.color.light} />
                </View>
            );
        }
    }

    _renderItem({ item }) {
        const totalMarkers = item.markers.length;
        const locationIndex = this.state.userMaps.indexOf(item);
        return (
            <MapListItem
                id={item.documentId}
                title={item.title}
                totalMarkers={totalMarkers}
                location={this.state.shownLocation[locationIndex]}
                onPress={this._onPressItem}
            />
        );
    }

    _onPressItem(id) {
        const mapItem = this.state.userMaps
            .find((userMap) => userMap.documentId === id);
        this.props.navigation.navigate('MapScreen', {
            userMap: mapItem,
            firebaseProv: this._dbProvider,
            onNavigateBack: () => this._onNavigateBack(),
        });
    }

    _addItem() {
        this.props.navigation.navigate('MapScreen', {
            firebaseProv: this._dbProvider,
            onNavigateBack: () => this._onNavigateBack(),
        });
    }

    _onNavigateBack() {
        this._getAllMaps()
    }

    _getAllMaps() {
        this._dbProvider.getAllMaps()
            .then((maps) => {
                let coords = maps.map((map) => {
                    return [map.location.latitude, map.location.longitude];
                });
                Geocoder.getRegionFromLocation(coords, (places) => {
                    this.setState({
                        dataReady: true,
                        userMaps: maps,
                        shownLocation: places
                    });
                });
            });
    }
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.color.backgroundColor,
    },
    text: {
        textAlign: 'center',
        color: theme.color.text,
    },
    addButton: {
        padding: 15,
        margin: 20,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.color.light,
        borderRadius: 100,
    },
    image: {
        resizeMode: 'contain',
        width: 28,
        height: 28,
    },
});