Rangefinder.init()

def on_forever():
    serial.write_line("" + str(Rangefinder.distance()))
    basic.pause(100)
basic.forever(on_forever)
