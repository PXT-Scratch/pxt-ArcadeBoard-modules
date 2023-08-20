/**
* 使用此文件来定义自定义函数和图形块。
* 想了解更详细的信息，请前往 https://arcade.makecode.com/blocks/custom
*/
enum ModuleIndex {
    //% block="module1"
    Module1,
    //% block="module2"
    Module2,
    //% block="module3"
    Module3,
    //% block="module4"
    Module4
}
enum ADCIndex {
    //% block="A1"
    CH1,
    //% block="A2"
    CH2,
    //% block="A3"
    CH3,
    //% block="A4"
    CH4,
    //% block="A5"
    CH5,
    //% block="A6"
    CH6
}
enum DigitalPinIndex {
    //% block="1"
    P10,
    //% block="2"
    P11,
    //% block="3"
    P16,
    //% block="4"
    P17,
    //% block="5"
    P34,
    //% block="6"
    P35,
    //% block="7"
    P36,
    //% block="8"
    P37
}
enum DigitalOutputIndex {
    //% block="LOW"
    LOW,
    //% block="HIGH"
    HIGH
}
enum THMesure {
    //% block="humidity"
    humidity,
    //% block="temperature"
    temperature,
}
enum ServeIndex {
    //% block="CH1"
    CH1,
    //% block="CH2"
    CH2,
    //% block="CH3"
    CH3,
    //% block="CH4"
    CH4
}
function validate(str: String): Boolean {
    let isfloat = false;
    let len = str.length;
    if (len > 5) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if (str.charAt(i) == ".") {
            isfloat = true;
            return true;
        }
    }
    if (!isfloat && len == 5) {
        return false;
    }
    return true;
}
/**
 * Custom blocks
 */
//% weight=100 color=#FF9500 icon=""
namespace cookieModules {
    const PM_ADDRESS = 0x26//电位器26-29//3031不好用
    const SEG_ADDRESS = 0x22//数码管22-25
    const DigitalIn_ADDRESS = 0x36//单个//
    const DigitalOutPut_ADDRESS = 0x37//单个//
    const ADC_ADDRESS = 0x40//单个
    const HM_ADDRESS = 0x41//41-44
    const PH_ADDRESS = 0x45//45-48
    const TURBIDITY_ADDRESS = 0x52//52-55
    const SOILMOISTURE_ADDRESS = 0x56//56-59
    const SERVE_ADDRESS = 0x60//56-59
    const SONAR_ADDRESS = 0x61//61-64//
    //将字符串格式化为UTF8编码的字节
    let writeUTF = function (str: String, isGetBytes?: boolean) {
        let back = [];
        let byteSize = 0;
        let i = 0;
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (0x00 <= code && code <= 0x7f) {
                byteSize += 1;
                back.push(code);
            } else if (0x80 <= code && code <= 0x7ff) {
                byteSize += 2;
                back.push((192 | (31 & (code >> 6))));
                back.push((128 | (63 & code)))
            } else if ((0x800 <= code && code <= 0xd7ff)
                || (0xe000 <= code && code <= 0xffff)) {
                byteSize += 3;
                back.push((224 | (15 & (code >> 12))));
                back.push((128 | (63 & (code >> 6))));
                back.push((128 | (63 & code)))
            }
        }
        for (i = 0; i < back.length; i++) {
            back[i] &= 0xff;
        }
        return back;

    }
    //限幅
    function constract(val: number, minVal: number, maxVal: number): number {
        if (val > maxVal) {
            return maxVal;
        } else if (val < minVal) {
            return minVal;
        }
        return val;
    }
    //有效性判断
    function validate(str: String): Boolean {
        let isfloat = false;
        let len = str.length;
        if (len > 5) {//长度大于5
            return false;//错误
        }
        for (let i = 0; i < len; i++) {//有没有小数点
            if (str.charAt(i) == ".") {
                isfloat = true;//有小数点的话，是浮点数且返回是
                return true;
            }
        }
        if (!isfloat && len == 5) {//若不是浮点，却长度等于5.返回错误
            return false;
        }
        return true;
    }
    /**
     * TODO: 显示数码管数值。
     */
    //% blockId=display_seg_number block="control seg %module display number %num"
    //% weight=65
    export function displaySegNumber(module: ModuleIndex, num: number) {
        let buf = pins.createBuffer(4);
        buf[0] = 0;
        buf[1] = 0;
        buf[2] = 0;
        buf[3] = 0;
        let str_num = num.toString();//数字转为字符串
        let len = str_num.length;//取长度
        let j = 0;
        if (validate(str_num)) {//判断是否需要处理
            for (let i = len - 1; i >= 0; i--) {//从后往前判断
                if (str_num.charAt(i) == '.') {//如果有小数点。
                    buf[3 - j] = (str_num.charCodeAt(i - 1) - '0'.charCodeAt(0)) | 0x80;//最高位置1
                    i--;
                } else if (str_num.charAt(i) == "-") {
                    buf[3 - j] = 0x40;  //这一位为64
                } else {
                    buf[3 - j] = str_num.charCodeAt(i) - '0'.charCodeAt(0);
                }
                j++;
            }
            pins.i2cWriteBuffer(SEG_ADDRESS + module, buf);
        }
    }
    /**
    * TODO: 读取电位器值。
    */
    //% blockId=read_pm block="read %module pm data"
    //% weight=65
    export function readPmData(module: ModuleIndex): number {
        pins.i2cWriteRegister(PM_ADDRESS + module, 0x00, 0x01);
        let dataL;
        let dataH;
        let data;
        dataL = pins.i2cReadRegister(PM_ADDRESS + module, 0x01, NumberFormat.UInt8LE);
        dataH = pins.i2cReadRegister(PM_ADDRESS + module, 0x02, NumberFormat.UInt8LE);
        data = dataL + dataH * 256;
        return (data)
    }
    /**
    * TODO: 读取土壤湿度值。
    */
    //% blockId=read_SoilMoisture block="read %module SoilMoisture data"
    //% weight=65
    export function readSoilMoistureData(module: ModuleIndex): number {
        pins.i2cWriteRegister(SOILMOISTURE_ADDRESS + module, 0x00, 0x01);
        let dataL;
        let dataH;
        let data;
        dataL = pins.i2cReadRegister(SOILMOISTURE_ADDRESS + module, 0x01, NumberFormat.UInt8LE);
        dataH = pins.i2cReadRegister(SOILMOISTURE_ADDRESS + module, 0x02, NumberFormat.UInt8LE);
        data = dataL + dataH * 256;
        return (data)
    }
    /**
    * TODO: 读取浊度值。
    */
    //% blockId=read_turbidity block="read %module turbidity data"
    //% weight=65
    export function readTurbidityData(module: ModuleIndex): number {
        pins.i2cWriteRegister(TURBIDITY_ADDRESS + module, 0x00, 0x01);
        let dataL;
        let dataH;
        let data;
        dataL = pins.i2cReadRegister(TURBIDITY_ADDRESS + module, 0x01, NumberFormat.UInt8LE);
        dataH = pins.i2cReadRegister(TURBIDITY_ADDRESS + module, 0x02, NumberFormat.UInt8LE);
        data = dataL + dataH * 256;
        return (data)
    }
    /**
    *TODO: 读取PH值。
    */
    //% blockId=read_ph block="read %module ph data"
    //% weight=65
    export function readPhData(module: ModuleIndex): number {
        pins.i2cWriteRegister(PH_ADDRESS + module, 0x00, 0x01);
        let dataL;
        let dataH;
        let data;
        dataL = pins.i2cReadRegister(PH_ADDRESS + module, 0x01, NumberFormat.UInt8LE);
        dataH = pins.i2cReadRegister(PH_ADDRESS + module, 0x02, NumberFormat.UInt8LE);
        data = dataL + dataH * 256;
        data = data / 10;
        return (data)
    }
    /**
    * TODO: 读取超声波值。
    */
    //% blockId=read_Distance block="read %module SonarDistance data"
    //% weight=65
    export function readDistance(module: ModuleIndex): number {
        pins.i2cWriteRegister(SONAR_ADDRESS + module, 0x00, 0x01);
        let dataL;
        let dataH;
        let data;
        dataL = pins.i2cReadRegister(SONAR_ADDRESS + module, 0x01, NumberFormat.UInt8LE);
        dataH = pins.i2cReadRegister(SONAR_ADDRESS + module, 0x02, NumberFormat.UInt8LE);
        data = dataL + dataH * 256;
        data = data / 10;
        return (data)
    }
    /**
     * TODO: 读取温湿度值。
     * @param value describe value here, eg: 5
     */
    //% blockId=read_hm block="read %module %TH value"
    //% weight=65
    export function readTempHumidity(module: ModuleIndex, TH: THMesure): number {
        pins.i2cWriteRegister(HM_ADDRESS + module, 0x00, 0x01);
        let dataL;
        let dataH;
        let humidity;
        let temperature;
        let data
        if (TH == 0) {
            dataL = pins.i2cReadRegister(HM_ADDRESS + module, 0x01, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(HM_ADDRESS + module, 0x02, NumberFormat.UInt8LE);
            humidity = dataL + dataH * 256;
            data = humidity / 10;
        }
        if (TH == 1) {
            dataL = pins.i2cReadRegister(HM_ADDRESS + module, 0x03, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(HM_ADDRESS + module, 0x04, NumberFormat.UInt8LE);
            temperature = dataL + dataH * 256;
            data = temperature / 10;
        }
        return (data);
    }

    /**
    * TODO: 读取六路ADC值。
    * @param value describe value here, eg: 5
    */
    //% blockId=read_ad block="read %index adc value"
    //% weight=65
    export function readAdcData(index: ADCIndex): number {
        pins.i2cWriteRegister(ADC_ADDRESS, 0x00, 0x01);
        let dataL;
        let dataH;
        let data;
        if (index == 0) {
            dataL = pins.i2cReadRegister(ADC_ADDRESS, 0x01, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(ADC_ADDRESS, 0x02, NumberFormat.UInt8LE);
            data = dataL + dataH * 256;
        }
        if (index == 1) {
            dataL = pins.i2cReadRegister(ADC_ADDRESS, 0x03, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(ADC_ADDRESS, 0x04, NumberFormat.UInt8LE);
            data = dataL + dataH * 256;
        }
        if (index == 2) {
            dataL = pins.i2cReadRegister(ADC_ADDRESS, 0x05, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(ADC_ADDRESS, 0x06, NumberFormat.UInt8LE);
            data = dataL + dataH * 256;
        }
        if (index == 3) {
            dataL = pins.i2cReadRegister(ADC_ADDRESS, 0x07, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(ADC_ADDRESS, 0x08, NumberFormat.UInt8LE);
            data = dataL + dataH * 256;
        }
        if (index == 4) {
            dataL = pins.i2cReadRegister(ADC_ADDRESS, 0x09, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(ADC_ADDRESS, 0x0A, NumberFormat.UInt8LE);
            data = dataL + dataH * 256;
        }
        if (index == 5) {
            dataL = pins.i2cReadRegister(ADC_ADDRESS, 0x0B, NumberFormat.UInt8LE);
            dataH = pins.i2cReadRegister(ADC_ADDRESS, 0x0C, NumberFormat.UInt8LE);
            data = dataL + dataH * 256;
        }
        return (data);
    }


    /**
    * TODO: 读取八路数字值。
    * @param value describe value here, eg: 5
    */
    //% blockId=read_digital block="read %index digital value"
    //% weight=65
    export function readDigitalData(Pin: DigitalPinIndex): number {
        pins.i2cWriteRegister(DigitalIn_ADDRESS, 0x00, 0x01);
        let data;
        if (Pin == 0) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x01, NumberFormat.UInt8LE);
        }
        if (Pin == 1) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x02, NumberFormat.UInt8LE);
        }
        if (Pin == 2) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x03, NumberFormat.UInt8LE);
        }
        if (Pin == 3) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x04, NumberFormat.UInt8LE);
        }
        if (Pin == 4) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x05, NumberFormat.UInt8LE);
        }
        if (Pin == 5) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x06, NumberFormat.UInt8LE);
        }
        if (Pin == 6) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x07, NumberFormat.UInt8LE);
        }
        if (Pin == 7) {
            data = pins.i2cReadRegister(DigitalIn_ADDRESS, 0x08, NumberFormat.UInt8LE);
        }
        return (data);
    }
    /**
    * TODO:输出八路数字值。
    * @param value describe value here, eg: 5
    */
    //% blockId=Digital_Output block="set %pin digital %state"
    //% weight=65
    export function setDigitalOutput(Pin: DigitalPinIndex, state: DigitalOutputIndex) {
        if (Pin == 0) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 1) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 2) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 3) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 4) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 5) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 6) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
        if (Pin == 7) {
            pins.i2cWriteRegister(DigitalOutPut_ADDRESS, Pin + 2, state);
        }
    }
    /**
    * TODO:控制四路舵机。
    * @param value describe value here, eg: 5
    */
    //% blockId=Serve_Output block="set %CH serve %angle"
    //% angle.min=0 angle.max=180
    //% weight=65
    export function setServeOutput(CH: ServeIndex, angle: number) {
        if (CH == 0) {
            pins.i2cWriteRegister(SERVE_ADDRESS, CH + 2, angle);
        }
        if (CH == 1) {
            pins.i2cWriteRegister(SERVE_ADDRESS, CH + 2, angle);
        }
        if (CH == 2) {
            pins.i2cWriteRegister(SERVE_ADDRESS, CH + 2, angle);
        }
        if (CH == 3) {
            pins.i2cWriteRegister(SERVE_ADDRESS, CH + 2, angle);
        }
        pause(100);
    }

}
