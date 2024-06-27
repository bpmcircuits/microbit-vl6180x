VL6180X.init()

// Sprawdź ID sensora
let sensorID = VL6180X.getID()
serial.writeLine("Sensor ID: " + sensorID)
basic.pause(2000) // Pause to show sensor ID

basic.forever(function () {
    //let status = VL6180X.readRangeStatus()
    //serial.writeLine("Status before measurement: " + status)

    let distance = VL6180X.readRange()
    if (distance != -1) {
        serial.writeLine("Distance: " + distance + " mm")
    } else {
        serial.writeLine("Error reading distance")
    }
    basic.pause(100)
})
