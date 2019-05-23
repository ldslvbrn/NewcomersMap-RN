import React from "react";
import {
    Text,
    View,
    Image,
    StyleSheet,
    FlatList,
    ToastAndroid,
    ActivityIndicator,
    TouchableOpacity,
    BackHandler,
    Alert
} from "react-native";
import MapView, { Marker } from 'react-native-maps';
import { HeaderBackButton } from 'react-navigation';
import * as theme from '../assets/themes/default.json';
import MarkerListItem from "./MarkerListItem.js";
import * as Geocoder from "../GeocoderProvider";
import DialogInput from "react-native-dialog-input";
import { StackActions, NavigationActions } from 'react-navigation';

export default class MapDisplay extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.getParam('title', ""),
            headerRight: (
                <HeaderButtons
                    onSavePress={navigation.getParam('save')}
                    onMorePress={navigation.getParam('more')}
                />
            ),
            headerLeft: (<HeaderBackButton
                tintColor='#fff'
                onPress={navigation.getParam('back')} />
            ),
        };
    };

    constructor(props) {
        super(props);
        // no need for wrapping bindings, only improves readability
        this.bindFunctions = (classContext) => {
            this._getUserPosition = this._getUserPosition.bind(classContext);
            this._positionFetchError = this._positionFetchError.bind(classContext);
            this._renderMapConditionaly = this._renderMapConditionaly.bind(classContext);
            this._renderItem = this._renderItem.bind(classContext);
            this._onPressItem = this._onPressItem.bind(classContext);
            this._renderMapView = this._renderMapView.bind(classContext);
            this._submitInputMapName = this._submitInputMapName.bind(classContext);
            this._submitInputMarkerName = this._submitInputMarkerName.bind(classContext);
            this._onMapLongPress = this._onMapLongPress.bind(classContext);
            this._onPressMarker = this._onPressMarker.bind(classContext);
            this._onBackPressed = this._onBackPressed.bind(classContext);
            this.saveUserMap = this.saveUserMap.bind(classContext);
            this._showMenu = this._showMenu.bind(classContext);
            this._onLongPressItem = this._onLongPressItem.bind(classContext);
        }
        this.bindFunctions(this);
        // private vars
        this._ongoingMarkerNameChange = null;
        this._mapViewRef = null;
        this._flatListRef = null;
        this._markerRefs = new Map();
        this._firebaseProvider = this.props.navigation.getParam('firebaseProv', null);
        // get arguments set-up initial state
        let userMap = this.props.navigation.getParam('userMap', null);
        const headerTitle = userMap ? userMap.title : "New Map";
        this.props.navigation.setParams({ title: headerTitle });
        let shouldPopUp;
        if (userMap === null || undefined) {
            userMap = {
                documentId: null,
                title: null,
                location: null,
                markers: []
            }
            shouldPopUp = true
        } else shouldPopUp = false;
        this.state = {
            shouldMapNameDialog: shouldPopUp,
            shouldMarkerNameDialog: false,
            userMap: userMap,
            position: null,
            isFetchingLocation: true,
            shownLocations: []
        }
    }

    componentDidMount() {
        this.props.navigation.setParams({
            save: this.saveUserMap,
            more: this._showMenu,
            back: this._onBackPressed
        });
        BackHandler.addEventListener('hardwareBackPress', this._onBackPressed);
        const watchId = navigator.geolocation.watchPosition(
            ((pos) => this._getUserPosition(pos, watchId)),
            ((err) => this._positionFetchError(err)),
            geoOptions);
        if (this.props.navigation.getParam('userMap', null)) {
            let coords = this.state.userMap.markers.map((marker) => {
                return [marker.location.latitude, marker.location.longitude];
            });
            Geocoder.getAddressFromLocation(coords, (places) => (
                this.setState({ shownLocations: places })));
        }
    }

    componentWillUnmount() {
        navigator.geolocation.clearWatch(this.state.watchId);
        BackHandler.removeEventListener('hardwareBackPress', this._onBackPressed);
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.mapContainer}>
                    {this._renderMapConditionaly()}
                </View>
                <View style={styles.listContainer}>
                    <FlatList
                        ref={(ref) => this._flatListRef = ref}
                        style={{ flex: 1, width: '100%' }}
                        data={this.state.userMap.markers}
                        renderItem={this._renderItem}
                        keyExtractor={(item, index) => item.title}
                    />
                    {this.state.shouldMapNameDialog &&
                        <DialogInput
                            isDalogVisible={this.state.shouldMapNameDialog}
                            message={"Map title:"}
                            hintInput={"My custom map..."}
                            submitInput={this._submitInputMapName}
                            closeDialog={() => this.setState({ shouldMapNameDialog: false })}>
                        </DialogInput>
                    }
                    {this.state.shouldMarkerNameDialog &&
                        <DialogInput
                            isDalogVisible={this.state.shouldMarkerNameDialog}
                            message={"Marker title:"}
                            hintInput={"Give me a name!..."}
                            submitInput={this._submitInputMarkerName}
                            closeDialog={() => {
                                this._ongoingMarkerNameChange = null;
                                this.setState({ shouldMarkerNameDialog: false })
                            }}>
                        </DialogInput>
                    }
                </View>
            </View>
        );
    }

    _renderMapConditionaly() {
        // if a default marker is availible to zoom on
        if (this.props.navigation.getParam('userMap', null)) {
            const camera = {
                center: {
                    latitude: this.state.userMap.markers[0].location.latitude,
                    longitude: this.state.userMap.markers[0].location.longitude,
                },
                pitch: 0,
                heading: 0,
                zoom: 13,
                altitude: 32
            }
            return this._renderMapView(camera);
        }
        // if not, user's location might be in loading
        else if (this.state.isFetchingLocation) {
            return (
                <View style={styles.mapContainer}>
                    <ActivityIndicator
                        size={80}
                        color={theme.color.light}
                    />
                    <Text>Initialising map</Text>
                </View>
            );
        }
        // location retrieved set zoom to current location
        else if (this.state.position) {
            const camera = {
                center: {
                    latitude: this.state.position.coords.latitude,
                    longitude: this.state.position.coords.longitude,
                },
                pitch: 0,
                heading: 0,
                zoom: 13,
                altitude: 32
            }
            return this._renderMapView(camera);
            // unable to get users position, set zoom to static location (UK)
            // return MapView component
        } else return this._renderMapView(cameraUK)
    }

    _renderMapView(camera) {
        return (
            <MapView
                ref={(ref) => this._mapViewRef = ref}
                style={styles.map}
                onLongPress={this._onMapLongPress}
                showsUserLocation={true}
                camera={camera}
            >
                {this.state.userMap.markers.map(marker => (
                    <Marker
                        ref={(ref) => this._markerRefs.set(marker, ref)}
                        key={marker.title}
                        onPress={this._onPressMarker}
                        coordinate={{
                            latitude: marker.location.latitude,
                            longitude: marker.location.longitude
                        }}
                        title={marker.title}
                        description={marker.description}
                    />
                ))}
            </MapView>
        );
    }

    _submitInputMapName(input) {
        const userMap = this.state.userMap
        usrM.title = input;
        this.setState({
            userMap: userMap,
            shouldSave: true,
            shouldMapNameDialog: false
        })
        this.props.navigation.setParams({ headerTitle: usrM.title });
    }

    _submitInputMarkerName(input) {
        let userMap = this.state.userMap;
        let marker = this._ongoingMarkerNameChange;
        // is existing marker being modified?
        if (this.state.userMap.markers.indexOf(marker) !== -1) {
            userMap.markers[userMap.markers.indexOf(marker)].title = input;
            this.setState({
                userMap: userMap,
                shouldSave: true,
                shouldMarkerNameDialog: false
            }, () => this._ongoingMarkerNameChange = null);
        } else { //  or is new marker being added?
            marker.title = input;
            const coords = [[
                marker.location.latitude,
                marker.location.longitude
            ]];
            Geocoder.getAddressFromLocation(coords, (places) => {
                let place = places[0];
                let shownLocations = this.state.shownLocations;
                userMap.markers.push(marker);
                shownLocations.push(place);
                this.setState({
                    shownLocations: shownLocations,
                    userMap: userMap,
                    shouldSave: true,
                    shouldMarkerNameDialog: false
                }, () => this._ongoingMarkerNameChange = null);
            });
        }
    }

    _renderItem({ item }) {
        const markerIndex = this.state.userMap.markers.indexOf(item);
        return (
            <MarkerListItem
                title={item.title}
                location={this.state.shownLocations[markerIndex]}
                onPress={this._onPressItem}
                onLongPress={this._onLongPressItem}
            />
        );
    }

    _getUserPosition(position, id) {
        this.setState({
            watchId: id,
            position: position,
            isFetchingLocation: false
        });
    }

    _positionFetchError(err) {
        console.warn(err);
        this.setState({
            isFetchingLocation: false
        });
        ToastAndroid.show('Unable to get location.', ToastAndroid.SHORT);
    }

    saveUserMap() {
        const succesMessage = () => {
            ToastAndroid.show("Map saved successfully!", ToastAndroid.SHORT)
        };
        const errorMessage = () => {
            ToastAndroid.show("Oops, something went wrong!", ToastAndroid.SHORT)
        };
        const userMap = this.state.userMap;
        if (userMap.documentId) {
            this._firebaseProvider.updateUserMap(userMap, (isSucces) => {
                if (isSucces) {
                    this.setState({ shouldSave: false })
                    succesMessage();
                }
                else errorMessage();
            });
        } else {
            this._firebaseProvider.addUserMap(userMap, (docId) => {
                if (docId) {
                    userMap.documentId = docId;
                    this.setState({
                        userMap: userMap,
                        shouldSave: false
                    });
                    succesMessage();
                } else errorMessage();
            });
        }
    }

    _onPressMarker(event) {
        const coords = event.nativeEvent.coordinate;
        // TODO
        const marker = this.state.userMap.markers.find((mark) => {
            const isLocEqual = mark.location.latitude === coords.latitude &&
                mark.location.longitude === coords.longitude;
            return isLocEqual;
        });
        if (marker) {
            this._flatListRef.scrollToItem({
                animated: true,
                item: marker,
            });
        }
    }

    _onPressItem(title) {
        const marker = this.state.userMap.markers
            .find((mark) => mark.title === title);
        const camera = {
            center: {
                latitude: marker.location.latitude,
                longitude: marker.location.longitude,
            },
            pitch: 0,
            heading: 0,
            zoom: 13,
            altitude: 4,
        }
        this._mapViewRef.animateCamera(camera, { duration: 1200 })
        this._markerRefs.get(marker).showCallout();
    }

    _onLongPressItem(title) {
        // TODO
    }

    _onMapLongPress(event) {
        const coords = event.nativeEvent.coordinate;
        const geoPoint = this._firebaseProvider.getGeoPoint(coords.latitude, coords.longitude);
        const newMarker = {
            title: "New Marker" + this.state.userMap.markers.length,
            description: null,
            location: geoPoint
        };
        this._ongoingMarkerNameChange = newMarker;
        this.setState({ shouldMarkerNameDialog: true });
    }

    _showMenu = () => console.log("Menu pressed!")

    _onBackPressed() {
        console.log("_onBackPressed pressed!");
        if (this.state.shouldSave) {
            Alert.alert(
                'Unsaved Changes',
                'Would you like to save your changes?', [
                    {
                        text: "Cancel",
                        style: 'cancel'
                    }, {
                        text: "No",
                        onPress: () => {
                            this.props.navigation.state.params.onNavigateBack();
                            this.props.navigation.goBack()
                        },
                        style: 'cancel',
                    }, {
                        text: "Yes",
                        onPress: () => {
                            this.saveUserMap();
                            this.props.navigation.state.params.onNavigateBack();
                            this.props.navigation.goBack();
                        }
                    },],
                { cancelable: false },
            );

        } else {
            this.props.navigation.goBack();
            return true;
        }
    }
}

class SaveButton extends React.Component {
    render() {
        return (
            <TouchableOpacity onPress={this.props.onPress}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                        style={styles.saveImage}
                        source={require('../assets/images/save_white_48.png')}
                    />
                </View>
            </TouchableOpacity>
        );
    }
}

class MoreButton extends React.Component {
    render() {
        return (
            <TouchableOpacity onPress={this.props.onPress}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                        style={styles.saveImage}
                        source={require('../assets/images/more_vert_white_48dp.png')}
                    />
                </View>
            </TouchableOpacity>
        );
    }
}

class HeaderButtons extends React.Component {
    constructor() {
        super();
        this._onSavePress = this._onSavePress.bind(this);
        this._onMorePress = this._onMorePress.bind(this);
    }

    render() {
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={this._onSavePress}>
                    <Image
                        style={styles.headerButtons}
                        source={require('../assets/images/save_white_48.png')}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={this._onMorePress}>
                    <Image
                        style={styles.headerButtons}
                        source={require('../assets/images/more_vert_white_48dp.png')}
                    />
                </TouchableOpacity>
            </View>
        );
    }

    _onSavePress = () => this.props.onSavePress();

    _onMorePress = () => this.props.onMorePress();
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    mapContainer: {
        height: '65%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContainer: {
        paddingTop: 5,
        height: '35%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.color.backgroundColor,
    },
    map: {
        flex: 1,
        width: '100%',
    },
    saveImage: {
        padding: 13,
        margin: 20,
        height: '5%',
        width: '5%',
    },
    headerButtons: {
        padding: 10,
        margin: 4,
        marginLeft: 10,
        marginRight: 10,
        height: '45%',
        width: '45%',
    },
    header: {
        flexDirection: 'row',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const geoOptions = {
    maximumAge: 2500,
    timeOut: 2500,
    enableHighAccuracy: false,
};

const cameraUK = {
    center: {
        latitude: 54.232625,
        longitude: -3.110141,
    },
    pitch: 0,
    heading: 0,
    zoom: 4,
    altitude: 4,
}