/* export const getPlaceFromLocation = async (latitude, longitude, callback) => {
    await createApiRequest(latitude, longitude)
        .then((place) => callback(place));
}; */

export const getRegionFromLocation = async (coords, callback) => {
    let places = await coords.map(latLng => createApiRequest(latLng[0], latLng[1], 6));
    await Promise.all(places).then((locs) => {
        let address = locs.map((loc) => loc.formatted_address);
        console.log(address);
        callback(address);
    });

    /* let places = await coords.map(latLng => createApiRequest(latLng[0], latLng[1]));
    await Promise.all(places).then((locs) => {
        // let formatedAddresses = locs.map((loc) => loc.formatted_address);
        let countryName = locs.map((loc) => {
            return loc.address_components[loc.address_components.length - 1]
                .long_name;
        });
        console.log(countryName);
        callback(countryName);
    }); */
    
};

export const getAddressFromLocation = async (coords, callback) => {
    let places = await coords.map(latLng => createApiRequest(latLng[0], latLng[1]));
    await Promise.all(places).then((locs) => {
        let address = locs.map((loc) => loc.formatted_address);
        console.log(address);
        callback(address);
    });
    
};

const createApiRequest = async (latitude, longitude, resultIndex) => {
    const request = baseUrl +
        "latlng=" + latitude + "," + longitude +
        "&key=" + apiKey;
    const result = await fetch(request);
    const data = await result.json();
    console.log(request);
    console.log(data);
    if(resultIndex) {
        return data.results[resultIndex];
    } else return data.results[0];
};

const baseUrl = "https://maps.googleapis.com/maps/api/geocode/json?";
const apiKey = "AIzaSyD0p7kot4EGQq497UOrmtVJnR0fnM1821E";