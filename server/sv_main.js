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

function TriggerNetworkEvent(pName, pPlayerId, pTimeout, ...args) {
    if (typeof pTimeout == 'undefined') { pTimeout = 5000 }
    if (typeof pName !== 'string') { throw new Error('Parameter "name" must be a string!') }
    if (typeof pPlayerId !== 'number') { throw new Error('Parameter "playerId" must be a number!') }

    let requestId = currentRequestId
    let requestName = pName + requestId.toString()
    currentRequestId++

    if (currentRequestId >= 65536) { currentRequestId = 0 }

    callbackResponses[requestName] = true
    emitNet("callback:receive:client", pPlayerId, pName, requestId, { args })

    let data = callbackResponses[requestName]
    callbackResponses[requestName] = null
    return UnpackArray(data)
}

Register = (pName, pCallback) => {
    if (typeof pName !== 'string') { throw new Error('Parameter "name" must be a string!') }
    if (typeof pCallback !== 'function') { throw new Error('Parameter "callback" must be a function!') }

    callbacks[pName] = pCallback
}

Call = (pName, playerId, ...args) => {
    if (typeof pName !== 'string') { throw new Error('Parameter "name" must be a string!') }
    if (typeof playerId !== 'number') { throw new Error('Parameter "playerId" must be a number!') }

    TriggerNetworkEvent(pName, playerId, 5000, args)
}

RegisterNetEvent('callback:receive:server')
onNet('callback:receive:server', (pName, pRequestId, pData) => {
    let src = global.source;
    let requestName = pName + pRequestId.toString();

    if (callbacks[pName] != null) {
        let result = [callbacks[pName](src, UnpackArray(pData))]
        console.log(result)
        emitNet('callback:response:client', src, requestName, result)
    } else {
        throw new Error('Callback ' + pName + ' not found!');
    }
})

RegisterNetEvent('callback:response:server');
onNet('callback:response:server', (requestName, data) => {
    if (callbackResponses[requestName] != null) {
        callbackResponses[requestName] = data;
    }
})

exports('Register', Register)
exports('Call', Call)