var mraa = require('mraa');
var exec = require('child_process').exec;
var touchSensorDriver = require('jsupm_mpr121');
var ReadWriteLock = require('rwlock');

var lock = new ReadWriteLock();

var touchSensor = new touchSensorDriver.MPR121(touchSensorDriver.MPR121_I2C_BUS, touchSensorDriver.MPR121_DEFAULT_I2C_ADDR);
touchSensor.configAN3944();

var touchInterruptPin = new mraa.Gpio(8);
touchInterruptPin.dir(mraa.DIR_IN);
touchInterruptPin.isr(mraa.EDGE_BOTH, isrCallback);

var isrTriggered = false;

var inactivityCount = 0;
var inactivityThreshold = 5;

function isrCallback() {
    lock.readLock(function (release) {
        // do stuff
        if (!isrTriggered) {

            lock.writeLock(function (release) {
                // do stuff
                isrTriggered = true;

                release();
            });
        }
        logger("ISR callback");

        release();
    });
}

setTimeout(main, 1000);

function main() {
    lock.readLock(function (release) {
        if (isrTriggered) {
            // do work
            logger("doing work for 5s");
            setTimeout(work, 5000);
        } else {
            logger("No ISR. Waiting...");
            setTimeout(main, 1000);
        }
    });
}

function work() {
    lock.writeLock(function (release) {
        // do stuff
        isrTriggered = false;

        release();
    });
    setTimeout(main, 1000);
}

function incrementInactivityCount() {

    inactivityCount = inactivityCount + 1;
    logger("Inactivity count " + inactivityCount);
    if (inactivityCount >= inactivityThreshold) {
        resetInactivityCount();
        sleep();
    } else {
        setTimeout(incrementInactivityCount, 1000);
    }
}
function resetInactivityCount() {
    inactivityCount = 0;
}


function logger(msg) {
    console.log(msg);
}

function sleep() {
    var command = "/home/root/scripts/sleep.sh";
    exec(command, function (error, stdout, stderr) {
        if (!error) {
            logger("Command " + command + " executed successfully\n" + stdout);
        } else {
            logger("ERROR  " + stderr + stderr);
        }
    });
}

function heartbeat() {
    logger("beep");
}

setInterval(heartbeat, 10000);




