import * as theme from '../assets/themes/default.json';
import * as Geocoder from "../GeocoderProvider";
import PointListItem from "./PointListItem.js";
import React, { Component } from "react";
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
    Alert,
} from "react-native";
import MapView, { Marker } from 'react-native-maps';
import { HeaderBackButton } from 'react-navigation';
import DialogInput from "react-native-dialog-input";
import Modal from "react-native-modal";

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

export default class MapDisplay extends Component {
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
            this.saveUserPosition = this.saveUserPosition.bind(classContext);
            this.positionFetchError = this.positionFetchError.bind(classContext);
            this.renderTopConditionaly = this.renderTopConditionaly.bind(classContext);
            this.renderItem = this.renderItem.bind(classContext);
            this.onPressListItem = this.onPressListItem.bind(classContext);
            this.renderMapView = this.renderMapView.bind(classContext);
            this.onSubmitMapTitleDialog = this.onSubmitMapTitleDialog.bind(classContext);
            this.onCancelMapTitleDialog = this.onCancelMapTitleDialog.bind(classContext);
            this.onSubmitPointTitleDialog = this.onSubmitPointTitleDialog.bind(classContext);
            this.onCancelPointTitleDialog = this.onCancelPointTitleDialog.bind(classContext);
            this.onMapLongPress = this.onMapLongPress.bind(classContext);
            this.onMarkerPress = this.onMarkerPress.bind(classContext);
            this.onBackButtonPress = this.onBackButtonPress.bind(classContext);
            this.saveUserMap = this.saveUserMap.bind(classContext);
            this.showMenu = this.showMenu.bind(classContext);
            this.onListItemLongPress = this.onListItemLongPress.bind(classContext);
        }
        this.bindFunctions(this);
        // private vars
        this._ongoingPointChange = null;
        this._mapViewRef = null;
        this._flatListRef = null;
        this._markerRefs = new Map();
        this._firebaseProvider = this.props.navigation.getParam('firebaseProv');
        // get arguments and set-up initial state
        let userMap = this.props.navigation.getParam('userMap', null);
        let shouldPopUp;
        if (!userMap) {
            shouldPopUp = true
            userMap = {
                documentId: null,
                title: null,
                location: null,
                points: []
            }
        } else shouldPopUp = false;
        this.state = {
            modalId: null,
            shouldShowMapTitleChange: shouldPopUp,
            shouldShowPointTitleChange: false,
            shouldShowPointEditMenu: false,
            userMap: userMap,
            position: null,
            isFetchingLocation: true,
            shownLocations: []
        }
    }

    componentDidMount() {
        const headerTitle = this.state.userMap.title ? this.state.userMap.title : "New Map";
        this.props.navigation.setParams({
            save: this.saveUserMap,
            more: this.showMenu,
            back: this.onBackButtonPress,
            title: headerTitle
        });
        BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPress);
        const watchId = navigator.geolocation.watchPosition(
            ((pos) => this.saveUserPosition(pos, watchId)),
            ((err) => this.positionFetchError(err)),
            geoOptions);
        if (this.props.navigation.getParam('userMap', null)) {
            let coords = this.state.userMap.points.map((point) => {
                return [point.location.latitude, point.location.longitude];
            });
            Geocoder.getAddressFromLocation(coords, (places) => (
                this.setState({ shownLocations: places })));
        }
    }

    componentWillUnmount() {
        navigator.geolocation.clearWatch(this.state.watchId);
        BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPress);
    }

    // default render method
    render() {
        return (
            <View style={styles.container}>
                {/* google map or loading wheel */}
                {this.renderTopConditionaly()}
                {/* user points list */}
                <View style={styles.listContainer}>
                    <FlatList
                        ref={(ref) => this._flatListRef = ref}
                        style={{ flex: 1, width: '100%' }}
                        data={this.state.userMap.points}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => item.title}
                    />
                </View>
                {/* input dialogs and menus */}
                <DialogInput
                    isDialogVisible={this.state.shouldShowMapTitleChange}
                    message={"Map title:"}
                    hintInput={"My custom map..."}
                    initValueTextInput={this.state.userMap.title}
                    submitInput={this.onSubmitMapTitleDialog}
                    closeDialog={this.onCancelMapTitleDialog}
                />
                <DialogInput
                    isDialogVisible={this.state.shouldShowPointTitleChange}
                    message={"Point title:"}
                    hintInput={"Give me a name!..."}
                    initValueTextInput={""}
                    submitInput={this.onSubmitPointTitleDialog}
                    closeDialog={this.onCancelPointTitleDialog}
                />
                <PointEditMenu 
                    isVisible={this.state.shouldShowPointEditMenu}
                    onClose={() => this.setState({ shouldShowPointEditMenu: false })}
                />
            </View>
        );
    }

    // render map based on location or user's data availability
    renderTopConditionaly() {
        // if user is availible to zoom to the first point
        if (this.props.navigation.getParam('userMap', null)) {
            const camera = {
                center: {
                    latitude: this.state.userMap.points[0].location.latitude,
                    longitude: this.state.userMap.points[0].location.longitude,
                },
                pitch: 0,
                heading: 0,
                zoom: 13,
                altitude: 32
            }
            return this.renderMapView(camera);
        }
        // if not, user's location might be in loading
        else if (this.state.isFetchingLocation) {
            return (
                <View style={styles.topContainer}>
                    <Text style={{ padding: 10 }}>Initialising map</Text>
                    <ActivityIndicator
                        size={80}
                        color={theme.color.light}
                    />
                    <Text style={{ padding: 10 }}>Please wait...</Text>
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
            return this.renderMapView(camera);
            // unable to get users position, set zoom to static location (UK)
            // return MapView component
        } else return this.renderMapView(cameraUK)
    }

    // Renders MapView Compontent
    renderMapView(camera) {
        return (
            <View style={styles.topContainer}>
                <MapView
                    ref={(ref) => this._mapViewRef = ref}
                    style={styles.map}
                    onLongPress={this.onMapLongPress}
                    showsUserLocation={true}
                    camera={camera}
                >
                    {this.state.userMap.points.map(marker => (
                        <Marker
                            ref={(ref) => this._markerRefs.set(marker, ref)}
                            key={marker.title}
                            onPress={this.onMarkerPress}
                            coordinate={{
                                latitude: marker.location.latitude,
                                longitude: marker.location.longitude
                            }}
                            title={marker.title}
                            description={marker.description}
                        />
                    ))}
                </MapView>
            </View>
        );
    }

    onSubmitMapTitleDialog(input) {
        let usrMp = this.state.userMap;
        usrMp.title = input;
        this.props.navigation.setParams({ title: usrMp.title });
        this.setState({
            userMap: usrMp,
            shouldSave: true,
            shouldShowMapTitleChange: false
        });
    }

    onCancelMapTitleDialog = () => this.setState({ shouldShowMapTitleChange: false });

    onSubmitPointTitleDialog(input) {
        if (this.state.userMap.points.filter((marker) => marker.title === input).length > 0) {
            ToastAndroid.show('Marker with this title already exists', ToastAndroid.SHORT);
            return;
        }
        let userMap = this.state.userMap;
        let marker = this._ongoingPointChange;
        // is existing marker being modified?
        if (this.state.userMap.points.indexOf(marker) !== -1) {
            userMap.points[userMap.points.indexOf(marker)].title = input;
            this.setState({
                userMap: userMap,
                shouldSave: true,
                shouldShowPointTitleChange: false
            }, () => this._ongoingPointChange = null);
        } else { //  or is new marker being added?
            marker.title = input;
            const coords = [[
                marker.location.latitude,
                marker.location.longitude
            ]];
            Geocoder.getAddressFromLocation(coords, (places) => {
                let place = places[0];
                let shownLocations = this.state.shownLocations;
                userMap.points.push(marker);
                shownLocations.push(place);
                this.setState({
                    shownLocations: shownLocations,
                    userMap: userMap,
                    shouldSave: true,
                    shouldShowPointTitleChange: false
                }, () => this._ongoingPointChange = null);
            });
        }
        this._ongoingPointChange = null;
        this.setState({ shouldShowPointTitleChange: false });
    }

    onCancelPointTitleDialog() {
        this._ongoingPointChange = null;
        this.setState({ shouldShowPointTitleChange: false });
    }

    // FlatList item render method
    renderItem({ item }) {
        const markerIndex = this.state.userMap.points.indexOf(item);
        return (
            <PointListItem
                title={item.title}
                location={this.state.shownLocations[markerIndex]}
                onPress={this.onPressListItem}
                onLongPress={this.onListItemLongPress}
            />
        );
    }

    // save user's position to the components state
    saveUserPosition(position, id) {
        this.setState({
            watchId: id,
            position: position,
            isFetchingLocation: false
        });
    }

    // position fetch error callback
    positionFetchError(err) {
        console.warn(err);
        this.setState({
            isFetchingLocation: false
        });
        ToastAndroid.show('Unable to get location.', ToastAndroid.SHORT);
    }

    // validate and and attemnt to save map to firebase
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

    // show the marker's info window and scroll to its position in the list 
    onMarkerPress(event) {
        const coords = event.nativeEvent.coordinate;
        // TODO
        const point = this.state.userMap.points.find((mark) => {
            const isLocEqual = mark.location.latitude === coords.latitude &&
                mark.location.longitude === coords.longitude;
            return isLocEqual;
        });
        if (point) {
            this._flatListRef.scrollToItem({
                animated: true,
                item: point,
            });
        }
    }

    // animate camera to the map marker and display the info window
    onPressListItem(title) {
        const point = this.state.userMap.points
            .find((mark) => mark.title === title);
        const camera = {
            center: {
                latitude: point.location.latitude,
                longitude: point.location.longitude,
            },
            pitch: 0,
            heading: 0,
            zoom: 13,
            altitude: 4,
        }
        this._mapViewRef.animateCamera(camera, { duration: 1200 })
        this._markerRefs.get(point).showCallout();
    }

    onListItemLongPress(title) {
        this.setState({ shouldShowPointEditMenu: true })
    }

    // add marker to the map
    onMapLongPress(event) {
        const coords = event.nativeEvent.coordinate;
        const geoPoint = this._firebaseProvider.getGeoPoint(coords.latitude, coords.longitude);
        let newPoint = {
            title: "New Point" + this.state.userMap.points.length,
            description: null,
            location: geoPoint
        };
        this._ongoingPointChange = newPoint;
        this.setState({ shouldShowPointTitleChange: true });
    }

    // Show toolbar menu
    showMenu = () => console.log("Menu pressed!")

    // override default hardware/navigation back button press
    onBackButtonPress() {
        console.log("onBackButtonPress pressed!");
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

class SaveButton extends Component {
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

/*
 * Children Components 
 */

class HeaderButtons extends Component {
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

class PointEditMenu extends Component {
    constructor() {
        super();
        this._onClose = this._onClose.bind(this);
        this._onEditDescription = this._onEditDescription.bind(this);
        this._onEditTitle = this._onEditTitle.bind(this);
        this._onDeletePoint = this._onDeletePoint.bind(this);
    }

    render() {
        return (
            <Modal
                isVisible={this.props.isVisible}
                backdropOpacity={0.8}
                animationIn="zoomInDown"
                animationOut="zoomOutUp"
                animationInTiming={600}
                animationOutTiming={600}
                backdropTransitionInTiming={600}
                backdropTransitionOutTiming={600}
                onBackButtonPress={this._onClose}
                onBackdropPress={this._onClose}
                style={styles.menuContainer}
            >
                <View style={styles.pointEditMenu}>
                    <Text style={styles.pointEditMenuTitle}>
                        {"_test_"}
                    </Text>
                    <TouchableOpacity>
                        <Text style={styles.pointMenuItem}>Edit Title</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text style={styles.pointMenuItem}>Edit description</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text
                            style={{ ...styles.pointMenuItem, color: 'red', paddingTop: 10 }}
                        >
                            Delete Point
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    _onClose = () => this.props.onClose();

    _onEditDescription = () => this.props.onEditDescription();

    _onEditTitle = () => this.props.onEditTitle();

    _onDeletePoint = () => this.props.onDeletePoint();
}


/* 
 * Stylesheet
 */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topContainer: {
        height: '65%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.color.backgroundColor,
        borderColor: theme.color.dark,
        borderBottomWidth: 1,
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
    pointEditMenu: {
        top: '36%',
        backgroundColor: 'white',
        padding: 18,
        marginRight: 22,
        marginLeft: 22,
        justifyContent: 'center',
        alignItems: 'center',
        //alignSelf: 'center',
        borderRadius: 4,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    pointEditMenuTitle: {
        marginBottom: 16,
        color: theme.color.dark, fontSize: 18, fontWeight: 'bold'
    },
    pointMenuItem: {
        fontSize: 16,
        marginBottom: 12,
    },
});