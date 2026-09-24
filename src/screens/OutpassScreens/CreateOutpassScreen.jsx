import { StyleSheet, Text, View, PixelRatio, ToastAndroid, ActivityIndicator, PermissionsAndroid, ScrollView, Alert } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';

import DeviceInfo from "react-native-device-info";
import colors from '../../resources/colors/colors';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import axios from 'axios';
import { ADDRESSES } from '../../routes/addresses';
import { loginStorage } from '../../storage/appStorage';
import useOutpass from '../../hooks/api/useOutpass';
import { dateTimefixedString } from '../../utils/dateTime';
import { AuthContext } from '../../context/AuthProvider';
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"


import BleManager from "react-native-ble-manager";
import ThermalPrinterModule from "react-native-thermal-printer";
import RadioButton from '../../components/RadioButton';

// For Scanner
import QRCode from 'react-native-qrcode-svg';
import { useIsFocused } from '@react-navigation/native';
import { usePrinter } from '../../utils/usePrinter';




const CreateOutpassScreen = ({ route, navigation }) => {

  const { receiptSettings, generalSettings, gstList } = useContext(AuthContext);

  const { useCarOutpass } = useOutpass();
  // Extract data and others from the route params  
  const { data, others, gstSettings, totalRate } = route.params;
  const [deviceId, setDeviceId] = useState(() => "");
  const [loading, setLoading] = useState(() => false);
  const [isAvailableYet, setisAvailableYet] = useState(() => false);
  const [getBlePermission, setBlePermission] = useState();
  const loginData = JSON.parse(loginStorage.getString("login-data"));
  const device_Type_Check = loginData.user.userdata.msg[0].device_type;

  const [radioState, setRadioState] = useState(false);
  const [getPayMode, setPayMode] = useState('C');
  const radioOptions = [
    { label: 'Cash: ', value: 'C' },
    { label: 'UPI: ', value: 'U' },
  ];

  // For Scanner
  const receiptNoObj = data.find(item => item.label === "RECEIPT NO");

    const isFocused = useIsFocused();
  
    const {
    printerConnected,
    checkingPrinter,
    printerName,
    verifyPrinterBeforePrint,
    } = usePrinter();




  const handleRadioSelect = (value) => {
    setRadioState(!radioState);

    setPayMode(value);
    // var carindata = [];
    // console.log(value, 'upiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii', getPayMode);

  };

  useEffect(() => {



    // console.log('datadatadatadatadatadatadata', data, 'datadatadatadatadatadatadata', receiptNoObj.value);

    // console.log(route.params,'/////////data',data, '/////////others', others, '/////////gstSettings',gstSettings, '/////////totalRate',totalRate, 'utsabutsabutsabutsabutsabutsab', gstSettings);
    //set device/appid id
    const deviceId = DeviceInfo.getUniqueIdSync();
    setDeviceId(deviceId);

  }, []);


  // checked device bluetooth status

  async function checkLocationEnabled() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Bluetooth Permission",
          message:
            "This app needs access to your location to check Bluetooth status.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        BleManager.enableBluetooth()
          .then(() => {
            console.log("The bluetooth is already enabled or the user confirm");
          })
          .catch(error => {
            // Failure code
            console.log("The user refuse to enable bluetooth");
          });
        // const isEnabled = await BluetoothStatus.isEnabled();
        // console.log('Bluetooth Enabled:', isEnabled);
      } else {
        console.log("Bluetooth permission denied");
      }
    } catch (error) {
      console.log("Error checking Bluetooth status:", error);
    }
  }

  useEffect(() => {
    if (device_Type_Check == "M") {
      try {
        async function blueTooth() {
          const bluetoothConnectGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          )
          setBlePermission(bluetoothConnectGranted === PermissionsAndroid.RESULTS.GRANTED);
        }

        blueTooth()

      } catch (err) {
      }
    }
  }, [])



  useEffect(() => {
  if(isFocused && device_Type_Check == "M"){
  verifyPrinterBeforePrint();
  }
  }, [isFocused]);

  const handlePrintReceipt = async () => {
    
    if(device_Type_Check == "M"){
      const printerAvailable = await verifyPrinterBeforePrint();

      if (!printerAvailable) {
      Alert.alert(
      "Printer Status",
      "Printer is not connected. Please turn on the printer and try again.",
      [
      {
      text: "OK",
      // onPress: () => navigation.navigate(printScreen),
      },
      ]
      );

      return;
      }
    }

    let paid_amt = totalRate.paid_amt ? totalRate.paid_amt : totalRate.base_amt;

    let GST_Header = "";
    let pay_Mode = "";

    // return 0


    // with gst without gst car outpass send to server

    // utsab here pass GST Flag, CGST%, SGST%  Backend developer Calculate START
    

    if (generalSettings.gst_flag == "Y") {
      console.log(deviceId, totalRate.date, others.receipt_no, totalRate.base_amt, gstSettings?.cgst, gstSettings?.sgst, paid_amt, generalSettings.gst_flag, others.vehicle_id, others.vehicle_no, others.date_time_in, getPayMode, 'jjjjjjjjjjjjjjjjj');
      
      var insert_car_outpass = await useCarOutpass(deviceId, totalRate.date, others.receipt_no, totalRate.base_amt, gstSettings?.cgst, gstSettings?.sgst, paid_amt, generalSettings.gst_flag, others.vehicle_id, others.vehicle_no, others.date_time_in, getPayMode);
    console.log(insert_car_outpass, 'insert_car_outpassinsert_car_outpass', insert_car_outpass?.data?.vehicle_outpass?.suc);
    
    
    }

    if (generalSettings.gst_flag == "N") {
      var insert_car_outpass = await useCarOutpass(deviceId, totalRate.date, others.receipt_no, totalRate.base_amt, 0, 0, paid_amt, generalSettings.gst_flag, others.vehicle_id, others.vehicle_no, others.date_time_in, getPayMode);
    }
    // utsab here pass GST Flag, CGST%, SGST%  Backend developer Calculate END





    //if upload server successfully then print receipt
    // if (insert_car_outpass?.data?.update_car_in_flag_status?.suc == 1) {
    if (insert_car_outpass?.data?.vehicle_outpass?.suc == 1) {  

      // Use for Mobile Device Start 
      if (getBlePermission && device_Type_Check == "M") {

        console.log(data, 'datadatadatadata');
        
        let payloadHeader = "";
        let payloadBody = "";
        let payloadFooter = "";
        await checkLocationEnabled();
        data.map((props, index) => (
          payloadBody += `${props?.label} : ${props?.value}\n`
        ));




        // `[L]<font size='normal'>VEHICLE NO : [R] ${vehicleNumber}</font>\n` +
        if (receiptSettings?.OUT_on_off == "Y") {
          if (receiptSettings.header1_flag == 1) {
            // payloadHeader += `\n[C]<font size='tall'>${receiptSettings.header1}</font>\n`;
            payloadHeader += `${receiptSettings.header1}\n`;
          }

          if (receiptSettings.header2_flag == 1) {
            // payloadHeader += `[C]<font size='small'>${receiptSettings.header2}</font>\n`;
            payloadHeader += `${receiptSettings.header2}\n`;
          }

          if (receiptSettings.header3_flag == 1) {
            // payloadHeader += `[C]<font size='small'>${receiptSettings.header3}</font>\n`;
            payloadHeader += `${receiptSettings.header3}\n`;
          }

          if (receiptSettings.header4_flag == 1) {
            // payloadHeader += `[C]<font size='small'>${receiptSettings.header4}</font>\n`;
            payloadHeader += `${receiptSettings.header4}\n`;
          }

          // if (generalSettings.gst_flag == "Y") {
          //   // GST_Header += await BluetoothEscposPrinter.printText(`GST No.: ${gstList.gst_number}\n`, { align: "center" });
          //   GST_Header += `GST No.: ${gstList.gst_number}\n`;
          // } else {
          //   GST_Header += ``;
          // }

          if (receiptSettings.footer1_flag == 1) {
            // payloadFooter += `\n[C]<font size='small'>${receiptSettings.footer1}</font>\n`;
            payloadFooter += `${receiptSettings.footer1}\n`;
          }
          if (receiptSettings.footer2_flag == 1) {
            // payloadFooter += `[C]<font size='small'>${receiptSettings.footer2}</font>\n`;
            payloadFooter += `${receiptSettings.footer2}\n`;
          }
          if (receiptSettings.footer3_flag == 1) {
            // payloadFooter += `[C]<font size='small'>${receiptSettings.footer3}</font>\n`;
            payloadFooter += `${receiptSettings.footer3}\n`;
          }
          if (receiptSettings.footer4_flag == 1) {
            // payloadFooter += `[C]<font size='small'>${receiptSettings.footer4}</font>\n`;
            payloadFooter += `${receiptSettings.footer4}\n`;
          }

        }

        // if (generalSettings.pay_mode_flag == "Y") {
        //   pay_Mode += `${getPayMode == "U" ? `Payment Mode : UPI\n` : "Payment Mode : Cash\n"}`
        // }

        try {
          ToastAndroid.showWithGravityAndOffset(
            "Receipt Created Successfully",
            ToastAndroid.LONG,
            ToastAndroid.BOTTOM,
            25,
            50,
          );

          await BluetoothEscposPrinter.printText("OUTPASS\n", { align: "center" });
          await BluetoothEscposPrinter.printText("-------------------------------\n", { align: "center" });
          await BluetoothEscposPrinter.printText(`${payloadHeader}`, { align: "left" });

          if (generalSettings.gst_flag == "Y") {
            await BluetoothEscposPrinter.printText(`GST No.: ${gstList.gst_number}\n`, { align: "center" });
          }

          
          await BluetoothEscposPrinter.printText("-------------------------------\n", { align: "center" });

          // await BluetoothEscposPrinter.printText(`${payloadBody}`, { align: "left" });
          await Promise.all(
            data.map(async (props) => {
              await BluetoothEscposPrinter.printColumn(
                [12, 1, 16],
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  props?.label?.toString() || "",
                  ":",
                  props?.value?.toString() || "",
                ],
                {}
              );
            })
          );

          if (generalSettings.pay_mode_flag == "Y") {
            await BluetoothEscposPrinter.printText(`${getPayMode == "U" ? `Payment Mode : UPI\n` : "Payment Mode : Cash\n"}`, { align: "left" });
          }


          await BluetoothEscposPrinter.printText("-------------------------------\n", {});
          await BluetoothEscposPrinter.printText(`${payloadFooter}\n`, { align: "center" });
          await BluetoothEscposPrinter.printText("\r\n", {})

          setLoading(false);

        } catch (e) {
          // alert(e.message || "ERROR")
          alert("Printer is not connected.")
          console.log(e.message);
          setLoading(false);
        }



        setisAvailableYet(false);

        navigation.goBack();
      } else if (device_Type_Check == "H") {
        // console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhh', data);
        try {
          let payloadHeader = "";
          let payloadBody = "";
          let payloadFooter = "";
          await checkLocationEnabled();
          data.map((props, index) => (
            payloadBody += `[L]<font size='normal'>${props?.label} : [R] ${props?.value}</font>\n`

          ));






          // `[L]<font size='normal'>VEHICLE NO : [R] ${vehicleNumber}</font>\n` +
          if (receiptSettings?.OUT_on_off == "Y") {
            if (receiptSettings.header1_flag == 1) {
              payloadHeader +=
                `\n[C]<font size='tall'>${receiptSettings.header1}</font>\n`;
            }

            if (receiptSettings.header2_flag == 1) {
              payloadHeader += `[C]<font size='small'>${receiptSettings.header2}</font>\n`;
            }

            if (receiptSettings.header3_flag == 1) {
              payloadHeader += `[C]<font size='small'>${receiptSettings.header3}</font>\n`;
            }

            if (receiptSettings.header4_flag == 1) {
              payloadHeader += `[C]<font size='small'>${receiptSettings.header4}</font>\n`;
            }

            if (generalSettings.gst_flag == "Y") {
              GST_Header += `[C]<font size='small'>GST No.: ${gstList.gst_number}</font>\n`;
            } else {
              GST_Header += ``;
            }


            if (receiptSettings.footer1_flag == 1) {
              payloadFooter += `\n[C]<font size='small'>${receiptSettings.footer1}</font>\n`;
            }
            if (receiptSettings.footer2_flag == 1) {
              payloadFooter += `[C]<font size='small'>${receiptSettings.footer2}</font>\n`;
            }
            if (receiptSettings.footer3_flag == 1) {
              payloadFooter += `[C]<font size='small'>${receiptSettings.footer3}</font>\n`;
            }
            if (receiptSettings.footer4_flag == 1) {
              payloadFooter += `[C]<font size='small'>${receiptSettings.footer4}</font>\n`;
            }



          }

          if (generalSettings.pay_mode_flag == "Y") {
            // pay_Mode += `[L]<font size='normal'>Payment Mode : [R] `${generalSettings.pay_mode_flag == "Y" ? "UPI" : "Cash"}`</font>\n`
            pay_Mode += `${getPayMode == "U" ? `[L]<font size='normal'>Payment Mode : [R]UPI</font>\n` : "[L]<font size='normal'>Payment Mode : [R]Cash</font>\n"}`
            // pay_Mode += `[L]<font size='normal'>Payment Mode : UPI</font>\n`
          }




          // console.log("============zzzzzzzzzzzzzzz==================",payloadFooter);
          await ThermalPrinterModule.printBluetooth({
            payload:
              // `[L]<font size='normal'>Hertz V1.0</font>\n` +
              `[C]<u><font size='tall'>OUTPASS</font></u>\n` +
              `[C]-------------------------------` +
              `[C]${payloadHeader}` +
              // `${GST_Header}` +
              `${payloadBody}` +
              // `${pay_Mode}` +
              `[C]-------------------------------` +
              `[C]${payloadFooter}\n`,
            printerNbrCharactersPerLine: 30,
            printerDpi: 120,
            printerWidthMM: 58,
            mmFeedPaper: 25,
          });

          setLoading(false);

        } catch (err) {
          ToastAndroid.show("ThermalPrinterModule - ReceiptScreen", ToastAndroid.SHORT);
          console.log(err.message);
          setLoading(false);
        }

        setisAvailableYet(false);

        navigation.goBack();
      } else {

        if (device_Type_Check == "M") {
          navigation.goBack();
          ToastAndroid.show("Sorry, Receipt Creation Failed, Allow Nearby Devices", ToastAndroid.SHORT);
        }
        if (device_Type_Check == "H") {
          navigation.goBack();
          ToastAndroid.show("Sorry, Receipt Creation Failed", ToastAndroid.SHORT);
        }


      }
      // Use for Handheld Device End 

    }

  };
  return (
    <>
      {/*  if loading state is true render loading  */}
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '35%',
            backgroundColor: colors.white,
            padding: PixelRatio.roundToNearestPixel(20),
            borderRadius: 10,
          }}>
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      )}
      {/* render custom header */}
      <CustomHeader title={'Printer Preview'} />
      <ScrollView>

         {device_Type_Check == "M" && (
                 <View style={styles.container__Scanner}>
                 {printerConnected ? (
                 <View style={styles.printerStatus}>
                 <View style={styles.statusDotConnected} />
                 <Text style={styles.printerConnectedText} numberOfLines={1}>
                 Printer Name: {printerName}
                 </Text>
                 </View>
                 ) : (
                 <View style={styles.printerStatus}>
                 <View style={styles.statusDotDisconnected} />
                 <Text style={styles.printerDisconnectedText}>
                 Printer Not Connected
                 </Text>
                 </View>
                 )}
                 </View>
                 )}

        {/* render printer preview and action buttons */}
        <View style={{ padding: PixelRatio.roundToNearestPixel(15) }}>
          {/* data  loop run below */}
          {data &&
            data.map((props, index) => (
              <>
                <View key={index}>
                  {/* <Text style={{ fontFamily: 'monospace', color: 'gray' }}>
        {JSON.stringify(props, null, 2)}
      </Text> */}
                  <View style={styles.inLineTextContainer}>
                    <Text style={styles.text}>{props?.label}</Text>
                    <Text style={styles.text}> : {props?.value}</Text>
                  </View>
                  <View style={styles.radioButton}>
                  </View>
                  <View
                    style={{
                      borderBottomColor: 'black',
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    }}
                  />
                </View>
              </>
            ))}

          {/* {generalSettings.pay_mode_flag == "Y" && (
            <View style={styles.radioButton_new}>
              {radioOptions.map(option => (
                <RadioButton
                  key={option.value}
                  label={option.label}
                  // labelStyle={styles.radioButtonText} // Apply text style
                  selected={option.value === getPayMode}
                  onPress={() => handleRadioSelect(option.value)}
                  customFont={20}
                />
              ))}
            </View>
          )} */}

          {/* render action buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: PixelRatio.roundToNearestPixel(10),
            }}>
            {/* render goback button */}
            <CustomButton.CancelButton
              title={'Cancel'}
              onAction={() => {
                navigation.goBack();
              }}
              style={{ flex: 1, marginRight: PixelRatio.roundToNearestPixel(8) }}
            />

            {/*  render printing button */}
            <CustomButton.GoButton
              title={'Print Receipt'}
              onAction={() => {
                handlePrintReceipt();
              }}
              style={{ flex: 1, marginLeft: PixelRatio.roundToNearestPixel(8) }}
              disabled={isAvailableYet ? true : false}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default CreateOutpassScreen;

const styles = StyleSheet.create({
  inLineTextContainer: {
    flexDirection: 'row',
    paddingVertical: PixelRatio.roundToNearestPixel(10),
    alignSelf: 'center',
  },
  radioButton_new: {
    flexDirection: 'row', lineHeight: 24, justifyContent: 'space-between',
    marginTop: 15,
    paddingLeft: 15, paddingRight: 15, display: 'inline',
  },
  radioButtonText: {
    fontSize: 20, // Increases the text size
    color: 'red', // Sets the text color to black
  },
  text: {
    color: colors.black,
    // fontWeight: PixelRatio.roundToNearestPixel(500),
    fontSize: PixelRatio.roundToNearestPixel(18),
  },

  container__Scanner: {
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 8,
    textAlign:'center'
  },

  printerStatus: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: "#F5F7FA",
  borderWidth: 1,
  borderColor: "#E1E5EA",
},  

  statusDotConnected: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    marginRight: 8,
  },

  statusDotDisconnected: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },

  printerConnectedText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#222222",
  textAlign: "center",
  },

  printerDisconnectedText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#DC2626",
  textAlign: "center",
  },

  printerCheckingText: {
  marginLeft: 8,
  fontSize: 14,
  color: "#666666",
  textAlign: "center",
},

});

