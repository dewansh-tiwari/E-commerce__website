/**
 * Location Helper for Big Market 👌
 * Automatically detects current GPS location and reverse-geocodes it
 * into formatted Indian street address, locality, city, state and pincode.
 */

export const detectCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser'));
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try BigDataCloud Client API (fast, free, no rate-limit CORS issues)
          try {
            const bdcRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (bdcRes.ok) {
              const data = await bdcRes.json();
              const locality = data.locality || data.principalSubdivisionDistrict || 'Bandra West';
              const city = data.city || data.principalSubdivision || 'Mumbai';
              const state = data.principalSubdivision || 'Maharashtra';
              const zipCode = data.postcode || '400050';
              const area = `${locality}, ${city}`;

              return resolve({
                area: `${locality}, ${zipCode}`,
                city,
                state,
                locality,
                zipCode,
                street: data.locality || 'Near Main Market Road',
                fullAddress: `${locality}, ${city}, ${state} - ${zipCode}`,
                deliveryTime: '10-15 Mins',
                coordinates: { lat: latitude, lng: longitude }
              });
            }
          } catch (e) {
            console.warn('BigDataCloud geocode failed, trying Nominatim...', e);
          }

          // Fallback to OpenStreetMap Nominatim
          try {
            const osmRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (osmRes.ok) {
              const data = await osmRes.json();
              const addr = data.address || {};
              const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || 'Downtown';
              const city = addr.city || addr.town || addr.county || 'Mumbai';
              const state = addr.state || 'Maharashtra';
              const zipCode = addr.postcode || '400050';

              return resolve({
                area: `${locality}, ${zipCode}`,
                city,
                state,
                locality,
                zipCode,
                street: data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : locality,
                fullAddress: `${locality}, ${city}, ${state} - ${zipCode}`,
                deliveryTime: '10-15 Mins',
                coordinates: { lat: latitude, lng: longitude }
              });
            }
          } catch (e) {
            console.warn('Nominatim fallback failed', e);
          }

          // Fallback with coordinates
          resolve({
            area: `GPS Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
            city: 'Mumbai',
            state: 'Maharashtra',
            locality: 'Current Location',
            zipCode: '400050',
            street: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            fullAddress: `Detected Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            deliveryTime: '12 Mins',
            coordinates: { lat: latitude, lng: longitude }
          });
        } catch (err) {
          reject(err);
        }
      },
      (error) => {
        // Fallback default if user denies permission or browser errors
        resolve({
          area: 'Bandra West, 400050',
          city: 'Mumbai',
          state: 'Maharashtra',
          locality: 'Bandra West',
          zipCode: '400050',
          street: 'Flat 402, Green Meadows, Link Road',
          fullAddress: 'Bandra West, Mumbai, Maharashtra - 400050',
          deliveryTime: '15 Mins',
          isFallback: true,
          error: error.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
};
