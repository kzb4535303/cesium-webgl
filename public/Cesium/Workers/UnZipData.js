/**
 * Cesium - https://github.com/AnalyticalGraphicsInc/cesium
 *
 * Copyright 2011-2017 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md for full licensing details.
 */
define(['./when-8d13db60', './createTaskProcessorWorker', './pako_inflate-8ea163f9'], function (when, createTaskProcessorWorker, pako_inflate) { 'use strict';

    function UnZipData(parameters, transferableObjects) {
        var buffers = parameters.data;
        var unzipBuffers = [];
        for(var i = 0;i < buffers.length;i++){
            var bufferObj = buffers[i];
            try{
                var dataZip = new Uint8Array(bufferObj.zipBuffer);
                var unzipBuffer = pako_inflate.pako.inflate(dataZip).buffer;
                transferableObjects.push(unzipBuffer);
                unzipBuffers.push({
                    unzipBuffer : unzipBuffer,
                    name : bufferObj.name
                });
            }
            catch (e){
                if(bufferObj.unzipLength === bufferObj.zippedLength){
                    unzipBuffers.push({
                        unzipBuffer : bufferObj.zipBuffer,
                        name : bufferObj.name
                    });
                }
                continue ;
            }
        }

        return {
            data : unzipBuffers
        };
    }

    var UnZipData$1 = createTaskProcessorWorker(UnZipData);

    return UnZipData$1;

});
