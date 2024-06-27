namespace VL6180X {
    let address = 0x29

    function writeReg(reg: number, value: number): void {
        let buf = pins.createBuffer(3)
        buf[0] = reg >> 8
        buf[1] = reg & 0xFF
        buf[2] = value
        pins.i2cWriteBuffer(address, buf)
    }

    function writeReg16(reg: number, value: number): void {
        let buf = pins.createBuffer(4)
        buf[0] = reg >> 8
        buf[1] = reg & 0xFF
        buf[2] = value >> 8
        buf[3] = value & 0xFF
        pins.i2cWriteBuffer(address, buf)
    }

    function readReg(reg: number): number {
        pins.i2cWriteNumber(address, reg, NumberFormat.UInt16BE, true)
        return pins.i2cReadNumber(address, NumberFormat.UInt8BE, false)
    }

    function readReg16(reg: number): number {
        pins.i2cWriteNumber(address, reg, NumberFormat.UInt16BE, true)
        return pins.i2cReadNumber(address, NumberFormat.UInt16BE, false)
    }

    function loadSettings(): void {
        writeReg(0x0207, 0x01)
        writeReg(0x0208, 0x01)
        writeReg(0x0096, 0x00)
        writeReg(0x0097, 0xfd)
        writeReg(0x00e3, 0x00)
        writeReg(0x00e4, 0x04)
        writeReg(0x00e5, 0x02)
        writeReg(0x00e6, 0x01)
        writeReg(0x00e7, 0x03)
        writeReg(0x00f5, 0x02)
        writeReg(0x00d9, 0x05)
        writeReg(0x00db, 0xce)
        writeReg(0x00dc, 0x03)
        writeReg(0x00dd, 0xf8)
        writeReg(0x009f, 0x00)
        writeReg(0x00a3, 0x3c)
        writeReg(0x00b7, 0x00)
        writeReg(0x00bb, 0x3c)
        writeReg(0x00b2, 0x09)
        writeReg(0x00ca, 0x09)
        writeReg(0x0198, 0x01)
        writeReg(0x01b0, 0x17)
        writeReg(0x01ad, 0x00)
        writeReg(0x00ff, 0x05)
        writeReg(0x0100, 0x05)
        writeReg(0x0199, 0x05)
        writeReg(0x01a6, 0x1b)
        writeReg(0x01ac, 0x3e)
        writeReg(0x01a7, 0x1f)
        writeReg(0x0030, 0x00)

        writeReg(0x0011, 0x10) // Enables polling for 'New Sample ready'
        writeReg(0x010A, 0x30) // Set the averaging sample period
        writeReg(0x003F, 0x46) // Sets the light and dark gain (upper nibble)
        writeReg(0x0031, 0xFF) // sets the # of range measurements after which auto calibration of system is performed
        writeReg(0x0040, 0x63) // Set ALS integration time to 100ms
        writeReg(0x002E, 0x01) // perform a single temperature calibration of the ranging sensor

        writeReg(0x001B, 0x09) // Set default ranging inter-measurement period to 100ms
        writeReg(0x003E, 0x31) // Set default ALS inter-measurement period to 500ms
        writeReg(0x0014, 0x24) // Configures interrupt on 'New Sample Ready threshold event'
    }

    export function init(): void {
        serial.writeLine("Initializing sensor...")
        if (readReg(0x000) != 0xB4) {
            serial.writeLine("Failed to find expected ID register value.")
            return
        }
        loadSettings()
        writeReg(0x016, 0x00) // SYSTEM_FRESH_OUT_OF_RESET
    }

    export function setAddress(newAddr: number): void {
        writeReg(0x212, newAddr)
        address = newAddr
    }

    export function getAddress(): number {
        return address
    }

    export function readRange(): number {
        startRange()
        while (!isRangeComplete()) {
            basic.pause(1)
        }
        return readRangeResult()
    }

    export function readLux(gain: number): number {
        writeReg(0x03F, gain)
        writeReg(0x038, 0x01) // SYSALS_START
        basic.pause(10)
        while ((readReg(0x04F) & 0x04) == 0) {
            basic.pause(1)
        }
        let lux = readReg16(0x050) // RESULT_ALS_VAL
        writeReg(0x015, 0x07) // SYSTEM_INTERRUPT_CLEAR
        return lux * 0.32 // Adjust as needed
    }

    export function readRangeStatus(): number {
        return readReg(0x04D) >> 4 // RESULT_RANGE_STATUS
    }

    export function startRange(): void {
        writeReg(0x018, 0x01) // SYSRANGE_START
    }

    export function isRangeComplete(): boolean {
        return (readReg(0x04F) & 0x04) != 0 // RESULT_INTERRUPT_STATUS_GPIO
    }

    export function waitRangeComplete(): boolean {
        while (!isRangeComplete()) {
            basic.pause(1)
        }
        return true
    }

    export function readRangeResult(): number {
        let range = readReg(0x062) // RESULT_RANGE_VAL
        writeReg(0x015, 0x07) // SYSTEM_INTERRUPT_CLEAR
        return range
    }

    export function startRangeContinuous(period_ms: number): void {
        writeReg(0x018, 0x03) // SYSRANGE_START
        writeReg16(0x001C, period_ms)
    }

    export function stopRangeContinuous(): void {
        writeReg(0x018, 0x01) // SYSRANGE_START
    }

    export function setOffset(offset: number): void {
        writeReg(0x024, offset) // SYSRANGE_PART_TO_PART_RANGE_OFFSET
    }

    export function getID(): number {
        return readReg(0x000) // IDENTIFICATION_MODEL_ID
    }
}
