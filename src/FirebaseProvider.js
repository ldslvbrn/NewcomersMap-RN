import * as firebase from 'firebase';
import 'firebase/firestore';


/*
 * Firebase Firestore API wrapper class. 
 * Authentication requiredin order to access or upload any data. 
 */
export default class FirebaseProvider {
    constructor() {
        this.authenticate = this.authenticate.bind(this);
        this.signOut = this.signOut.bind(this);
        this.getAllMaps = this.getAllMaps.bind(this);
        if (!firebase.apps.length) {
            firebase.initializeApp(_config);
        }
        this._authProvider = new firebase.auth.GoogleAuthProvider();
        this._user = null;
        this._db = null;
    }

    async authenticate(token, callback) {
        const credential = this._authProvider.credential(token);
        // await firebase.auth().signInWithCredential(credential)
        await firebase.auth().signInAndRetrieveDataWithCredential(credential)
            .then((user) => {
                this._user = user;
                this._db = firebase.firestore();
                if (callback) callback();
            })
            .catch((err) => console.warn(err));
    }

    async signOut(callback) {
        firebase.auth().signOut()
            // .then(() => { if (callback) callback(); })
            .then(() => (callback ? callback(): null))
            .catch((err) => console.warn(err));
    }

    async getAllMaps() {
        const maps = await this._db
            .collection(_usersDbCollection)
            .doc(this._user.user.uid)
            .collection(_userMapsDbCollection)
            .get();
        return maps.docs.map((docSnapshot) => {
            let userMap = docSnapshot.data();
            userMap.documentId = docSnapshot.id;
            return userMap;
        });
    }

    async updateUserMap(map, callback) {
        const documentId = map.documentId;
        delete map.documentId;
        await this._db.collection(_usersDbCollection)
            .doc(this._user.user.uid)
            .collection(_userMapsDbCollection)
            .doc(documentId)
            .set(map)
            .then(() => (callback ? callback(true): null))
            .catch(() => (callback ? callback(false): null));
    }

    async addUserMap(map, callback) {
        map.location = map.points[0].location;
        await this._db.collection(_usersDbCollection)
            .doc(this._user.user.uid)
            .collection(_userMapsDbCollection)
            .add(map)
            .then((ref) => (callback ? callback(ref.id): null))
            .catch(() => (callback ? callback(null): null));
    }

    getGeoPoint(latitude, longitude) {
        return new firebase.firestore.GeoPoint(latitude, longitude);
    }
}

const _config = {
    apiKey: "AIzaSyB8RgE8Vm1IMwMxlkq09FYB-fFm1wsHz2A",
    authDomain: "newcomersmap-4d53e.firebaseapp.com",
    databaseURL: "https://newcomersmap-4d53e.firebaseio.com",
    projectId: "newcomersmap-4d53e",
    storageBucket: "newcomersmap-4d53e.appspot.com",
    messagingSenderId: "323664508081"
};

const _usersDbCollection = "users";
const _userMapsDbCollection = "userMaps";
