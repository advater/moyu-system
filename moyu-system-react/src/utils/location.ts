type TCallback = (e: any) => void;

/**
 * callback获取地理位置geo
 * @param {Function} callback
 */
export function getLocation(callback: TCallback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        callback(position.coords);
      },
      (error) => {
        console.error(`Geolocation error: ${error.message}`);
        callback(null);
      },
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    callback(null);
  }
}

/**
 * promise获取地理位置geo
 * @returns {Promise}
 */
export async function getLocationPromise() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords);
        },
        (error) => {
          console.error(`Geolocation error: ${error.message}`);
          reject(null);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      reject(null);
    }
  });
}

/**
 * callback持续获取地理位置geo
 * @param {Function} callback
 */
export function getLocationWatch(callback: TCallback) {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        callback(position.coords);
      },
      (error) => {
        console.error(`Geolocation error: ${error.message}`);
        callback(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      },
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    callback(null);
  }
}
