import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  DeviceEventEmitter,
  NativeEventEmitter,
  Platform,
} from "react-native";

import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
import { connectSelectedPrinter } from "./printerConnection";
// import { connectSelectedPrinter } from "../utils/printerConnection";

export const usePrinter = () => {
  const [printerConnected, setPrinterConnected] = useState(false);
  const [checkingPrinter, setCheckingPrinter] = useState(true);
  const [printerName, setPrinterName] = useState("");

//   const checkPrinterConnection = useCallback(async () => {
//     try {
//       setCheckingPrinter(true);

//       const bluetoothEnabled =
//         await BluetoothManager.isBluetoothEnabled();

//       if (!bluetoothEnabled) {
//         setPrinterConnected(false);
//         setPrinterName("");
//         return false;
//       }

//       const savedPrinter = await connectSelectedPrinter();

//       if (savedPrinter?.address) {
//         setPrinterConnected(true);
//         setPrinterName(
//           savedPrinter.name || savedPrinter.address
//         );

//         return true;
//       }

//       setPrinterConnected(false);
//       setPrinterName("");

//       return false;
//     } catch (error) {
//       console.log("Printer connection check failed:", error);

//       setPrinterConnected(false);
//       setPrinterName("");

//       return false;
//     } finally {
//       setCheckingPrinter(false);
//     }
//   }, []);

const connectingRef = useRef(false);

const checkPrinterConnection = useCallback(async () => {
  if (connectingRef.current) {
    return;
  }

  try {
    setCheckingPrinter(true);
    connectingRef.current = true;

    const bluetoothEnabled =
      await BluetoothManager.isBluetoothEnabled();

    if (!bluetoothEnabled) {
      setPrinterConnected(false);
      setPrinterName("");
      return;
    }

    const savedPrinter =
      appStorage.getString("selected-printer");

    if (!savedPrinter) {
      setPrinterConnected(false);
      setPrinterName("");
      return;
    }

    const printer = JSON.parse(savedPrinter);

    if (!printer?.address) {
      setPrinterConnected(false);
      setPrinterName("");
      return;
    }

    // Try connection only once
    const connectedPrinter =
      await connectSelectedPrinter();

    if (connectedPrinter?.address) {
      setPrinterConnected(true);
      setPrinterName(
        connectedPrinter.name || "Printer"
      );
    } else {
      setPrinterConnected(false);
      setPrinterName("");
    }

  } catch (error) {
    console.log(
      "Printer check error:",
      error
    );

    setPrinterConnected(false);
    setPrinterName("");

  } finally {
    connectingRef.current = false;
    setCheckingPrinter(false);
  }
}, []);




  const verifyPrinterBeforePrint = useCallback(async () => {
    try {
      const bluetoothEnabled =
        await BluetoothManager.isBluetoothEnabled();

      if (!bluetoothEnabled) {
        setPrinterConnected(false);
        setPrinterName("");
        return false;
      }

      const printer = await connectSelectedPrinter();

      if (printer?.address) {
        setPrinterConnected(true);
        setPrinterName(
          printer.name || printer.address
        );

        return true;
      }

      setPrinterConnected(false);
      setPrinterName("");

      return false;
    } catch (error) {
      console.log("Printer verification failed:", error);

      setPrinterConnected(false);
      setPrinterName("");

      return false;
    }
  }, []);

  useEffect(() => {
    // checkPrinterConnection();

    AppState.addEventListener("change", nextState => {
  if (nextState === "active") {
    checkPrinterConnection();
  }
});

    const emitter =
      Platform.OS === "ios"
        ? new NativeEventEmitter(BluetoothManager)
        : DeviceEventEmitter;

    const connectionLostSubscription =
      emitter.addListener(
        BluetoothManager.EVENT_CONNECTION_LOST,
        () => {
          console.log("Printer connection lost");

          setPrinterConnected(false);
          setPrinterName("");
        }
      );

    const appStateSubscription =
      AppState.addEventListener("change", nextState => {
        if (nextState === "active") {
          checkPrinterConnection();
        }
      });

    return () => {
      connectionLostSubscription.remove();
      appStateSubscription.remove();
    };
  }, [checkPrinterConnection]);

  return {
    printerConnected,
    checkingPrinter,
    printerName,
    checkPrinterConnection,
    verifyPrinterBeforePrint,
  };
};