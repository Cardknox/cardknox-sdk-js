import { SignatureReader as PaxSignatureReader, CardReader as PaxCardReader } from "./Pax";
import { Device, DeviceIpReader, IpDeviceCommunicator } from './Device'

const MESSAGE_INPROGRESS = 'Transaction in progress';

/**
 * 
 * @param {TransactionRequest} request 
 */
export async function process(request) {
    try {
        const ipReader = new DeviceIpReader(request.settings);
        const device = new Device({
            cardReader: new PaxCardReader(
                new IpDeviceCommunicator(ipReader.getIP(), request.settings.deviceIpPort, request.settings.deviceIpProtocol || location.protocol)
            )
        });
        updateInProgress(request.settings.deviceIpAddress, device);
        const response = await device.process(request);
        inProgress[request.settings.deviceIpAddress] = undefined;
        return response;
    } catch (error) {
        if (error !== MESSAGE_INPROGRESS)
            inProgress[request.deviceIpAddress] = undefined;
        return {
            xResult: "E",
            xStatus: "Error",
            xError: error.toString()
        }
    }
}

/**
 * 
 * @param {SignatureRequest} request 
 * @returns {Promise<String>} base64-encoded PNG
 * @description returns the image *without* the data header
 */
export async function getSignature(request) {
    try {
        const ipReader = new DeviceIpReader(request);
        const device = new Device({
            signatureReader: new PaxSignatureReader(
                new IpDeviceCommunicator(ipReader.getIP(), request.deviceIpPort, request.deviceIpProtocol || location.protocol)
            )
        });
        updateInProgress(request.deviceIpAddress, device)
        const response = await device.getSignature();
        inProgress[request.deviceIpAddress] = undefined;
        return response;
    } catch (error) {
        if (error !== MESSAGE_INPROGRESS)
            inProgress[request.deviceIpAddress] = undefined;
        return {
            xResult: "E",
            xStatus: "Error",
            xError: error.toString()
        }
    }
}

export function cancel(request) {
    try {
        const ipReader = new DeviceIpReader(request);
        const device = new Device();
        device.cancel(new IpDeviceCommunicator(ipReader.getIP(), request.deviceIpPort, 'http'));
    } catch (error) {
        console.error(error)
        throw error;
    }
}

const inProgress = {};

function updateInProgress(ip, device) {
    if (inProgress[ip]) {
        throw MESSAGE_INPROGRESS;
    } else {
        inProgress[ip] = device;
    }
}