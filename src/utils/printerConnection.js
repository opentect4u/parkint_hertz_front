// import { PermissionsAndroid, Platform } from "react-native";
// import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
// import { appStorage } from "../storage/appStorage";

// export const SELECTED_PRINTER_KEY = "selected-printer";

// const ensureAndroidBluetoothPermissions = async () => {
//   if (Platform.OS !== "android") return true;

//   const permissions = {
//     title: "Please Allow Your Printer",
//     message: "Bluetooth access is required to connect to your printer.",
//     buttonNeutral: "Later",
//     buttonNegative: "Cancel",
//     buttonPositive: "Allow",
//   };
//   const connectGranted = await PermissionsAndroid.request(
//     PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//     permissions,
//   );
//   const scanGranted = await PermissionsAndroid.request(
//     PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//     permissions,
//   );

//   return (
//     connectGranted === PermissionsAndroid.RESULTS.GRANTED &&
//     scanGranted === PermissionsAndroid.RESULTS.GRANTED
//   );
// };

// export const connectSelectedPrinter = async () => {
//   const enabled = await BluetoothManager.isBluetoothEnabled();
//   if (!enabled || !(await ensureAndroidBluetoothPermissions())) return null;

//   const savedPrinter = appStorage.getString(SELECTED_PRINTER_KEY);
//   if (!savedPrinter) return null;

//   try {
//     const printer = JSON.parse(savedPrinter);
//     if (!printer?.address) return null;
//     await BluetoothManager.connect(printer.address);
//     return printer;
//   } catch (error) {
//     console.log("Unable to restore selected printer:", error);
//     return null;
//   }
// };

import { PermissionsAndroid, Platform } from "react-native";
import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
import { appStorage } from "../storage/appStorage";

export const SELECTED_PRINTER_KEY = "selected-printer";

const ensureAndroidBluetoothPermissions = async () => {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    // Android 12+
    if (Platform.Version >= 31) {
      const permissions = {
        title: "Bluetooth Permission",
        message: "Bluetooth access is required to connect to your printer.",
        buttonNeutral: "Later",
        buttonNegative: "Cancel",
        buttonPositive: "Allow",
      };

      const connectGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        permissions,
      );

      const scanGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        permissions,
      );

      return (
        connectGranted === PermissionsAndroid.RESULTS.GRANTED &&
        scanGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    // Android < 12
    return true;
  } catch (error) {
    console.log("Bluetooth permission error:", error);
    return false;
  }
};

/**
 * Only reads the saved printer.
 *
 * IMPORTANT:
 * This function DOES NOT connect to the printer.
 */
export const getSelectedPrinter = async () => {
  try {
    const savedPrinter = appStorage.getString(SELECTED_PRINTER_KEY);

    if (!savedPrinter) {
      return null;
    }

    const printer = JSON.parse(savedPrinter);

    if (!printer?.address) {
      return null;
    }

    return printer;
  } catch (error) {
    console.log("Unable to read selected printer:", error);
    return null;
  }
};

/**
 * Explicitly connect to selected printer.
 *
 * Call this only when you actually want to connect.
 */
export const connectSelectedPrinter = async () => {
  try {
    const permissionGranted = await ensureAndroidBluetoothPermissions();

    if (!permissionGranted) {
      return null;
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();

    if (!enabled) {
      return null;
    }

    const printer = await getSelectedPrinter();

    if (!printer?.address) {
      return null;
    }

    console.log("Connecting to printer:", printer.address);

    await BluetoothManager.connect(printer.address);

    return printer;
  } catch (error) {
    console.log("Unable to connect to selected printer:", error);
    return null;
  }
};