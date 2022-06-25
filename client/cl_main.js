let [ callbacks, callbackResponses, currentRequestId ] = [ {}, {}, 0 ]

const Procedures = {}

const UnpackArray = (...pArray) => {
    let t = [];

    for (let index = 0; index < pArray.length; index++) {
        t.push(pArray[index]);
    }

    return t;
}

const InArray = (...pValues) => {
    for (let index = 0; index < pValues.length; index++) {
        if (pValues[index] == null) {
            return true;
        }
    }

    return false;
}

function TriggerNetworkEvent(pName, pTimeout, ...args) {
    if (typeof pTimeout == 'undefined') { pTimeout = 5000 }
    if (typeof pName !== 'string') { throw new Error('Parameter "name" must be a string!') }

    let requestId = currentRequestId
    let requestName = pName + requestId.toString()
    currentRequestId++

    if (currentRequestId >= 65536) { currentRequestId = 0 }

    callbackResponses[requestName] = true
    emitNet("callback:receive:server", pName, requestId, { args })

    let data = callbackResponses[requestName]
    callbackResponses[requestName] = null
    return UnpackArray(data)
}

Register = (pName, pCallback) => {
    if (typeof pName !== 'string') { throw new Error('Parameter "name" must be a string!') }
    if (typeof pCallback !== 'function') { throw new Error('Parameter "callback" must be a function!') }

    callbacks[pName] = pCallback
}

Call = (pName, ...args) => {
    TriggerNetworkEvent(pName, 5000, args)
}

RegisterNetEvent('callback:receive:client')
onNet('callback:receive:client', (pName, pRequestId, pData) => {
    let requestName = pName + pRequestId.toString();

    if (callbacks[pName] != null) {
        let result = callbacks[pName](UnpackArray(pData));
        emitNet('callback:response:server', requestName, result)
    } else {
        throw new Error('Callback ' + pName + ' not found!');
    }
})

RegisterNetEvent('callback:response:client')
onNet('callback:response:client', (requestName, data) => {
    if (callbackResponses[requestName] != null) {
        callbackResponses[requestName] = data;
    }
})

exports('Register', Register)
exports('Call', Call)
